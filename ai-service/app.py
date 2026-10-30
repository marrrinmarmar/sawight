import os
import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional

app = FastAPI(
    title="Sawight AI Service",
    description="Webhook & Inference Service untuk rekomendasi alokasi mutu CPO terintegrasi n8n",
    version="1.0.0"
)

MODEL_PATH = os.path.join(os.path.dirname(__file__), "models", "palm_classifier.joblib")

# Label Mapping untuk Rekomendasi & Action Steps
RECOMMENDATION_MAPPING = {
    "CPO_SUPER": {
        "primary": "Minyak Sawit Konsumsi Super (Cooking Oil Grade A - SNI 7709)",
        "alternate": "Biofuel HVO Premium (Green Aviation Fuel Blend)",
        "actions": [
            "Sterilisasi TBS 90 menit pada 3.0 bar.",
            "Ekstraksi screw press dan pemurnian klarifikasi.",
            "Refinery dan fraksinasi Olein super."
        ]
    },
    "CPO_DEFAULT": {
        "primary": "Produksi Minyak Sawit Standar (CPO Pangan / PORAM Standard)",
        "alternate": "Biofuel Biodiesel Mandat B35/B40",
        "actions": [
            "Sterilisasi cepat TBS untuk mencegah kenaikan FFA.",
            "Pemurnian centrifuge dan vakum drying.",
            "Kirim ke tangki timbun CPO ekspor."
        ]
    },
    "BIOFUEL": {
        "primary": "Biofuel Biodiesel Mandat B35/B40",
        "alternate": "Bahan Baku Oleochemical & Sabun Industri",
        "actions": [
            "Alirkan ke tangki pre-treatment esterifikasi.",
            "Proses transesterifikasi biodiesel FAME.",
            "Pemisahan gliserol murni."
        ]
    },
    "OLEOCHEMICAL": {
        "primary": "Bahan Baku Oleochemical & Sabun Industri",
        "alternate": "Pakan Ternak & Pemulihan Energi Biogas",
        "actions": [
            "Splitting asam lemak dan gliserin.",
            "Fraksinasi fatty acid untuk bahan baku deterjen & sabun.",
            "Netralisasi limbah kondensat."
        ]
    }
}

class PalmBatchInput(BaseModel):
    batch_id: Optional[str] = "LOT-UNKNOWN"
    lokasi_kebun: Optional[str] = "Kebun Sawit"
    lama_penyimpanan_jam: float = Field(..., example=8.0)
    warna: str = Field(..., example="Sangat Merah Kecoklatan")
    viskositas_mPa_s: float = Field(..., example=44.0)
    pH: float = Field(..., example=6.4)
    kadar_ffa_percent: float = Field(..., example=1.65)
    moisture_percent: float = Field(..., example=0.15)
    berat_ton: float = Field(..., example=42.5)

class PredictionResponse(BaseModel):
    batch_id: Optional[str]
    category: str
    primary_recommendation: str
    alternate_recommendation: str
    confidence_score: float
    ai_explanation: str
    action_steps: List[str]

def get_model():
    if not os.path.exists(MODEL_PATH):
        raise HTTPException(
            status_code=503,
            detail="Model ML belum dilatih. Jalankan 'python train.py' terlebih dahulu."
        )
    return joblib.load(MODEL_PATH)

@app.get("/")
def health_check():
    model_ready = os.path.exists(MODEL_PATH)
    return {
        "status": "healthy",
        "service": "Sawight AI ML Inference",
        "model_loaded": model_ready
    }

@app.post("/webhook/predict", response_model=PredictionResponse)
def predict_batch(payload: PalmBatchInput):
    """
    Endpoint Webhook yang dipanggil oleh n8n.
    Menerima parameter batch, melakukan inferensi ML, dan mengembalikan alokasi mutu.
    """
    model = get_model()

    # Siapkan DataFrame untuk inferensi
    input_data = pd.DataFrame([{
        "lama_penyimpanan_jam": payload.lama_penyimpanan_jam,
        "warna": payload.warna,
        "viskositas_mPa_s": payload.viskositas_mPa_s,
        "pH": payload.pH,
        "kadar_ffa_percent": payload.kadar_ffa_percent,
        "moisture_percent": payload.moisture_percent,
        "berat_ton": payload.berat_ton,
    }])

    # 1. Hard Rule Guardrail (Sesuai Regulasi Standar Pangan)
    if payload.kadar_ffa_percent > 5.0:
        predicted_category = "BIOFUEL"
        confidence = 94.0
        explanation = f"Kadar FFA tinggi ({payload.kadar_ffa_percent}%) melebihi ambang batas pangan 5.0%. Dialokasikan ke lini Biofuel/Oleokimia."
    else:
        # 2. Machine Learning Inference
        probabilities = model.predict_proba(input_data)[0]
        classes = model.classes_
        best_idx = probabilities.argmax()
        predicted_category = classes[best_idx]
        confidence = round(float(probabilities[best_idx]) * 100, 1)

        explanation = (
            f"Model ML mengidentifikasi batch ini masuk kategori {predicted_category} "
            f"dengan tingkat keyakinan {confidence}% berdasarkan FFA {payload.kadar_ffa_percent}%, "
            f"kadar air {payload.moisture_percent}%, dan hold time {payload.lama_penyimpanan_jam} jam."
        )

    # Ambil metadata rekomendasi & action steps
    meta = RECOMMENDATION_MAPPING.get(predicted_category, RECOMMENDATION_MAPPING["CPO_DEFAULT"])

    return PredictionResponse(
        batch_id=payload.batch_id,
        category=predicted_category,
        primary_recommendation=meta["primary"],
        alternate_recommendation=meta["alternate"],
        confidence_score=confidence,
        ai_explanation=explanation,
        action_steps=meta["actions"]
    )
