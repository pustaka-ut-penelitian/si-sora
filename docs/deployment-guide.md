# Panduan Rinci Persiapan & Eksekusi Deployment Free Tier — SI SORA

**Nama Sistem:** SI SORA (Sistem Informasi Social Opinion Reaction Analytics)  
**Arsitektur Cloud:** 100% Free Tier (Supabase + Render + Netlify + Cron-Job.org)  
**Estimasi Biaya Operasional:** Rp 0 / Bulan  
**Target Pengguna:** Pimpinan & Tim Humas Universitas Terbuka  
**Status:** Siap Eksekusi Deployment  

---

## 1. Ikhtisar Arsitektur 100% Free Tier & Prinsip Dual-Environment

Dokumen ini adalah pedoman baku persiapan dan eksekusi deployment sistem SI SORA ke ekosistem cloud publik gratis. Arsitektur ini dirancang dengan prinsip **Dual-Environment Resilience**:
- **Di Komputer Lokal (Laptop):** Sistem tetap berjalan mandiri menggunakan database Docker PostgreSQL lokal (`localhost:5433`). Pengembang bebas menambahkan fitur, memodifikasi UI, dan melakukan pengujian tanpa membutuhkan koneksi internet atau memakan kuota cloud.
- **Di Cloud (Production Publik):** Sistem berjalan otomatis menghubungkan Supabase (Database), Render (FastAPI Backend), Netlify (React Frontend), dan Cron-Job.org (Pemicu Otomatis & Anti-Sleep). Versi cloud hanya akan diperbarui saat pengembang melakukan `git push origin main`.

```
                  ┌───────────────────────────────┐
                  │         Cron-Job.org          │
                  │  - Keep-Alive (Tiap 10 Menit) │
                  │  - Daily Scrape (Pukul 06.00) │
                  └───────────────┬───────────────┘
                                  │ (HTTP Ping)
                                  ▼
┌──────────────────┐    ┌───────────────────┐    ┌──────────────────┐
│ Netlify Frontend │───►│   Render Backend  │───►│ Supabase Database│
│  (React 19 CDN)  │    │ (FastAPI Service) │    │ (PostgreSQL 15)  │
│ sisora.netlify.app│    │ api.onrender.com  │    │ si-sora-db       │
└──────────────────┘    └─────────┬─────────┘    └──────────────────┘
                                  │
                                  ▼
                        ┌───────────────────────┐
                        │    Groq Cloud API     │
                        │ (openai/gpt-oss-20b)  │
                        └───────────────────────┘
```

---

## 2. Tahap 1: Setup Database Supabase (`si-sora-db`)

### A. Data Kredensial Proyek
- **Nama Proyek Supabase:** `si-sora-db`
- **Kata Sandi Database:** `dbsisora040984!!` (sesuai catatan pada `docs/credential.txt`)

