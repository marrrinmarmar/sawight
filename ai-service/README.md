# Sawight AI Microservice (Python & ML)

Service mandiri untuk melatih model Machine Learning dan melayani webhook n8n secara real-time.

---

## 📁 Struktur Direktori

* **[app.py](file:///d:/Document/Projek/Hackathon%20SENO%20ITS/sawight/ai-service/app.py)**: Server FastAPI yang menerima webhook dari n8n (`POST /webhook/predict`).
* **[train.py](file:///d:/Document/Projek/Hackathon%20SENO%20ITS/sawight/ai-service/train.py)**: Script pelatihan model Scikit-Learn yang mengambil data dari **PostgreSQL** (dengan fallback otomatis ke `data/factory.json`).
* **[db.py](file:///d:/Document/Projek/Hackathon%20SENO%20ITS/sawight/ai-service/db.py)**: Pengaturan koneksi SQLAlchemy / PostgreSQL.
* **`models/`**: Tempat file model terlatih (`palm_classifier.joblib`) disimpan.
* **[requirements.txt](file:///d:/Document/Projek/Hackathon%20SENO%20ITS/sawight/ai-service/requirements.txt)**: Dependensi pustaka Python.

---

## 🚀 Cara Menjalankan

### 1. Buat Virtual Environment & Install Dependensi
```bash
cd ai-service
python -m venv venv

# Windows:
venv\Scripts\activate

# Install libraries:
pip install -r requirements.txt
```

### 2. Atur Variabel Database (.env)
Salin `.env.example` menjadi `.env` lalu sesuaikan kredensial PostgreSQL Anda:
```ini
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sawight_db
DB_USER=postgres
DB_PASSWORD=rahasia
```

### 3. Latih Model ML (Membaca data historis PostgreSQL)
```bash
python train.py
```
*Script ini membaca tabel historis `palm_batches` dari PostgreSQL (atau fallback otomatis ke JSON lokal) dan menghasilkan `models/palm_classifier.joblib`.*

### 4. Jalankan Service Webhook untuk n8n
```bash
python -m uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```
Akses dokumentasi Swagger interaktif di: `http://localhost:8000/docs`

---

## 🔗 Integrasi dengan n8n
Di workflow n8n:
1. Pasang node **HTTP Request**.
2. **Method**: `POST`
3. **URL**: `http://localhost:8000/webhook/predict` (atau IP server AI Anda).
4. **Body Parameters**: Kirimkan JSON data batch (FFA, moisture, pH, warna, dll).
5. Output JSON akan otomatis berisi `primary_recommendation`, `confidence_score`, `ai_explanation`, dan `action_steps`.
