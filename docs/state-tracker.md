# State Tracker — SI SORA

**Nama Sistem:** SI SORA (Sistem Informasi Social Opinion Reaction Analytics)  
**Institusi:** Perpustakaan Pusat Universitas Terbuka  
**Status Terkini:** Versi 6.1 (Production & Local Development Ready)  
**Arsitektur:** 100% Free Tier Cloud (Supabase + Render + Netlify + Cron-Job.org)  

---

## 1. Status Komponen Sistem

| Komponen | Lingkungan Lokal | Lingkungan Cloud | Status Operasional |
| :--- | :--- | :--- | :---: |
| **Backend API** (FastAPI) | Berjalan di `http://127.0.0.1:8001` (Terisolasi dari bentrokan port PHP) | Siap dideploy di Render.com (`uvicorn app.main:app --host 0.0.0.0 --port $PORT`) | **READY 100%** |
| **Frontend UI** (React 19 + Vite) | Berjalan di `http://localhost:5173` | Siap dideploy di Netlify CDN (`npm run build`, `dist`, `_redirects`) | **READY 100%** |
| **Database** (PostgreSQL 15) | Docker Container `ut_sentiment_db` port `5433` (59 baris data komentar aman) | Supabase `si-sora-db` (SSL Auto-detection & Lifespan Auto-Migration) | **READY 100%** |
| **AI Inference Engine** (Groq) | openai/gpt-oss-20b via `GROQ_API_KEY` | Terhubung via Environment Variable di Render | **READY 100%** |
| **Design System** | Neo-Organic Nu-Brutalism (Bento Grid, Squircle, Navy `#003f7a` & Gold `#fecb00`) | Responsif di Desktop, Tablet, & Mobile | **READY 100%** |
| **Dokumentasi Teknis** (`docs/`) | Seluruh 6 file dokumentasi telah dipulihkan dan disinkronkan 100% | Menjadi pedoman baku arsitektur dan deployment | **READY 100%** |

---

## 2. Riwayat Versi & Log Perubahan (Changelog)

### Versi 6.1 (September 2026) — Documentation Restoration & Dual-Environment Resilience
- **Pemulihan Menyeluruh Folder `docs/`:** Menuliskan kembali seluruh 6 file dokumentasi (`PRD.md`, `architecture.md`, `database.md`, `design.md`, `deployment-guide.md`, `state-tracker.md`) dengan rincian teknis mutakhir.
- **Isolasi Port Backend Lokal:** Menetapkan port default API backend lokal ke `8001` guna menghindari bentrokan dengan server PHP lokal yang aktif di port `8000`.
- **Verifikasi Empiris Kompilasi:** Melakukan uji kompilasi fisik `npm run build` (2.610 modul ter-compile sukses dalam 5 detik) dan verifikasi impor Python (`Backend OK, version: 1.0.0`).
- **Verifikasi Integritas Data:** Mengonfirmasi bahwa 59 baris data komentar mentah dan 59 analisis AI di database Docker lokal tetap aman tersimpan di volume `pgdata`.

### Versi 6.0 (Agustus 2026) — Full Rebranding ke SI SORA
- **Transformasi Identitas:** Mengubah nama sistem dari nama lama menjadi **SI SORA (Sistem Informasi Social Opinion Reaction Analytics)** dengan tagline resmi: *"Mendengar dan memahami sentiment publik."*
- **Pembersihan UI & Meta:** Menyesuaikan teks hero pada `Login.tsx`, header `Dashboard.tsx`, penamaan file ekspor CSV pada `DataExplorer.tsx` (`sisora_eksplorasi_...`), `index.html`, serta label izin akses pada `Users.tsx` dan `Settings.tsx`.
- **Penyesuaian Logo:** Membersihkan kontainer latar belakang biru yang mengelilingi logo SI SORA di Dashboard agar tampil menyatu dan elegan sejajar dengan logo Universitas Terbuka.
- **Metadata API:** Memperbarui judul OpenAPI Swagger di `backend/app/main.py` menjadi SI SORA API.
- **Kepatuhan Zero-Comments Rule:** Menjamin kode sumber bersih dari komentar yang tidak diperlukan.

### Versi 5.0 - 5.4 (Agustus 2026) — Free Tier Hardening & Deployment Prep
- **Supabase SSL Compatibility:** Menambahkan penanganan otomatis konteks SSL `CERT_NONE` pada `backend/app/db/session.py` untuk driver AsyncPG saat mendeteksi host Supabase.
- **SPA Routing Protection:** Memasang file `frontend/public/_redirects` (`/* /index.html 200`) untuk mencegah error 404 saat pengguna melakukan refresh halaman di Netlify.
- **CORS Regex Enhancement:** Menambahkan izin CORS berbasis regex `allow_origin_regex=r"https://.*\.netlify\.app"` pada FastAPI.
- **Strategi Anti-Sleep:** Merancang arsitektur webhook eksternal menggunakan Cron-Job.org untuk mem-ping endpoint `/health` setiap 10 menit.
- **Pembersihan Konfigurasi Usang:** Mengisolasi kredensial lokal dan menyinkronkan `.gitignore`.

### Versi 1.0 - 4.0 (Agustus 2026) — Pengembangan Fitur Fondasi
- Inisialisasi struktur monorepo decoupled (FastAPI + React 19 Vite).
- Pembuatan scraper komentar YouTube dan Google Play Store.
- Integrasi inferensi sentimen, emosi, dan topik dengan Groq (openai/gpt-oss-20b).
- Implementasi antarmuka Neo-Organic UI / Nu-Brutalism dengan Bento Grid.
- Pembuatan generator visual awan kata dinamis (*Word Cloud*).
- Implementasi sistem otentikasi JWT Bearer, hashing sandi bcrypt, dan RBAC.

---

## 3. Agenda Tugas Berikutnya (Next Steps)

- [ ] **Push ke Repositori GitHub:** Mengunggah kode sumber SI SORA ke repositori privat GitHub pengembang.
- [ ] **Koneksi Supabase Cloud:** Menyematkan string koneksi `si-sora-db` pada environment variable di Render.
- [ ] **Deployment Render & Netlify:** Membuka Web Service di Render dan situs di Netlify sesuai panduan pada `docs/deployment-guide.md`.
- [ ] **Aktivasi Cron-Job.org:** Mengaktifkan jadwal Keep-Alive dan Daily Auto-Scraping.
- [ ] **Pengembangan Fitur Lanjutan:** Melanjutkan pengembangan fitur baru di komputer lokal pengembang secara aman.
