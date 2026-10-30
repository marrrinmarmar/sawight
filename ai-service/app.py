import os
import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
from db import save_batch_to_db, init_db

# Pastikan skema tabel di PostgreSQL siap
try:
    init_db()
except Exception as e:
    print(f"[DB Init Warning] {e}")

app = FastAPI(
    title="Sawight AI Engine",
    description="Python Machine Learning & Real Report Analysis Engine untuk Pabrik CPO",
    version="2.0.0"
)

# Aktifkan CORS agar Next.js dan frontend lain bisa langsung fetch tanpa kendala
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_PATH = os.path.join(os.path.dirname(__file__), "models", "palm_classifier.joblib")

class PalmBatchData(BaseModel):
    batch_id: Optional[str] = "LOT-UNKNOWN"
    lokasi_kebun: Optional[str] = "Kebun Sawit"
    tanggal_panen: Optional[str] = None
    lama_penyimpanan_jam: float = Field(..., example=12.0)
    warna: str = Field(..., example="Sangat Merah Kecoklatan")
    viskositas_mPa_s: float = Field(..., example=45.0)
    pH: float = Field(..., example=6.2)
    kadar_ffa_percent: float = Field(..., example=2.1)
    moisture_percent: float = Field(..., example=0.2)
    berat_ton: float = Field(..., example=25.0)

class EvaluationDetails(BaseModel):
    tanggal_panen: str
    lama_penyimpanan_jam: float
    warna: str
    viskositas_mPa_s: float
    pH: float
    kadar_ffa_percent: float
    moisture_percent: float
    berat_ton: float
    lokasi_kebun: str
    estimated_value_idr: int
    co2_reduction_kg: int
    active_flow_paths: List[str]
    evaluated_at: str
    engine_version: str
    engine_mode: str

class FullPalmEvaluation(BaseModel):
    batch_id: str
    track_type: str  # "DEFAULT" | "FLEX"
    primary_recommendation: str
    category: str    # "CPO_DEFAULT" | "BIO_ECO_FRIENDLY" | "OTHER_PRODUCTS"
    confidence_score: float
    alternate_recommendation: str
    ai_explanation: str
    action_steps: List[str]
    details: EvaluationDetails

def get_model():
    if not os.path.exists(MODEL_PATH):
        raise HTTPException(
            status_code=503,
            detail="Model ML belum dilatih. Jalankan 'python train.py' terlebih dahulu."
        )
    return joblib.load(MODEL_PATH)

