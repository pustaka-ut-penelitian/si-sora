# Panduan Rinci Persiapan & Eksekusi Deployment Free Tier — SI SORA

**Nama Sistem:** SI SORA (Sistem Informasi Social Opinion Reaction Analytics)  
**Arsitektur Cloud:** 100% Free Tier (Supabase Cloud + Vercel Serverless + Vercel Edge CDN)  
**Estimasi Biaya Operasional:** Rp 0 / Bulan (Tanpa Kartu Kredit / Debit)  
**Target Pengguna:** Pimpinan & Tim Humas Universitas Terbuka  
**Status:** Backend & Database Sukses Live (Production Ready)  

---

## 1. Ikhtisar Arsitektur 100% Free Tier & Prinsip Dual-Environment

SI SORA dirancang dengan prinsip **Dual-Environment Resilience**:
- **Di Komputer Lokal (Laptop):** Sistem berjalan mandiri menggunakan database Docker PostgreSQL lokal (`localhost:5433`). Pengembang bebas menambahkan fitur, memodifikasi UI, dan melakukan pengujian tanpa kuota cloud atau internet.
- **Di Cloud (Production Publik):** Sistem berjalan di infrastruktur serverless global Vercel dan database cloud Supabase tanpa memerlukan kartu kredit/debit sama sekali.

```
                    ┌──────────────────────────────┐
                    │    Public Data Sources       │
                    │ (Play Store, YouTube, TikTok)│
                    └──────────────┬───────────────┘
                                   │ (HTTP / API Crawling)
                                   ▼
┌──────────────────┐    ┌───────────────────┐    ┌─────────────────────────┐
│  Vercel Frontend │───►│   Vercel Backend  │───►│ Supabase Cloud Database │
│  (React 19 SPA)  │    │ (FastAPI ASGI)    │    │ (PostgreSQL 15 Pooler)  │
│  si-sora-fe...   │    │ si-sora.vercel.app│    │ Port 6543 (Supavisor)   │
└──────────────────┘    └─────────┬─────────┘    └─────────────────────────┘
                                  │
                                  ▼
                        ┌───────────────────────┐
                        │    Groq Cloud API     │
                        │ (openai/gpt-oss-20b)  │
                        └───────────────────────┘
```

---

## 2. Mengapa Memilih Vercel + Supabase (Bukan Render / Zeabur)?

1. **Render.com:** Mewajibkan verifikasi kartu kredit/debit internasional meskipun untuk Free Tier ($0), yang sering gagal pada kartu debit bank lokal Indonesia.
2. **Zeabur:** Telah menghapus cluster bersama gratis (*shared cluster*) untuk akun baru dan beralih ke model BYOS (*Bring Your Own Server*) berbayar ($3 - $14/bulan).
3. **Vercel + Supabase:** Menawarkan kombinasi serverless tercepat di dunia, serverless function Python 3.12, database PostgreSQL cloud tangguh, 100% gratis, dan **tanpa syarat input kartu kredit/debit**.

---

## 3. Tahap 1: Setup Database Supabase (`si-sora-db`)

### A. Data Kredensial Proyek
- **Nama Proyek Supabase:** `si-sora-db`
- **Region:** Singapore (`ap-southeast-1`) — latensi terendah ke Indonesia.
- **Kata Sandi Database:** Gunakan kata sandi database Anda yang tersimpan di `docs/credential.txt`.

