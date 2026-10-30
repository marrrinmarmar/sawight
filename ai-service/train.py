import os
import json
import joblib
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.pipeline import Pipeline
from sklearn.metrics import classification_report

from db import fetch_training_data_from_db

MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")
MODEL_PATH = os.path.join(MODEL_DIR, "palm_classifier.joblib")

NUMERIC_FEATURES = [
    "lama_penyimpanan_jam",
    "viskositas_mPa_s",
    "pH",
    "kadar_ffa_percent",
    "moisture_percent",
    "berat_ton",
]

CATEGORICAL_FEATURES = ["warna"]

def load_data():
    """
    Mengambil data dari PostgreSQL. Jika database belum siap,
    otomatis fallback menggunakan data sampel 'data/factory.json'.
    """
    try:
        print("[DB] Mencoba mengambil dataset pelatihan dari PostgreSQL...")
        df = fetch_training_data_from_db()
        if len(df) > 5:
            print(f"[DB] Berhasil memuat {len(df)} data dari PostgreSQL.")
            return df
    except Exception as e:
        print(f"[WARN] Gagal membaca dari PostgreSQL ({e}). Menggunakan data fallback lokal.")

    # Fallback ke data JSON lokal proyek
    json_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "factory.json"))
    with open(json_path, "r", encoding="utf-8") as f:
        records = json.load(f)
    return pd.DataFrame(records)

def train():
    df = load_data()

    # Pastikan kolom target ada
    target_col = "category"
    if target_col not in df.columns:
        raise ValueError(f"Kolom target '{target_col}' tidak ditemukan.")

    # Filter baris yang memiliki nilai target
    df = df.dropna(subset=[target_col])

    X = df[NUMERIC_FEATURES + CATEGORICAL_FEATURES]
    y = df[target_col]

    # Preprocessing Pipeline
    preprocessor = ColumnTransformer(
        transformers=[
            ("num", StandardScaler(), NUMERIC_FEATURES),
            ("cat", OneHotEncoder(handle_unknown="ignore"), CATEGORICAL_FEATURES),
        ]
    )

    # Model Pipeline (RandomForest / GradientBoosting)
    model = Pipeline(
        steps=[
            ("preprocessor", preprocessor),
            ("classifier", RandomForestClassifier(n_estimators=100, random_state=42)),
        ]
    )

    # Train / Test split jika data cukup
    if len(df) >= 10:
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        model.fit(X_train, y_train)
        preds = model.predict(X_test)
        print("\n=== Laporan Evaluasi Model ===")
        print(classification_report(y_test, preds, zero_division=0))
    else:
        # Jika data masih sedikit, latih semua sampel
        model.fit(X, y)
        print(f"[INFO] Model dilatih dengan {len(X)} sampel data.")

    # Simpan model
    os.makedirs(MODEL_DIR, exist_ok=True)
    joblib.dump(model, MODEL_PATH)
    print(f"[SUCCESS] Model tersimpan di: {MODEL_PATH}")

if __name__ == "__main__":
    train()
