# Arsitektur Sistem — SI SORA

**Nama Sistem:** SI SORA (Sistem Informasi Social Opinion Reaction Analytics)  
**Versi:** 6.1  
**Pola Desain:** Monorepo Decoupled (FastAPI Backend + React Vite Frontend)  
**Strategi Cloud:** 100% Free Tier (Supabase Cloud + Vercel Serverless + Vercel Edge CDN)  

---

## 1. Ikhtisar Arsitektur

SI SORA dirancang menggunakan pola decoupled monorepo dengan pemisahan tegas antara logika backend (pengolahan data & AI inference) dan antarmuka frontend (visualisasi reaksi opini publik). Arsitektur ini mendukung *Dual-Environment* secara mulus: berjalan mandiri di komputer lokal pengembang menggunakan Docker PostgreSQL lokal, dan dideploy ke ekosistem cloud publik gratis tanpa kartu kredit/debit.

```
                    ┌──────────────────────────────┐
                    │    Public Data Sources       │
                    │ (Play Store, YouTube, TikTok)│
                    └──────────────┬───────────────┘
                                   │ (Scraping / Crawling)
                                   ▼
┌──────────────────┐    ┌──────────────────────────────┐
│ Vercel Frontend  │───►│       FastAPI Backend        │
│ (React 19 Vite)  │    │     (Python 3.12 ASGI)       │
│ si-sora-frontend │    │      si-sora.vercel.app      │
└──────────────────┘    └───────┬──────────────┬───────┘
                                │              │
               (Analysis Request)│              │ (Read / Write via Pooler)
                                ▼              ▼
         ┌────────────────────────┐       ┌────────────────────────┐
         │     Groq Cloud API     │       │ PostgreSQL (AsyncPG)   │
         │  (openai/gpt-oss-20b)  │       │ - Local: Docker :5433  │
         │    Inference Sentimen  │       │ - Prod: Supabase :6543 │
         └────────────────────────┘       └────────────────────────┘
```

---

## 2. Struktur Folder Proyek

```
Riset Sentiment Analysis/
├── backend/
│   ├── api/
│   │   └── index.py         # Entrypoint ASGI serverless runtime Vercel
│   ├── app/
│   │   ├── api/             # Endpoint rute REST API & Otentikasi JWT
│   │   │   ├── auth.py      # Login, validasi token, role requirement
│   │   │   └── routes.py    # Analytics overview, topics, wordcloud, scraper trigger
│   │   ├── core/            # Keamanan & hashing sandi (bcrypt)
│   │   ├── db/              # Inisialisasi engine async SQLAlchemy & sesi DB
│   │   │   └── session.py   # Handler dual-env (Supabase Pooler, pool_pre_ping, SSL)
│   │   ├── models/          # Definisi skema tabel ORM (RawComment, AIAnalysis, User, dll.)
│   │   │   ├── base.py
│   │   │   └── models.py
│   │   ├── services/        # Service eksternal: Groq LLM, Wordcloud, Scrapers
│   │   │   ├── ai_engine.py
│   │   │   ├── wordcloud_gen.py
│   │   │   ├── scheduler.py
│   │   │   └── scrapers/    # Scraper multi-platform (Play Store, YouTube, TikTok/Apify)
│   │   └── main.py          # Definisi FastAPI, CORS, rute root & health alias
│   ├── vercel.json          # Konfigurasi rewrite & maxDuration Vercel backend
│   ├── requirements.txt     # Dependensi Python produksi
│   ├── .env                 # Kredensial lokal (diabaikan Git)
│   └── .env.example         # Template konfigurasi environment
├── frontend/
│   ├── src/
│   │   ├── api/             # Klien Axios & interseptor token JWT
│   │   │   └── client.ts    # Dynamic VITE_API_URL fallback
│   │   ├── assets/          # Logo resmi SI SORA & Universitas Terbuka
│   │   ├── components/      # Komponen modular UI (Layout, Sidebar, Cards)
│   │   ├── pages/           # Halaman utama (Dashboard, Explorer, Scraper, Users, Settings)
│   │   ├── App.tsx
│   │   └── main.tsx         # Root mounting, React Router, ProtectedRoute
│   ├── vercel.json          # Aturan SPA routing fallback (/* -> /index.html)
│   ├── package.json         # Dependensi Node.js / React 19
│   ├── tailwind.config.js   # Konfigurasi tema Neo-Organic Nu-Brutalism
│   └── vite.config.ts       # Bundler Vite
├── docs/                    # Dokumentasi teknis terpadu
├── docker-compose.yml       # Definisi kontainer PostgreSQL lokal (:5433)
├── .gitignore               # Proteksi isolasi kredensial lokal
└── AGENTS.md                # Pedoman baku kepribadian & arsitektur AI Agent
```

---

## 3. Komponen Arsitektur Utama

### A. Backend Layer (Python FastAPI Serverless di Vercel)
- **FastAPI Framework:** RESTful API modern berbasis Pydantic V2 dengan performa asinkron tinggi.
- **Vercel Serverless Runtime:** Menjalankan file `backend/api/index.py` yang membungkus aplikasi FastAPI dengan dukungan routing native `/api/*`.
- **SQLAlchemy 2.0 (AsyncPG) & Resiliensi Supabase Pooler:**
  - Menghubungkan aplikasi ke Supavisor Pooler Supabase (Port `6543`, Mode `Transaction`).
  - Mengaktifkan `pool_pre_ping=True` dan `pool_recycle=300` untuk mencegah error koneksi *stale/closed* saat kontainer serverless bangun dari kondisi idle.
  - Mematikan cache statement (`statement_cache_size=0` & `prepared_statement_cache_size=0`) demi kompatibilitas penuh dengan mode transaction pooler.
- **Lifespan Admin Init:** Secara otomatis memeriksa keberadaan akun Super Admin pada inisialisasi awal kontainer tanpa memblokir server.

### B. Frontend Layer (React 19 + Vite di Vercel Edge CDN)
- **Modern React Stack:** Dibangun di atas React 19 dengan bundler Vite 8.
- **Tailwind CSS Styling:** Menerapkan design system *Neo-Organic UI / Nu-Brutalism* dengan kartu bento, bayangan tegas (*hard shadows*), sudut membulat ekstrem (*squircle*), dan palet warna Universitas Terbuka (Navy `#003f7a` & Gold `#fecb00`).
- **Client-Side Routing & SPA Fallback:** Menggunakan `react-router-dom` dengan komponen pembungkus `ProtectedRoute`. Dilengkapi file `frontend/vercel.json` (`/* -> /index.html`) untuk menjamin navigasi halaman tidak pernah mengalami error 404 saat di-reload.

### C. Artificial Intelligence & Analytics Layer
- **Groq Cloud API:** Mengirimkan prompt analisis terstruktur ke model `openai/gpt-oss-20b` untuk mengklasifikasikan sentimen (Positif, Negatif, Netral), mendeteksi skor emosi dominan, serta mengekstraksi topik utama pembicaraan secara hemat kuota (batching 10 item).
- **Dynamic Word Cloud Engine:** Mengolah frekuensi token kata menggunakan library `WordCloud` dan `Pillow`, lalu menghasilkan representasi visual berbasis Base64 PNG transparan dengan pewarnaan dinamis sesuai proporsi sentimen.