def generate_real_report(batch: PalmBatchData, ml_pred: Optional[str], ml_conf: Optional[float]) -> FullPalmEvaluation:
    """
    Logika Analisis Real Report berbasis parameter Fisikokimia CPO,
    Standar Industri SNI 7709 / PORAM, dan Valuasi Finansial & Jejak Karbon.
    """
    now = pd.Timestamp.now()
    default_id = f"LOT-{now.strftime('%Y%m%d-%H%M')}"
    b_id = batch.batch_id if (batch.batch_id and batch.batch_id != "LOT-UNKNOWN") else default_id
    tanggal_panen = batch.tanggal_panen or now.isoformat()
    lokasi = batch.lokasi_kebun or "Kebun Sawit Utama"
    ffa = batch.kadar_ffa_percent
    hold_time = batch.lama_penyimpanan_jam
    ph = batch.pH
    moisture = batch.moisture_percent
    visk = batch.viskositas_mPa_s
    berat = batch.berat_ton
    warna = batch.warna

    active_paths = ["path-1", "path-2", "path-3"]

    # Aturan Baku SNI / PORAM
    is_default_cpo = (
        hold_time <= 24 and
        ffa <= 5.0 and
        5.5 <= ph <= 6.8 and
        warna in ["Sangat Merah Kecoklatan", "Kuning Emas"]
    )

    if is_default_cpo:
        track_type = "DEFAULT"
        category = "CPO_DEFAULT"
        active_paths.append("path-default")

        if ffa <= 2.5 and hold_time <= 16:
            primary = "Minyak Sawit Konsumsi Super (Cooking Oil Grade A - SNI 7709)"
            alternate = "Biofuel HVO Premium (Green Aviation Fuel Blend)"
            conf = min(99.0, round(98.5 - (ffa * 1.5) - (hold_time * 0.15), 1))
            val_idr = int(round(berat * 14_800_000))
            co2_kg = int(round(berat * 620))
            explanation = (
                f"Lot {b_id} dipanen segar dengan hold time {hold_time:g} jam. "
                f"Kadar FFA {ffa:.2f}% dan pH {ph:.2f} berada pada mutu prima SNI 7709 (Cooking Oil Grade A). "
                f"Integritas trigliserida optimal untuk fraksinasi olein minyak goreng konsumsi."
            )
            actions = [
                "Lakukan sterilisasi TBS pada tekanan 3.0 bar selama 90 menit untuk inaktivasi enzim lipase.",
                "Ekstraksi minyak menggunakan screw press kemudian alirkan ke tangki klarifikasi.",
                "Arahkan CPO ke unit Refinery & Fraksinasi pangan untuk pemurnian Olein dan Stearin."
            ]
        else:
            primary = "Produksi Minyak Sawit Standar (CPO Pangan / PORAM Standard)"
            alternate = "Biofuel Biodiesel Mandat B35/B40"
            conf = min(96.0, round(95.0 - (ffa * 1.8) - (hold_time * 0.25), 1))
            val_idr = int(round(berat * 13_500_000))
            co2_kg = int(round(berat * 580))
            explanation = (
                f"Lot {b_id} memenuhi seluruh spesifikasi CPO standar pangan "
                f"(FFA {ffa:.2f}% <= 5%, Hold Time {hold_time:g} jam <= 24 jam). "
                f"Trigliserida stabil dengan laju peroksida terkendali."
            )
            actions = [
                "Sterilisasi cepat TBS untuk mencegah kenaikan FFA lebih lanjut.",
                "Lakukan pemurnian centrifuge dan vakum drying untuk menjaga kadar air <= 0.25%.",
                "Kirim ke tangki timbun CPO untuk pengapalan ekspor atau refinery domestik."
            ]
    else:
        track_type = "FLEX"
        active_paths.append("path-flex")

        is_bio = (ffa <= 15.0 and ph >= 4.9 and hold_time <= 65)
        if is_bio:
            category = "BIO_ECO_FRIENDLY"
            active_paths.extend(["path-bio-yes", "path-diolah"])

            if ffa <= 6.0 and ph >= 5.6 and moisture <= 0.4:
                primary = "Renewable Diesel (HVO / Green Diesel) & Bio-Aviation SAF"
                alternate = "Biodiesel FAME Mandat B35/B40"
                conf = min(97.0, round(96.0 - (ffa * 1.2) - (moisture * 5), 1))
                val_idr = int(round(berat * 15_200_000))
                co2_kg = int(round(berat * 1850))
                explanation = (
                    f"Meskipun penyimpanan {hold_time:g} jam melampaui batas minyak makan, profil FFA ({ffa:.2f}%) "
                    f"dan kelembaban ({moisture:.2f}%) sangat ideal untuk proses hydrotreated vegetable oil (HVO) "
                    f"tanpa meracuni katalis Ni-Mo/Al2O3."
                )
                actions = [
                    "Pre-treatment deep degumming untuk memangkas kandungan fosfor (P < 5 ppm) dan logam alkali.",
                    "Arahkan ke reaktor hydrodeoxygenation (HDO) katalitik suhu 320-380°C pada tekanan 60 bar.",
                    "Lakukan hydroisomerization untuk menghasilkan Green Diesel berangka setana > 70."
                ]
            elif visk >= 65 or warna == "Teroksidasi Gelap" or (ffa > 10.0 and visk >= 60):
                primary = "Bioplastik & Polimer Alami (PHA / Polyhydroxyalkanoates)"
                alternate = "Biofuel Biodiesel FAME B35 / Bio-Pellet"
                conf = min(94.0, round(91.0 - abs(visk - 75) * 0.15, 1))
                val_idr = int(round(berat * 11_800_000))
                co2_kg = int(round(berat * 1250))
                explanation = (
                    f"Viskositas tinggi ({visk:.1f} mPa.s) dengan fraksi asam lemak bebas ({ffa:.2f}%) "
                    f"menjadikan batch ini substrat karbon ideal bagi kultur mikroba sintesis bioplastik terurai 100%."
                )
                actions = [
                    "Emulsifikasi bahan baku dengan homogenizer tekanan tinggi menjadi media cair mineral.",
                    "Inokulasi ke dalam bioreaktor fermentasi kultur bakteri PHA selama 48 jam.",
                    "Lisis sel mikroba secara enzimatik ramah lingkungan dan cetak butiran resin bioplastik."
                ]
            else:
                primary = "Biofuel Biodiesel FAME (Fatty Acid Methyl Ester) Mandat B35/B40"
                alternate = "Sabun Organik Ramah Lingkungan / Bio-Surfactant"
                conf = min(95.0, round(93.5 - ffa * 0.8, 1))
                val_idr = int(round(berat * 13_000_000))
                co2_kg = int(round(berat * 1480))
                explanation = (
                    f"Kandungan FFA sebesar {ffa:.2f}% dan waktu simpan {hold_time:g} jam telah melebihi standar CPO konsumsi, "
                    f"namun sangat ideal untuk reaksi transesterifikasi biodiesel FAME (SNI 7182)."
                )
                actions = [
                    "Lakukan pra-pengolahan esterifikasi asam (metanol + H2SO4) untuk mereduksi FFA hingga < 1%." if ffa > 6.0 else "Lewati pra-esterifikasi dan langsung proses ke reaktor transesterifikasi basa.",
                    "Transesterifikasi menggunakan Sodium Metoksida (CH3ONa) pada suhu 65°C.",
                    "Sentrifugasi pemisahan fase metil ester atas dan fase gliserol mentah bawah.",
                    "Dry washing dengan adsorben ion-exchange resin untuk mencapai standar kemurnian B35/B40."
                ]
        else:
            category = "OTHER_PRODUCTS"
            active_paths.append("path-bio-no")

            if ffa <= 18.0 and ph >= 4.6:
                primary = "Oleokimia Industri Non-Biofuel (Fatty Acids & Glycerol Splitting)"
                alternate = "Pakan Ternak Formula Kalsium (Bypass Fat)"
                conf = min(93.0, round(91.5 - ffa * 0.5, 1))
                val_idr = int(round(berat * 10_200_000))
                co2_kg = int(round(berat * 460))
                explanation = (
                    f"Tingkat hidrolisis lanjutan (FFA {ffa:.2f}%, hold time {hold_time:g} jam) tidak lagi efisien untuk biofuel, "
                    f"namun bernilai tinggi untuk splitting termal asam lemak murni (palmitat, stearat, dan oleat)."
                )
                actions = [
                    "Kirim bahan baku ke unit Thermal Fat Splitting (Colgate-Emery) suhu 250°C, 50 bar.",
                    "Ekstraksi sweet water untuk evaporasi menjadi gliserin teknis.",
                    "Distilasi fraksional vakum asam lemak untuk pelumas industri dan lilin sintetis."
                ]
            elif ffa <= 22.0 and ph >= 4.3:
                primary = "Pakan Ternak Tinggi Energi (Palm Calcium Soap / Bypass Fat)"
                alternate = "Pupuk Kompos Biologis & Biogas Metana"
                conf = min(92.0, round(89.0 - ffa * 0.4, 1))
                val_idr = int(round(berat * 8_200_000))
                co2_kg = int(round(berat * 340))
                explanation = (
                    f"Batch dengan FFA tinggi ({ffa:.2f}%) dan pH {ph:.2f} menyimpan densitas kalori brutto ~9.000 kkal/kg "
                    f"yang dapat diproteksi menjadi sabun kalsium rumen-bypass untuk pakan sapi perah dan ternak."
                )
                actions = [
                    "Penyaringan mekanis dan pasteurisasi pada suhu 85°C untuk mematikan mikroba patogen.",
                    "Reaksikan asam lemak bebas dengan Kalsium Oksida (CaO) membentuk garam kalsium kationik.",
                    "Prilling dan granulasi menjadi butiran pakan padat kering."
                ]
            else:
                primary = "Pupuk Kompos Biologis & Pembangkit Biogas Metana"
                alternate = "Pembuangan Residu Terkontrol (Safe Bio-Incineration)"
                conf = 95.0
                val_idr = int(round(berat * 4_800_000))
                co2_kg = int(round(berat * 890))
                explanation = (
                    f"Batch mengalami degradasi biologis berat (FFA {ffa:.2f}%, pH asam {ph:.2f}, hold time {hold_time:g} jam). "
                    f"Sangat efektif dialirkan ke biodigester anaerobik untuk gas metana dan kompos kaya N-P-K."
                )
                actions = [
                    "Alirkan substrat ke dalam CSTR Anaerobic Biodigester untuk penangkapan gas metana listrik.",
                    "Campurkan bio-slurry hasil digestasi dengan cacahan tandan kosong kelapa sawit (EFB).",
                    "Lakukan windrow composting aerobik selama 35 hari hingga matang sempurna untuk kebun."
                ]

    # Kalibrasi dengan ML confidence jika ada
    if ml_conf:
        conf = round((conf * 0.7) + (ml_conf * 0.3), 1)

    return FullPalmEvaluation(
        batch_id=b_id,
        track_type=track_type,
        primary_recommendation=primary,
        category=category,
        confidence_score=conf,
        alternate_recommendation=alternate,
        ai_explanation=explanation,
        action_steps=actions,
        details=EvaluationDetails(
            tanggal_panen=tanggal_panen,
            lama_penyimpanan_jam=hold_time,
            warna=warna,
            viskositas_mPa_s=visk,
            pH=ph,
            kadar_ffa_percent=ffa,
            moisture_percent=moisture,
            berat_ton=berat,
            lokasi_kebun=lokasi,
            estimated_value_idr=val_idr,
            co2_reduction_kg=co2_kg,
            active_flow_paths=active_paths,
            evaluated_at=pd.Timestamp.now().isoformat(),
            engine_version="Sawight Real Report Engine v2.0 (Full Python)",
            engine_mode="Python Real Report Analyzer + ML"
        )
    )

