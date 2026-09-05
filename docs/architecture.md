# Arsitektur Sistem — SI SORA

**Nama Sistem:** SI SORA (Sistem Informasi Social Opinion Reaction Analytics)  
**Versi:** 6.0  
**Pola Desain:** Monorepo Decoupled (FastAPI Backend + React Vite Frontend)  
**Strategi Cloud:** 100% Free Tier (Supabase + Render + Netlify + Cron-Job.org)  

---

## 1. Ikhtisar Arsitektur

SI SORA dirancang menggunakan pola decoupled monorepo dengan pemisahan tegas antara logika backend (pengolahan data & AI inference) dan antarmuka frontend (visualisasi reaksi opini publik). Arsitektur ini mendukung *Dual-Environment* secara mulus: berjalan mandiri di komputer lokal pengembang menggunakan Docker PostgreSQL lokal, dan siap dideploy ke ekosistem cloud publik gratis.

```
                    ┌──────────────────────────────┐
                    │    Public Data Sources       │
                    │  (YouTube, Google Play Store)│
                    └──────────────┬───────────────┘
                                   │ (Scraping / Crawling)
                                   ▼
                    ┌──────────────────────────────┐
                    │       FastAPI Backend        │
                    │     (Python 3.11 / 3.13)     │
                    └───────┬──────────────┬───────┘
                            │              │
           (Analysis Request)│              │ (Read / Write)
                            ▼              ▼
     ┌────────────────────────┐       ┌────────────────────────┐
     │     Groq Cloud API     │       │ PostgreSQL (AsyncPG)   │
     │  (openai/gpt-oss-20b)  │       │  - Local: Docker :5433 │
     │     Inference Sentimen)│       │  - Prod: Supabase :5432│
     └────────────────────────┘       └────────────┬───────────┘
                                                   │
                                     (JSON REST API│ JWT Bearer)
                                                   ▼
                                      ┌────────────────────────┐
                                      │   React 19 Frontend    │
                                      │   (Vite + Tailwind CSS)│
                                      │  - Local: Port 5173    │
                                      │  - Prod: Netlify CDN   │
                                      └────────────────────────┘
```

---

## 2. Struktur Folder Proyek

```
Riset Sentiment Analysis/
├── backend/
│   ├── app/
│   │   ├── api/             # Endpoint rute REST API & Otentikasi JWT
│   │   │   ├── auth.py      # Login, validasi token, role requirement
│   │   │   └── routes.py    # Analytics overview, topics, wordcloud, scraper trigger
│   │   ├── core/            # Keamanan & hashing sandi (bcrypt)
│   │   ├── db/              # Inisialisasi engine async SQLAlchemy & sesi DB
│   │   │   └── session.py   # Handler dual-environment (SSL detection Supabase / non-SSL Docker)
│   │   ├── models/          # Definisi skema tabel ORM (RawComment, AIAnalysis, User, dll.)
│   │   │   ├── base.py
│   │   │   └── models.py
│   │   ├── services/        # Service eksternal: Groq LLM, Wordcloud, Scraper
│   │   │   ├── ai_engine.py
│   │   │   ├── wordcloud_gen.py
│   │   │   ├── playstore_scraper.py
│   │   │   └── youtube_scraper.py
│   │   └── main.py          # Entrypoint FastAPI, CORS middleware, auto table migration
│   ├── .env                 # Kredensial lokal (diabaikan Git)
│   ├── .env.example         # Template konfigurasi environment
│   └── requirements.txt     # Dependensi Python
├── frontend/
│   ├── public/              # Aset statis & file _redirects Netlify
│   ├── src/
│   │   ├── api/             # Klien Axios & interseptor token JWT
│   │   │   └── client.ts    # Dynamic VITE_API_URL fallback
│   │   ├── assets/          # Logo resmi SI SORA & Universitas Terbuka
│   │   ├── components/      # Komponen modular UI (Layout, Sidebar, Cards)
│   │   ├── pages/           # Halaman utama (Dashboard, Explorer, Scraper, Users, Settings)
│   │   ├── App.tsx
│   │   └── main.tsx         # Root mounting, React Router, ProtectedRoute
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

### A. Backend Layer (Python FastAPI)
- **FastAPI Framework:** Menyediakan RESTful API berkecepatan tinggi dengan validasi skema otomatis berbasis Pydantic V2.
- **SQLAlchemy 2.0 (AsyncPG):** Pengolahan database sepenuhnya asynchronous non-blocking, mencegah bottleneck saat menangani antrean pembacaan komentar.
- **Lifespan Auto-Migration:** Saat server pertama kali menyala, fungsi lifespan mengeksekusi pembuatan tabel otomatis (`Base.metadata.create_all`) dan membuat akun Super Admin bawaan jika belum ada di database.
- **Dual-Environment Database Detection:** Menggunakan deteksi cerdas pada string `DATABASE_URL`. Jika terdeteksi host Supabase atau Neon, koneksi otomatis menyalakan mode SSL `CERT_NONE` yang dibutuhkan driver AsyncPG.

### B. Frontend Layer (React 19 + Vite)
- **Modern React Stack:** Dibangun di atas React 19 dengan Vite 8 sebagai bundler ultra-cepat.
- **Tailwind CSS Styling:** Menerapkan design system *Neo-Organic UI / Nu-Brutalism* dengan kartu bento, bayangan tegas (`hard shadows`), sudut membulat ekstrem (`squircle`), dan palet warna Universitas Terbuka.
- **Client-Side Routing:** Menggunakan `react-router-dom` dengan komponen pembungkus `ProtectedRoute` yang mengecek token JWT secara aman di `localStorage`.
- **Single Page Application (SPA) Resilience:** Dilengkapi file `frontend/public/_redirects` berisi `/* /index.html 200` untuk memastikan routing tidak crash saat halaman di-refresh di server Netlify.

### C. Artificial Intelligence & Analytics Layer
- **Groq Cloud API:** Mengirimkan prompt analisis terstruktur ke model `openai/gpt-oss-20b` untuk mengklasifikasikan sentimen (Positif, Negatif, Netral), mendeteksi skor emosi dominan (Senang, Kecewa, Marah, Bingung), serta mengekstraksi topik utama pembicaraan.
- **Dynamic Word Cloud Engine:** Mengolah frekuensi token kata menggunakan library `WordCloud` dan `Pillow`, lalu menghasilkan representasi visual berbasis Base64 PNG transparan dengan pewarnaan dinamis sesuai proporsi sentimen.