### B. Mengambil Connection String (URI)
1. Buka dashboard proyek `si-sora-db` di [Supabase Dashboard](https://supabase.com/dashboard).
2. Masuk ke menu **Project Settings** (ikon gerigi di kiri bawah) -> pilih tab **Database**.
3. Gulir ke bagian **Connection string** -> pilih tab **URI**.
4. Salin string koneksi tersebut. Format aslinya adalah:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```
5. Ganti `[YOUR-PASSWORD]` dengan sandi database Anda (`dbsisora040984!!`).
6. **PENTING UNTUK PYTHON ASYNC:** Ubah awalan protokol dari `postgresql://` menjadi `postgresql+asyncpg://`:
   ```
   postgresql+asyncpg://postgres:dbsisora040984!!@db.[PROJECT-REF].supabase.co:5432/postgres
   ```
   *(String inilah yang nantinya akan dimasukkan ke dalam Environment Variable `DATABASE_URL` di Render).*

### C. Pembuatan Tabel Otomatis (Auto-Migration)
Anda **tidak perlu** mengimpor file SQL manual ke SQL Editor Supabase. Sistem backend SI SORA pada file `backend/app/main.py` telah dilengkapi fitur *lifespan auto-migration*. Begitu backend di Render pertama kali berhasil terhubung ke Supabase, seluruh 6 tabel dan akun Super Admin bawaan (`admin:admin123`) akan otomatis diciptakan.

---

## 3. Tahap 2: Persiapan Repositori GitHub

1. Pastikan file kredensial lokal terlindungi dan tidak akan bocor ke publik. Periksa bahwa file `.gitignore` di root repositori memuat:
   ```gitignore
   .env
   .env.*
   !.env.example
   ```
2. Inisialisasi dan dorong kode ke repositori privat GitHub:
   ```bash
   git add .
   git commit -m "feat(core): si-sora deployment readiness"
   git branch -M main
   git remote add origin https://github.com/[USERNAME-BOS]/si-sora.git
   git push -u origin main
   ```

---

## 4. Tahap 3: Deployment Backend di Render.com

1. Buka [Render Dashboard](https://dashboard.render.com) dan login menggunakan akun GitHub Anda.
2. Klik tombol **New +** di kanan atas -> pilih **Web Service**.
3. Pilih opsi **Build and deploy from a Git repository** -> hubungkan repositori `si-sora` Anda.
4. Konfigurasikan parameter Web Service persis seperti tabel berikut:

| Parameter Pengaturan | Nilai Konfigurasi |
| :--- | :--- |
| **Name** | `si-sora-api` (atau nama pilihan Anda) |
| **Region** | Singapore (Southeast Asia) — paling dekat dengan Indonesia |
| **Branch** | `main` |
| **Root Directory** | `backend` |
| **Runtime** | `Python 3` |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| **Instance Type** | `Free` (0.1 CPU, 512 MB RAM) |

5. Gulir ke bagian **Environment Variables** -> klik tombol **Add Environment Variable**, lalu masukkan variabel-variabel wajib ini:

| Key (Nama Variabel) | Value (Nilai) |
| :--- | :--- |
| `DATABASE_URL` | String URI Supabase Anda (`postgresql+asyncpg://postgres:dbsisora040984!!@db.[REF].supabase.co:5432/postgres`) |
| `JWT_SECRET_KEY` | String acak pengaman token (contoh: `sisora_ut_super_secret_jwt_key_2026`) |
| `GROQ_API_KEY` | Kunci API Groq Anda (salin dari file `backend/.env` lokal) |
| `APIFY_API_TOKEN` | Token API Apify Anda (salin dari file `backend/.env` lokal) |

6. Klik **Create Web Service**. Render akan memulai proses instalasi dependensi dan menyalakan server.
7. Setelah status berubah menjadi **Live**, salin URL publik backend Anda (contoh: `https://si-sora-api.onrender.com`).
8. Verifikasi kesehatan backend dengan membuka: `https://si-sora-api.onrender.com/health`. Jika muncul respons `{"status":"ok","database":"connected"}`, backend Anda telah sukses 100%!

---

## 5. Tahap 4: Deployment Frontend di Netlify

1. Buka [Netlify Dashboard](https://app.netlify.com) dan login menggunakan akun GitHub Anda.
2. Klik tombol **Add new site** -> pilih **Import an existing project**.
3. Pilih penyedia **GitHub** -> pilih repositori `si-sora`.
4. Konfigurasikan parameter build persis seperti berikut:

| Parameter Pengaturan | Nilai Konfigurasi |
| :--- | :--- |
| **Branch to deploy** | `main` |
| **Base directory** | `frontend` |
| **Build command** | `npm run build` |
| **Publish directory** | `frontend/dist` |

5. Klik menu **Environment variables** pada halaman konfigurasi tersebut -> tambahkan variabel:
   - **Key:** `VITE_API_URL`
   - **Value:** URL publik Render Anda (contoh: `https://si-sora-api.onrender.com` — *tanpa garis miring di akhir*).
6. Klik tombol **Deploy si-sora**.
7. Netlify akan menjalankan Vite bundler selama ~1-2 menit. Setelah selesai, Netlify akan memberikan URL publik (contoh: `https://si-sora.netlify.app`).
8. *(Opsional)* Di menu **Site configuration** -> **Domain management**, Anda dapat mengubah subdomain Netlify menjadi nama yang lebih profesional (misal: `si-sora-ut.netlify.app`).

> [!NOTE]
> File `frontend/public/_redirects` yang berisi `/* /index.html 200` sudah tersedia di dalam repositori. Netlify akan secara otomatis menggunakannya sehingga routing React SPA tidak akan pernah mengalami error 404 saat halaman di-refresh.

---

## 6. Tahap 5: Otomasi & Anti-Sleep di Cron-Job.org

Server Render Free Tier memiliki kebijakan otomatis tidur (*sleep / spin down*) jika tidak menerima lalu lintas web selama 15 menit. Untuk membuat server selalu aktif (*always awake*) dan melakukan penarikan data secara berkala, kita memanfaatkan layanan gratis [Cron-Job.org](https://cron-job.org).

1. Buat akun gratis di [Cron-Job.org](https://cron-job.org) dan verifikasi email Anda.
2. Masuk ke menu **Cronjobs** -> klik tombol **Create Cronjob**.

### Job 1 — Anti-Sleep (Keep-Alive Backend)
- **Title:** `SI SORA Backend Keep-Alive`
- **URL:** `https://si-sora-api.onrender.com/health`
- **Execution schedule:** Pilih *User-defined* -> Jalankan setiap **10 menit** (`*/10 * * * *`).
- **Request Method:** `GET`
- Klik **Create**. Job ini akan mengirimkan sinyal ping ringan setiap 10 menit sehingga server Render tidak akan pernah tidur.

### Job 2 — Pemicu Penarikan Data Rutin (Daily Auto-Scraping)
- **Title:** `SI SORA Daily Auto-Scraping`
- **URL:** `https://si-sora-api.onrender.com/api/jobs/trigger-scrape`
- **Execution schedule:** Setiap hari pada pukul **06:00 WIB** (atau 23:00 UTC).
- **Request Method:** `POST`
- Klik **Create**. Job ini memastikan data opini publik terbaru sudah ditarik dan dianalisis sebelum pimpinan membuka dashboard di pagi hari.

---

## 7. Prosedur Alur Kerja Dual-Environment Pasca-Deploy

Setelah seluruh ekosistem cloud di atas berjalan, alur kerja harian Bos tetap berada di komputer lokal:

1. **Pengembangan Fitur Baru di Komputer Lokal:**
   - Nyalakan Docker Desktop (`docker-compose up -d`).
   - Nyalakan backend lokal: `uvicorn app.main:app --port 8001 --reload`
   - Nyalakan frontend lokal: `npm run dev`
   - Buka `http://localhost:5173`. Semua eksperimen, penambahan fitur, dan perbaikan tampilan dilakukan di sini tanpa takut mengganggu versi publik.
2. **Sinkronisasi ke Versi Cloud (Production):**
   - Hanya saat sebuah fitur di lokal sudah teruji dan stabil, lakukan commit dan push:
     ```bash
     git add .
     git commit -m "feat: implementasi fitur baru"
     git push origin main
     ```
   - Render dan Netlify akan secara otomatis mendeteksi push tersebut, mengompilasi ulang kode, dan memperbarui versi publik dalam waktu ~2 menit tanpa intervensi manual!