@app.get("/")
def health_check():
    model_ready = os.path.exists(MODEL_PATH)
    return {
        "status": "healthy",
        "service": "Sawight Full Python AI & Real Report Engine",
        "model_loaded": model_ready
    }

@app.post("/predict", response_model=FullPalmEvaluation)
@app.post("/webhook/predict", response_model=FullPalmEvaluation)
@app.post("/api/analyze", response_model=FullPalmEvaluation)
def analyze_batch_report(payload: dict):
    """
    Endpoint Utama Full Python:
    Menerima parameter kualitas CPO langsung dari Web Next.js,
    menghitung Rekomendasi Alokasi, Estimasi Valuasi Finansial (IDR),
    Potensi Pengurangan Emisi Karbon (kg CO2), dan Langkah Tindakan Pabrik.
    """
    # Ekstraksi otomatis format bersarang atau langsung
    raw_data = payload
    if "body" in payload and isinstance(payload["body"], dict):
        raw_data = payload["body"]
    if "data" in raw_data and isinstance(raw_data["data"], dict):
        batch_dict = raw_data["data"]
    else:
        batch_dict = raw_data

    batch = PalmBatchData(**batch_dict)

    # Jalankan Machine Learning Inference untuk cross-check probabilitas
    ml_category = None
    ml_confidence = None
    if os.path.exists(MODEL_PATH):
        try:
            model = get_model()
            input_df = pd.DataFrame([{
                "lama_penyimpanan_jam": batch.lama_penyimpanan_jam,
                "warna": batch.warna,
                "viskositas_mPa_s": batch.viskositas_mPa_s,
                "pH": batch.pH,
                "kadar_ffa_percent": batch.kadar_ffa_percent,
                "moisture_percent": batch.moisture_percent,
                "berat_ton": batch.berat_ton,
            }])
            probs = model.predict_proba(input_df)[0]
            best_idx = probs.argmax()
            ml_category = model.classes_[best_idx]
            ml_confidence = float(probs[best_idx] * 100)
        except Exception as e:
            print(f"[ML Inference Warning] {e}")

    # Generate Full Real Report
    report = generate_real_report(batch, ml_category, ml_confidence)

    # Otomatis Simpan ke Database PostgreSQL
    try:
        save_batch_to_db(report.dict())
    except Exception as e:
        print(f"[DB Save Warning] Gagal menyimpan batch ke PostgreSQL: {e}")

    return report
