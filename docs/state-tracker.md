# State Tracker — SI SORA

**Nama Sistem:** SI SORA (Sistem Informasi Social Opinion Reaction Analytics)  
**Institusi:** Perpustakaan Pusat Universitas Terbuka  
**Status Terkini:** Versi 6.2 (Backend & Database Cloud Live, Frontend Deployment Ready)  
**Arsitektur:** 100% Free Tier Cloud (Supabase Cloud + Vercel Serverless + Vercel Edge CDN)  

---

## 1. Status Komponen Sistem

| Komponen | Lingkungan Lokal | Lingkungan Cloud | Status Operasional |
| :--- | :--- | :--- | :---: |
| **Backend API** (FastAPI) | Berjalan di `http://127.0.0.1:8001` (Terisolasi dari port PHP) | Dideploy di Vercel Serverless (`https://si-sora.vercel.app`) | **LIVE 100% (HTTP 200)** |
| **Database** (PostgreSQL 15) | Docker Container `ut_sentiment_db` port `5433` (Data lokal aman) | Supabase `si-sora-db` (Port 6543 Supavisor Pooler + SSL + `pool_pre_ping`) | **LIVE & CONNECTED 100%** |
| **Frontend UI** (React 19 + Vite) | Berjalan di `http://localhost:5173` | Siap dideploy di Vercel Edge CDN (`frontend/vercel.json` SPA Rewrite) | **READY FOR DEPLOY** |
| **AI Inference Engine** (Groq) | openai/gpt-oss-20b via `GROQ_API_KEY` | Terhubung via Environment Variable di Vercel | **READY 100%** |
| **Design System** | Neo-Organic Nu-Brutalism (Bento Grid, Squircle, Navy `#003f7a` & Gold `#fecb00`) | Responsif di Desktop, Tablet, & Mobile | **READY 100%** |
| **Dokumentasi Teknis** (`docs/`) | Seluruh file dokumentasi telah diperbarui dan disinkronkan 100% | Mencerminkan arsitektur Vercel + Supabase mutakhir | **SYNCED 100%** |

---

## 2. Riwayat Versi & Log Perubahan (Changelog)

### Versi 6.2 (September 2026) — Vercel Serverless & Supabase Cloud Migration
- **Migrasi Cloud 100% Free Tanpa Kartu Kredit:** Mengalihkan strategi deployment dari Render/Zeabur ke Vercel Serverless (Python 3.12) dan Supabase Cloud PostgreSQL (Port 6543 Supavisor Pooler) untuk menghindari syarat input kartu kredit internasional.
- **Inisialisasi Database Cloud Supabase:** Berhasil mengeksekusi DDL 6 tabel, indeks pencarian, seeding akun Super Admin, dan sinkronisasi versi migrasi Alembic (`18bcf41e6cda`) di SQL Editor Supabase.
- **Resolusi Serverless ASGI Routing Vercel:**
  - Menghapus wildcard rewrite `/(.*)` yang memotong path asli.
  - Mengimplementasikan routing native `/api/*` pada `backend/api/index.py`.
  - Menambahkan alias endpoint `@app.get("/api/health")` dan `@app.get("/api")`.
  - Memverifikasi secara empiris bahwa `GET /`, `GET /health`, dan `GET /api/health` mengembalikan HTTP 200 OK (`database: connected`), serta `GET /random` mengembalikan HTTP 404 Not Found.
- **Penguatan Resiliensi Koneksi Database:** Menambahkan `pool_pre_ping=True`, `pool_recycle=300`, serta penonaktifan prepared statement cache (`statement_cache_size=0`) pada `backend/app/db/session.py` untuk mengatasi idle timeout pada pooler cloud serverless.
- **Proteksi SPA Client-Side Routing:** Menyediakan `frontend/vercel.json` dengan aturan rewrite `/(.*) -> /index.html` untuk mencegah error 404 saat pengguna melakukan reload di browser.
- **Penyelesaian Isu Login Hybrid (JSON & Form-Data) & Verifikasi Lokal Aman:**
  - Memodifikasi `backend/app/api/auth.py` menjadi endpoint hybrid yang mendukung pembacaan JSON payload dari React SPA maupun Form URL-encoded dari OAuth2/Swagger.
  - Memperbarui `frontend/src/pages/Login.tsx` untuk mengirim objek JSON murni `{ username, password }` serta meningkatkan presisi pesan error.
  - Menjalankan audit menyeluruh pada 15 endpoint di `backend/app/api/routes.py` terhadap seluruh pemanggilan API frontend, memastikan seluruh integrasi bebas dari bentrok payload.
  - Memverifikasi kompilasi fisik: `python -m py_compile` sukses (0 error) dan `npm run build` sukses (2.610 modul, 0 error), mematuhi Zero-Comments Rule.
  - Pengujian autentikasi lokal terkonfirmasi berhasil dan aman 100% oleh Bos di `localhost:5173`.
- **Sinkronisasi Total Dokumentasi (`docs/`):** Memperbarui `deployment-guide.md`, `architecture.md`, `database.md`, dan `state-tracker.md` dengan fakta implementasi Vercel + Supabase.

### Versi 6.1 (September 2026) — Documentation Restoration & Dual-Environment Resilience
- **Pemulihan Menyeluruh Folder `docs/`:** Menuliskan kembali file dokumentasi dengan rincian teknis mutakhir.
- **Isolasi Port Backend Lokal:** Menetapkan port default API backend lokal ke `8001` guna menghindari bentrokan dengan port `8000`.
- **Verifikasi Empiris Kompilasi:** Melakukan uji kompilasi fisik `npm run build` (2.610 modul sukses) dan verifikasi impor Python.

### Versi 6.0 (Agustus 2026) — Full Rebranding ke SI SORA
- **Transformasi Identitas:** Mengubah nama sistem menjadi **SI SORA (Sistem Informasi Social Opinion Reaction Analytics)** dengan tagline resmi: *"Mendengar dan memahami sentiment publik."*
- **Pembersihan UI & Meta:** Menyesuaikan teks hero, header, penamaan file ekspor CSV, dan label izin akses.
- **Kepatuhan Zero-Comments Rule:** Menjamin kode sumber bersih dari komentar yang tidak diperlukan.

---

## 3. Agenda Tugas Berikutnya (Next Steps)

- [ ] **Deploy Frontend di Vercel Dashboard:** Mengimpor folder `frontend`, menyetel `VITE_API_URL = https://si-sora.vercel.app`, dan menyelesaikan proses deploy.
- [ ] **Verifikasi End-to-End di Browser:** Melakukan uji coba login admin, browsing dashboard, dan penarikan data scraper langsung di domain publik Vercel.
- [ ] **Pengembangan Fitur Lanjutan:** Melanjutkan penambahan fitur analisis di komputer lokal secara aman.