### B. Mengambil Connection String (Supavisor Pooler)
Untuk aplikasi serverless seperti Vercel, **wajib** menggunakan Supavisor Connection Pooler (Mode Transaction pada port `6543`):
1. Buka [Supabase Dashboard](https://supabase.com/dashboard) -> pilih proyek `si-sora-db`.
2. Masuk ke menu **Project Settings** -> **Database**.
3. Gulir ke bagian **Connection Pooling** (Port `6543` / Mode `Transaction`).
4. Format URI untuk Python AsyncPG:
   ```
   postgresql+asyncpg://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require
   ```

### C. Eksekusi Skema DDL Database
Jalankan query DDL berikut di **SQL Editor Supabase** untuk membangun seluruh 6 tabel inti, indeks, dan menyinkronkan versi migrasi Alembic:

```sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS raw_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform VARCHAR(50) NOT NULL,
    source_url TEXT NOT NULL,
    author_name VARCHAR(100),
    text_content TEXT NOT NULL,
    posted_at TIMESTAMPTZ DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'UNPROCESSED'
);

CREATE INDEX IF NOT EXISTS ix_raw_comments_platform ON raw_comments (platform);
CREATE INDEX IF NOT EXISTS ix_raw_comments_status ON raw_comments (status);

CREATE TABLE IF NOT EXISTS system_settings (
    setting_key VARCHAR(100) PRIMARY KEY,
    setting_value TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id UUID NOT NULL REFERENCES raw_comments(id) ON DELETE CASCADE,
    sentiment VARCHAR(20) NOT NULL,
    emotion VARCHAR(50),
    topic_tags JSONB DEFAULT '[]'::jsonb,
    ai_reasoning TEXT,
    analyzed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'VIEWER' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_users_username ON users (username);

CREATE TABLE IF NOT EXISTS scraper_targets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform VARCHAR(20) NOT NULL,
    target_id VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    cron_time VARCHAR(20) DEFAULT '02:00',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS generated_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    insight_text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS alembic_version (
    version_num VARCHAR(32) NOT NULL,
    CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num)
);

INSERT INTO alembic_version (version_num)
VALUES ('18bcf41e6cda')
ON CONFLICT (version_num) DO NOTHING;

INSERT INTO users (id, username, password_hash, role, created_at)
VALUES (
    gen_random_uuid(),
    'admin',
    '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW',
    'ADMIN',
    NOW()
)
ON CONFLICT (username) DO NOTHING;
```

---

## 4. Tahap 2: Deployment Backend di Vercel

Backend FastAPI dideploy sebagai Vercel Serverless Function menggunakan Python 3.12:

### A. Konfigurasi Proyek Vercel Backend
1. Login ke [Vercel Dashboard](https://vercel.com/dashboard).
2. Klik **Add New...** -> **Project** -> Import repositori `pustaka-ut-penelitian/si-sora`.
3. Atur konfigurasi dasar:
   - **Project Name:** `si-sora`
   - **Framework Preset:** `Other`
   - **Root Directory:** `backend`
4. Di bagian **Environment Variables**, tambahkan variabel-variabel berikut:

| Key (Nama Variabel) | Value (Nilai) |
| :--- | :--- |
| `DATABASE_URL` | URI Supabase Pooler (`postgresql+asyncpg://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require`) |
| `JWT_SECRET_KEY` | String rahasia acak untuk JWT (contoh: `sisora_ut_super_secret_jwt_key_2026`) |
| `GROQ_API_KEY` | Kunci API Groq Anda (salin dari `docs/credential.txt`) |
| `APIFY_API_TOKEN` | Token API Apify Anda |

5. Klik **Deploy**. Vercel akan menginstal `requirements.txt` dan mem-build fungsi Python dalam ~35-45 detik.

### B. Hasil Endpoint Live
- **Root URL:** `https://si-sora.vercel.app/` -> Mengembalikan `{"status":"ok","service":"si_sora_api","version":"1.0.0"}`
- **Health Check:** `https://si-sora.vercel.app/api/health` -> Mengembalikan `{"status":"ok","service":"ut_sentiment_api","database":"connected"}`

---

## 5. Tahap 3: Deployment Frontend di Vercel

Frontend React 19 Vite dideploy sebagai Vercel Project kedua yang terhubung ke backend:

### A. Konfigurasi Proyek Vercel Frontend
1. Di [Vercel Dashboard](https://vercel.com/dashboard), klik **Add New...** -> **Project**.
2. Pilih kembali repositori `pustaka-ut-penelitian/si-sora` -> klik **Import**.
3. Atur konfigurasi:
   - **Project Name:** `si-sora-frontend` (atau nama pilihan Anda)
   - **Framework Preset:** `Vite`
   - **Root Directory:** Klik **Edit** -> pilih folder `frontend` -> klik **Continue**.
4. Di bagian **Environment Variables**, tambahkan:

| Key (Nama Variabel) | Value (Nilai) |
| :--- | :--- |
| `VITE_API_URL` | `https://si-sora.vercel.app` *(tanpa garis miring di ujung)* |

5. Klik **Deploy**. Vercel akan menjalankan `npm run build` dan mengunggah bundel React dalam ~1 menit.

### B. Proteksi SPA Routing (Client-Side Fallback)
File `frontend/vercel.json` telah disediakan dengan aturan rewrite:
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```
Aturan ini menjamin pengguna tidak akan pernah mengalami error **404 Not Found** ketika melakukan reload (F5) pada halaman `/login`, `/dashboard`, `/data-explorer`, atau `/settings`.

---

## 6. Prosedur Pemeliharaan & Alur Kerja Dual-Environment

Setelah sistem live, alur kerja harian pengembang tetap aman dan mandiri di laptop lokal:

1. **Pengembangan Fitur Lokal:**
   - Database lokal: Docker Compose (`docker-compose up -d` di port 5433).
   - Backend lokal: `uvicorn app.main:app --port 8001 --reload`
   - Frontend lokal: `npm run dev` di `http://localhost:5173`
2. **Sinkronisasi ke Production (Cloud):**
   - Lakukan commit dan push ke GitHub:
     ```bash
     git add .
     git commit -m "feat(scope): deskripsi pembaruan fitur"
     git push origin main
     ```
   - Vercel akan otomatis mendeteksi perubahan pada branch `main` dan memperbarui backend serta frontend dalam hitungan detik tanpa *downtime*.
