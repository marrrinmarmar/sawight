import os
from dotenv import load_dotenv
import pandas as pd
from sqlalchemy import create_engine, text

load_dotenv()

DB_HOST = os.getenv("DB_HOST", "100.112.211.55")
DB_PORT = os.getenv("DB_PORT", "35432")
DB_NAME = os.getenv("DB_NAME", "sawight_db")
DB_USER = os.getenv("DB_USER", "dhandy")
DB_PASSWORD = os.getenv("DB_PASSWORD", "dhandy4455")

DATABASE_URL = f"postgresql+psycopg2://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

def get_engine():
    """Membuat SQLAlchemy engine untuk koneksi PostgreSQL."""
    return create_engine(DATABASE_URL)

def init_db():
    """
    Membuat tabel palm_batches di PostgreSQL jika belum ada.
    """
    create_table_query = """
    CREATE TABLE IF NOT EXISTS palm_batches (
        id SERIAL PRIMARY KEY,
        batch_id VARCHAR(100) UNIQUE NOT NULL,
        lokasi_kebun VARCHAR(255),
        tanggal_panen TIMESTAMP,
        lama_penyimpanan_jam NUMERIC(10, 2),
        warna VARCHAR(100),
        viskositas_mPa_s NUMERIC(10, 2),
        pH NUMERIC(10, 2),
        kadar_ffa_percent NUMERIC(10, 2),
        moisture_percent NUMERIC(10, 2),
        berat_ton NUMERIC(10, 2),
        track_type VARCHAR(50),
        category VARCHAR(100),
        primary_recommendation TEXT,
        alternate_recommendation TEXT,
        confidence_score NUMERIC(5, 2),
        estimated_value_idr BIGINT,
        co2_reduction_kg INTEGER,
        ai_explanation TEXT,
        action_steps JSONB,
        is_verified BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """
    engine = get_engine()
    with engine.begin() as conn:
        conn.execute(text(create_table_query))
    print("[DB] Tabel 'palm_batches' siap di PostgreSQL.")

def save_batch_to_db(report_data: dict):
    """
    Menyimpan data batch dan hasil evaluasi AI ke tabel palm_batches di PostgreSQL.
    """
    insert_query = """
    INSERT INTO palm_batches (
        batch_id, lokasi_kebun, tanggal_panen, lama_penyimpanan_jam,
        warna, viskositas_mPa_s, pH, kadar_ffa_percent, moisture_percent,
        berat_ton, track_type, category, primary_recommendation,
        alternate_recommendation, confidence_score, estimated_value_idr,
        co2_reduction_kg, ai_explanation, action_steps
    ) VALUES (
        :batch_id, :lokasi_kebun, :tanggal_panen, :lama_penyimpanan_jam,
        :warna, :viskositas_mPa_s, :pH, :kadar_ffa_percent, :moisture_percent,
        :berat_ton, :track_type, :category, :primary_recommendation,
        :alternate_recommendation, :confidence_score, :estimated_value_idr,
        :co2_reduction_kg, :ai_explanation, CAST(:action_steps AS jsonb)
    )
    ON CONFLICT (batch_id) DO UPDATE SET
        primary_recommendation = EXCLUDED.primary_recommendation,
        confidence_score = EXCLUDED.confidence_score,
        estimated_value_idr = EXCLUDED.estimated_value_idr,
        co2_reduction_kg = EXCLUDED.co2_reduction_kg,
        ai_explanation = EXCLUDED.ai_explanation;
    """
    import json
    details = report_data.get("details", {})
    params = {
        "batch_id": report_data.get("batch_id"),
        "lokasi_kebun": details.get("lokasi_kebun", "Kebun Sawit"),
        "tanggal_panen": details.get("tanggal_panen"),
        "lama_penyimpanan_jam": details.get("lama_penyimpanan_jam"),
        "warna": details.get("warna"),
        "viskositas_mPa_s": details.get("viskositas_mPa_s"),
        "pH": details.get("pH"),
        "kadar_ffa_percent": details.get("kadar_ffa_percent"),
        "moisture_percent": details.get("moisture_percent"),
        "berat_ton": details.get("berat_ton"),
        "track_type": report_data.get("track_type"),
        "category": report_data.get("category"),
        "primary_recommendation": report_data.get("primary_recommendation"),
        "alternate_recommendation": report_data.get("alternate_recommendation"),
        "confidence_score": report_data.get("confidence_score"),
        "estimated_value_idr": details.get("estimated_value_idr", 0),
        "co2_reduction_kg": details.get("co2_reduction_kg", 0),
        "ai_explanation": report_data.get("ai_explanation"),
        "action_steps": json.dumps(report_data.get("action_steps", [])),
    }

    engine = get_engine()
    with engine.begin() as conn:
        conn.execute(text(insert_query), params)
    print(f"[DB] Batch {params['batch_id']} berhasil disimpan ke PostgreSQL!")

def fetch_training_data_from_db() -> pd.DataFrame:
    """
    Mengambil data historis batch yang telah diverifikasi dari PostgreSQL
    sebagai dataset pelatihan Machine Learning.
    """
    init_db()
    query = """
        SELECT 
            lama_penyimpanan_jam,
            warna,
            viskositas_mPa_s,
            pH,
            kadar_ffa_percent,
            moisture_percent,
            berat_ton,
            category
        FROM palm_batches
        WHERE is_verified = TRUE OR category IS NOT NULL;
    """
    engine = get_engine()
    df = pd.read_sql(query, engine)
    return df
