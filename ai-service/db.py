import os
from dotenv import load_dotenv
import pandas as pd
from sqlalchemy import create_engine

load_dotenv()

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "sawight_db")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "postgres")

DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

def get_engine():
    """Membuat SQLAlchemy engine untuk koneksi PostgreSQL."""
    return create_engine(DATABASE_URL)

def fetch_training_data_from_db() -> pd.DataFrame:
    """
    Mengambil data historis batch yang telah diverifikasi dari PostgreSQL
    sebagai dataset pelatihan Machine Learning.
    """
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
