# Product Requirements Document (PRD) — SI SORA

**Nama Sistem:** SI SORA (Sistem Informasi Social Opinion Reaction Analytics)  
**Tagline:** Mendengar dan memahami sentiment publik  
**Institusi:** Universitas Terbuka (Perpustakaan Pusat & Hubungan Masyarakat)  
**Versi Dokumen:** 6.1 (Production & Local Ready)  
**Status:** Backend & DB Live / Frontend Ready  

---

## 1. Latar Belakang & Visi Produk

Universitas Terbuka (UT) sebagai pelopor pendidikan tinggi terbuka dan jarak jauh di Indonesia memiliki ratusan ribu mahasiswa dan alumni yang aktif beropini di ranah digital. Opini, ulasan, keluhan, dan apresiasi tersebar luas di berbagai kanal publik seperti Google Play Store (aplikasi UT Mobile/ruang belajar), YouTube (konten edukasi & peresmian), TikTok, dan media sosial lainnya.

**SI SORA** hadir sebagai platform *Social Listening & Intelligence* cerdas berbasis kecerdasan buatan (AI) yang dibangun dengan prinsip:
1. **Zero Operational API Cost (100% Free Tier):** Seluruh infrastruktur (Database Supabase, Backend Vercel Serverless, Frontend Vercel Edge CDN, AI Inference Groq) berjalan di atas kuota gratis tanpa syarat kartu kredit/debit.
2. **Local-First & Production-Resilient:** Mendukung pengembangan berkelanjutan di komputer lokal tanpa mengganggu sistem publik (*dual-environment*).
3. **Executive-Grade Insights:** Menyajikan analitik sentimen, emosi, dan ringkasan eksekutif untuk membantu pimpinan mengambil keputusan strategis yang cepat dan terukur.

---

## 2. Profil & Peran Pengguna

Sistem ini dirancang untuk melayani dua kelompok pengguna:
- **Pimpinan UT (Rektorat, Dekanat, Kepala Unit):** Membutuhkan ringkasan sentimen makro, proporsi persepsi publik (Positif, Netral, Negatif), topik hangat, word cloud, dan ringkasan eksekutif otomatis tanpa jargon teknis.
- **Administrator & Analis Data (Humas / IT):** Mengelola target *crawling*, memantau log otomatisasi, mengekspor data analisis ke CSV, mengelola kredensial, dan melakukan penarikan data manual.

---

## 3. Matriks Fitur Utama

### A. Core Intelligence & Analytics
- **Multi-Platform Comment Scraper:** Penarikan data komentar publik dari Google Play Store, YouTube, dan TikTok tanpa API berbayar.
- **Groq AI Inference Engine:** Klasifikasi sentimen 3 arah (Positif, Netral, Negatif), deteksi emosi psikologis publik, ekstraksi topik diskusi, dan analisis penalaran (*reasoning*) menggunakan model openai/gpt-oss-20b.
- **Dynamic Word Cloud Generator:** Pembuatan visualisasi awan kata berbasis frekuensi dan sentimen dengan palet warna resmi Universitas Terbuka.
- **AI Executive Summary:** Pembuatan narasi kesimpulan opini masyarakat yang diperbarui secara otomatis atau pemicu manual.

### B. User Interface & Experience (UI/UX)
- **Neo-Organic UI / Nu-Brutalism:** Desain modular *Bento Grid* melayang, sudut membulat ekstrem (*squircle* `rounded-[2rem]`), batas tegas kontras tinggi, dan bebas dari *AI-Slop generic styling*.
- **Responsive Dashboard:** Tampilan adaptif sempurna di layar desktop pimpinan, tablet, dan smartphone staf lapangan.
- **Data Explorer & Advanced Filter:** Navigasi komentar interaktif dengan pencarian teks, filter sentimen, filter platform, dan pagination.
- **Export Data:** Pengunduhan hasil olahan dalam format file CSV terstruktur (`sisora_eksplorasi_[tanggal].csv`).

### C. Keamanan & Akses
- **Otentikasi Berbasis Token:** Proteksi JWT dengan algoritma HS256 dan hash sandi bcrypt.
- **Role-Based Access Control (RBAC):** Pemisahan hak akses antara akun `ADMIN` dan `VIEWER`.
- **CORS Protection:** Penguncian akses API lintas domain hanya untuk lingkungan lokal dan domain publik Vercel resmi.

---

## 4. Kebutuhan Non-Fungsional (NFR)

- **Biaya Operasional:** Rp 0 / bulan (Supabase Free Tier, Vercel Serverless & Edge Free Tier, Groq Free Tier — tanpa syarat kartu kredit).
- **Waktu Muat (Latency):** Dashboard awal harus tampil dalam waktu < 2 detik di jaringan standar berkat global Edge CDN Vercel.
- **Ketahanan Pooler Serverless:** Mengatasi timeout idle pooler Supabase melalui `pool_pre_ping=True` dan `pool_recycle=300`.
- **Integritas Kode:** Mematuhi aturan *Zero-Comments Rule* secara mutlak pada seluruh lapisan kode sumber aplikasi.
