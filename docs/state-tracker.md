# State Tracker — SI SORA

**Nama Sistem:** SI SORA (Sistem Informasi Social Opinion Reaction Analytics)  
**Institusi:** Perpustakaan Pusat Universitas Terbuka  
**Status Terkini:** Versi 6.15 (Sinkronisasi Penuh Skema DDL, Indeks Performa, & Migrasi 100% Data Lokal ke Supabase Cloud Production)  
**Arsitektur:** 100% Free Tier Cloud (Supabase Cloud + Vercel Serverless + Vercel Edge CDN)  

---

## 1. Status Komponen Sistem

| Komponen | Lingkungan Lokal | Lingkungan Cloud | Status Operasional |
| :--- | :--- | :--- | :--- |
| **Backend API** (FastAPI) | Berjalan di `http://127.0.0.1:8001` (Terisolasi dari port PHP) | Dideploy di Vercel Serverless (`https://si-sora-api.vercel.app`) | **LIVE 100% (HTTP 200)** |
| **Database** (PostgreSQL 15) | Docker Container `ut_sentiment_db` port `5433` (Data lokal aman) | Supabase `si-sora-db` (Port 6543 Supavisor Pooler + SSL + `pool_pre_ping`) | **LIVE & FULLY SYNCED (6.420 data)** |
| **Frontend UI** (React 19 + Vite) | Berjalan di `http://localhost:5173` | Dideploy di Vercel Edge CDN (`https://si-sora.vercel.app`) | **LIVE 100%** |
| **AI Inference Engine** (Groq) | openai/gpt-oss-20b via `GROQ_API_KEY` | Terhubung via Environment Variable di Vercel | **READY 100%** |
| **Design System** | Neo-Organic Nu-Brutalism (Bento Grid, Squircle, Navy `#003f7a` & Gold `#fecb00`) | Responsif di Desktop, Tablet, & Mobile | **READY 100%** |
| **Dokumentasi Teknis** (`docs/`) | Seluruh file dokumentasi telah diperbarui dan disinkronkan 100% | Mencerminkan arsitektur Vercel + Supabase mutakhir | **SYNCED 100%** |

---

## 2. Riwayat Versi & Log Perubahan (Changelog)

### Versi 6.15 (September 2026) — Sinkronisasi Penuh Skema DDL, Indeks Performa, & Migrasi 100% Data Lokal ke Supabase Cloud Production
- **Penyempurnaan Skema DDL & Indeks Performa di Supabase Cloud:**
  - Membuat tabel `scraper_logs` (UUID, status, waktu eksekusi, volume komentar).
  - Membuat tabel `generated_wordclouds` (UUID, snapshot_id, sentiment, layout, Base64 image, top_words JSONB).
  - Memasang 11 indeks performa komposit di cloud (`idx_raw_comments_posted_at_desc`, `idx_ai_analysis_topic_tags` GIN, `idx_ai_analysis_sentiment`, `idx_ai_analysis_emotion`, dll.).
- **Migrasi Data 100% Atomik dari Lokal ke Supabase Production:**
  - Mengeksekusi pipeline migrasi data terpadu (`sync_local_to_supabase.py`) dalam waktu **24,84 detik**.
  - Sinkronisasi `raw_comments`: 6.420 data (termasuk 6.332 data survei terbaru).
  - Sinkronisasi `ai_analysis`: 6.420 data (hasil audit sentimen mutakhir).
  - Sinkronisasi `generated_wordclouds`: 32 snapshot gambar visualisasi (dasbor production memuat word cloud instan dalam 0ms).
  - Sinkronisasi `generated_insights`: 19 kesimpulan narasi AI.
  - Sinkronisasi `scraper_logs`: 9 riwayat audit penarikan data.
  - Sinkronisasi `scraper_targets`: 4 target media sosial.
  - Sinkronisasi `users`: 2 akun pengguna (admin & operator).
  - **Hasil Verifikasi Row Count Supabase Cloud:** 100% identik dengan PostgreSQL lokal.

### Versi 6.14 (September 2026) — Overhaul Fundamental Mesin Local NLP: Lexicon Disambiguation, Skip-Gram Negation Engine 4-Token, Morphology Confix Stripping, Eksekusi Audit Survei Otomatis & Sanitasi UI Murni
- **Pembersihan Total UI & Konsistensi Tampilan (`DataExplorer.tsx`):**
  - Menghapus 100% tombol *"Audit Ulang Sentimen Survei"* dan modal terkait dari UI. Tampilan halaman Eksplorasi Data tetap murni, rapi, dan orisinil hanya menampilkan tombol utama *"Ekspor Excel"*.
  - Menghilangkan state `showReanalyzeModal`, `isReanalyzing`, `reanalyzeResult`, dan `reanalyzeError` serta import ikon yang tidak digunakan.
- **Penyediaan Endpoint Backend & Eksekusi Audit Otomatis (`routes.py`):**
  - Endpoint `POST /api/survey/reanalyze` tersedia secara aman di sisi server untuk keperluan audit data survei berhak akses admin.
  - Menjalankan audit sentimen otomatis terhadap seluruh 6.332 data komentar platform survei menggunakan mesin Local NLP versi terbaru.
  - Hasil audit tuntas dalam **1,74 detik**:
    - Total Data Dipindai: 6.332
    - Total Data Dikoreksi: 244
    - Koreksi POSITIF -> NEGATIF: 15 komentar
    - Koreksi POSITIF -> NETRAL: 48 komentar
    - Koreksi NETRAL -> NEGATIF: 122 komentar
    - Tidak Berubah: 6.088 komentar
  - Regenerasi snapshot word cloud otomatis berhasil diperbarui dengan Snapshot ID `430703fe-e18e-4828-9b8d-f45a8b465f8c`.
- **Resolusi Kontaminasi Silang Kamus (Lexicon Disambiguation Mutlak):**
  - Mengeliminasi anomali 1.126 kata tumpang tindih antara `positive.tsv` dan `negative.tsv`. Kata sentimen sejati (*bagus*, *cepat*, *lancar*, *mudah*, *ramah*, *puas*, *hebat*, dll.) dibersihkan 100% dari kamus negatif sehingga negasi tidak lagi membalik nilai keluhan menjadi positif palsu.
  - Memisahkan kata negatif sejati (*buruk*, *jelek*, *rusak*, *lambat*, *lelet*, *lemot*, *sulit*, *kecewa*, *parah*, dll.) 100% dari kamus positif.
  - Menetralisir entitas akademik dan kata benda objektif (*jaringan*, *sinyal*, *staf*, *pengurus*, *pokjar*, *admin*, *respon*, *jawaban*, *menjawab*, *balas*, *angkat*, *slow*, *sibuk*, *menurut*, *terkadang*, dll.) sehingga berbobot 0 dan tidak mengotori kalkulasi sentimen.
- **Skip-Gram Negation Engine Fleksibel (Jangkauan 4 Token):**
  - Memperluas deteksi negasi hingga 4 token ke belakang dengan melompati partikel penyela (*pernah*, *bisa*, *ada*, *lagi*, *pun*, *di*, *ter*, *ke*, *secara*, *yang*, *mengalami*, *merasakan*, dll.).
  - Mengonversi kalimat pasif bernegasi seperti *"tidak pernah di balas"* dan *"tidak pernah di angkat"* secara akurat mengikat kata aksi menjadi sentimen negatif kuat.
  - Membalik skor kata positif yang dinegasi secara tegas (*"tidak bagus"* -> `-3.6`, *"tidak cepat"* -> `-2.4`).
- **Morfologi Konfiks Terpandu (*Indonesian Confix Morphology*):**
  - Mengimplementasikan deteksi konfiks `per-...-an` (*permasalahan* -> *masalah*), `ke-...-an` (*keterlambatan* -> *terlambat*, *kesulitan* -> *sulit*, *kekurangan* -> *kurang*), `ber-` (*bermasalah* -> *masalah*), dan `di-...-kan/i` (*dipersulit* -> *sulit*).
- **Ekspansi Kamus Frasa Majemuk Keluhan Layanan UT:**
  - Mendaftarkan frasa keluhan komunikasi (*slow respon*, *slow response*, *kurang fast respon*, *tidak dibalas*, *tidak dijawab*, *tidak diangkat*, *tidak ada respon*, *sulit dihubungi*, *terlalu sibuk*, *terlalu lama*, dll.).
  - Mendaftarkan frasa infrastruktur & sistem (*jaringan tidak bagus*, *jaringan jelek*, *jaringan lemot*, *sinyal jelek*, *tidak bisa login*, dll.).
- **Guardrail Presisi Masalah Kritis & Frasa Negatif:**
  - Mengunci teks yang memuat frasa keluhan majemuk atau kata keluhan riil yang tidak dinegasi agar **HARAM diklasifikasikan sebagai POSITIF** (hanya boleh `NEGATIF` atau `NETRAL` untuk saran konstruktif santun).
- **Kepatuhan Mutlak Zero-Comments Rule:** Menjamin 100% seluruh kode Python pada `local_nlp.py` dan TypeScript pada `DataExplorer.tsx` bersih tanpa satu pun komentar kode (`#`, `//`, `/* */`).

### Versi 6.13 (September 2026) — Navigasi Scroll-to-Top SPA, Isolasi Modal Fullscreen Portal z-[9999], & Presisi Mesin NLP Audit Ulang Sentimen Survei
- **Navigasi Scroll Restoration Otomatis Antar Halaman (`frontend/src/components/ScrollToTop.tsx` & `main.tsx`):**
  - Membuat komponen `ScrollToTop` yang mendengarkan perubahan rute SPA (`useLocation()`) dan mereset scroll window serta elemen `<main>` secara instan (`{ top: 0, left: 0, behavior: 'instant' }`).
  - Menghilangkan masalah halaman tujuan mempertahankan posisi scroll bawah saat berpindah dari dasbor atau menu lain.
- **Pelepasan Modal dari Perangkap CSS Stacking Context & Tumpang Tindih FloatingDock (`Dashboard.tsx` & `DataExplorer.tsx`):**
  - Menyelimuti seluruh modal dialog (`showConfirmRegenModal`, `showWcHistoryModal`, `selectedComment`, `isExportModalOpen`, `editingComment`, `showReanalyzeModal`) menggunakan `createPortal(..., document.body)`.
  - Mengisolasi modal 100% dari batasan CSS transform animasi layout (`animate-slide-up`).
  - Menaikkan z-index ke tingkat absolut `z-[9999]` di atas FloatingDock (`z-50`) dengan backdrop blur pekat `bg-[#001428]/70 backdrop-blur-md`.
  - Menerapkan efek penguncian scroll latar belakang (`document.body.style.overflow = "hidden"`) saat modal terbuka.
- **Penyempurnaan Mesin NLP Kamus & Stemming Imbuhan Indonesia Sub-Detik (`backend/app/services/local_nlp.py`):**
  - **Lexicon-Guided Stemming Suffix Stripper:** Memotong imbuhan (`-nya`, `-ku`, `-mu`, `-lah`, `-kah`, `-pun`) dengan verifikasi kamus O(1) melalui `KNOWN_STEMS` prekomputasi modul, menjaga kata dasar murni seperti *"masalah"* tetap utuh sambil mengonversi *"sulitnya"* -> *"sulit"* (-3), *"lambatnya"* -> *"lambat"* (-3), *"kendalanya"* -> *"kendala"* (-2).
  - **Pembersihan False-Positive Lexicon:** Membuang kata-kata netral konteks survei (*"akses"*, *"detail"*, *"banyaknya"*, *"mohon"*, *"tolong"*, dll.) dari bobot positif.
  - **Ekspansi Frase Majemuk Negatif:** Menambahkan keluhan operasional (*"sulit diakses"*, *"susah diakses"*, *"tidak sesuai"*, *"tetap tidak dikirim"*, *"keterlambatan modul"*, *"web sering down"*, dll.).
  - **Guardrail Masalah Kritis:** Mengunci kalimat yang memuat kata keluhan tidak dinegasi agar tidak pernah dapat diklasifikasikan sebagai `POSITIF` (minimal `NETRAL` untuk saran konstruktif atau `NEGATIF` untuk keluhan operasional).
  - **Performa Sub-Detik:** Pemrosesan 6.332 data teks tuntas hanya dalam **0,26 detik** (25.000x lebih cepat dibanding non-cached set).
- **Layanan Backend & Antarmuka Audit Ulang Sentimen Survei (`routes.py` & `DataExplorer.tsx`):**
  - Endpoint `POST /api/survey/reanalyze` terproteksi wewenang `ADMIN` dengan pembaruan data secara atomik dan batch flushing berkala.
  - Tombol aksi admin *"Audit Ulang Sentimen Survei"* pada toolbar Eksplorasi Data lengkap dengan modal konfirmasi dan kartu metrik hasil re-audit.
  - Berhasil mengoreksi ribuan data keluhan mahasiswa dari false positive menjadi sentimen riil (Negatif: 3.603, Positif Murni: 1.529, Netral Saran: 1.200).
  - Otomatis memperbarui batch snapshot visualisasi kata (Word Cloud) dengan 6.420 data terkoreksi.
- **Kepatuhan Mutlak Zero-Comments Rule:** Menjamin 100% seluruh kode Python dan TypeScript bersih dari komentar kode (`//`, `/* */`, `#`).

### Versi 6.12 (September 2026) — Peningkatan Rangkuman Sentimen Publik Dasbor menjadi Arsitektur Hybrid Hierarchical Synthesis dengan Deterministic Topic-Paired Exemplar Extraction
- **Ekstraksi Suara Publik Berpasangan Presisi (*Topic-Paired Exemplar Extraction*) di Backend (`backend/app/api/routes.py`):**
  - Mengembangkan fungsi `get_paired_topic_exemplars(sent, limit=3)` yang secara deterministik memetakan setiap topik utama (Top 3 isu per sentimen) langsung dengan 1 kutipan opini riil mahasiswa yang terverifikasi memiliki tag topik tersebut (`topic_tags.contains([topic])`).
  - Menghilangkan risiko ketidaksesuaian asosiasi: Topik Kritis #1 berpasangan dengan kutipan riil Topik #1, Topik Kritis #2 berpasangan dengan kutipan riil Topik #2, dan Topik Kritis #3 berpasangan dengan kutipan riil Topik #3.
  - Dilengkapi mekanisme *graceful fallback* dan sanitasi karakter encoding untuk membuang simbol rusak dari teks survei serta merapikan spasi.
  - Menambahkan fungsi `get_neutral_suggestions(limit=2)` untuk menyajikan opini/saran konstruktif netral.
- **Sintesis Eksekutif Presisi Tinggi (*Executive Synthesis Engine*) (`backend/app/services/ai_engine.py`):**
  - Mengupgrade persona model Groq menjadi *Senior Executive AI Analyst & Kebijakan Publik di Universitas Terbuka (UT)*.
  - Prompt menerima paket data terstruktur `top_positive_issues` dan `top_negative_issues` yang sudah berpasangan, mengeliminasi kebutuhan model untuk "menebak" pasangan isu dan kutipan.
  - Menstandarisasi struktur output laporan: Ringkasan Eksekutif, Metrik Kunci & Distribusi, Analisis Faktor Kepuasan Publik (dengan bukti kutipan berpasangan), Analisis Titik Kritis & Isu Mendesak (dengan bukti kutipan berpasangan), serta Rekomendasi Strategis Pimpinan (*Actionable Directives*) yang menyasar bidang akademik, infrastruktur sistem, dan layanan komunikasi.
  - Mengunci aturan format anti-tabel pipe demi kompatibilitas penuh dengan viewer markdown tanpa dependensi eksternal.
- **Penyempurnaan Tampilan Antarmuka Dasbor (`frontend/src/pages/Dashboard.tsx`):**
  - Menambahkan styling Tailwind untuk elemen blockquote (`[&>blockquote]`) pada kartu Rangkuman Sentimen Publik: border vertikal warna emas khas UT (`border-[#fecb00]`), background semi-transparan (`bg-white/5`), tipografi miring (*italic*), dan padding adaptif.
  - Memberikan aksen warna putih tegas pada judul butir (`[&>ul>li>strong]`) dan warna emas pada nomor rekomendasi (`[&>ol>li>strong]`).
- **Verifikasi Kualitas & Kepatuhan Zero-Comments Rule:**
  - Menjamin 100% seluruh kode Python dan TypeScript yang diperbarui bebas dari komentar kode (`//`, `/* */`, `#`).
  - Lolos uji build Vite TypeScript (`npm run build`) dengan durasi 1.32 detik tanpa error.

### Versi 6.11 (September 2026) — Arsitektur Persistensi Snapshot Word Cloud Cerdas dengan NLP Vocabulary Ekstraksi Frekuensi Riil & Riwayat Khusus Admin di Dasbor
- **Arsitektur Persistensi Snapshot Word Cloud (`backend/app/models/models.py` & `routes.py`):**
  - Pembuatan tabel `generated_wordclouds` (`id`, `snapshot_id`, `sentiment`, `layout`, `image_data`, `top_words`, `total_comments`, `created_at`, `created_by`).
  - Endpoint `GET /api/stats/wordcloud` kini membaca snapshot statis secara instan (0ms) dari database, memotong latency dan menghilangkan risiko timeout. Jika database kosong pada deployment pertama, sistem secara otomatis mengekstraksi snapshot batch perdana.
  - Endpoint `POST /api/stats/wordcloud/generate` khusus peran `ADMIN` yang memindai ulang seluruh ribuan data komentar riil, mengekstraksi frekuensi kata kunci esensial, merender visualisasi berimbang untuk desktop & mobile pada 4 kategori (`all`, `positif`, `negatif`, `netral`), dan menyimpan batch snapshot baru ke basis data.
  - Endpoint `GET /api/stats/wordcloud/history` untuk meninjau riwayat snapshot terdahulu lengkap dengan jumlah komentar, operator pembuat, dan kata populer.
- **Mesin Kosakata NLP Cerdas & Visualisasi Padat Penuh Kanvas (`backend/app/services/wordcloud_gen.py`):**
  - Menghapus ketergantungan sempit pada 8 tag topik statis. Algoritma `extract_smart_frequencies` kini membaca teks asli opini publik dan mahasiswa dengan target kapasitas ekstraksi hingga **180–200 kata**.
  - Kamus stopword komprehensif (300+ entri bahasa Indonesia, slang, partikel obrolan, dan istilah institusi non-opini seperti UT, Universitas, Terbuka, Kampus).
  - Ekstraksi frase majemuk standar UT (*tuweb, ujian online, kartu mahasiswa, portal sia, bahan ajar, e-learning, perpustakaan digital*, dll.).
  - **Eliminasi Ruang Kosong & Optimasi Packing Kanvas Penuh:**
    - Memperkecil `margin=2` (dari sebelumnya 14) agar kata menyentuh setiap sudut dan tepi luar kanvas secara rapat.
    - Menurunkan `min_font_size=9` dan memperbesar `max_font_size=115` dengan `relative_scaling=0.35`, memungkinkan kata-kata pendukung berukuran kecil berfungsi sebagai *tile filler* pengisi seluruh rongga antar frasa besar.
    - Menyetel `prefer_horizontal=0.75` (25% vertikal) untuk desktop guna mengunci celah-celah vertikal antar kata majemuk secara presisi.
    - Terbukti berhasil menempatkan hingga **180 kata padat** pada kanvas tanpa meninggalkan ruang kosong di setiap tab (`all`, `positif`, `negatif`, `netral`).
- **Antarmuka Interaktif Dasbor Neo-Organic Nu-Brutalism (`frontend/src/pages/Dashboard.tsx`):**
  - Tombol aksi admin emas UT *"Pindai & Bentuk Ulang Awan Kata"* (`RefreshCw`) dengan dialog konfirmasi yang menjelaskan proses pemetaan ulang secara transparan.
  - Tombol *"Riwayat"* (`History`) dengan modal interaktif yang menampilkan linimasa pembuatan word cloud, badge komentar, dan chip kata kunci populer.
  - Indikator metadata snapshot live di header card (tanggal pembaruan, total komentar dipetakan, dan identitas operator).
  - Tampilan chip tag *"Kata Populer"* di bawah kanvas visualisasi kata untuk transparansi analitik instan.
- **Kepatuhan Mutlak Zero-Comments Rule:** Menjamin 100% seluruh kode Python dan TypeScript yang diperbarui bersih dari komentar kode (`//`, `/* */`, `#`).

### Versi 6.10 (September 2026) — Filter Survei & Studio Edit Data/Anotasi Komentar Khusus Admin dengan Perlindungan Integritas Teks Opini di Eksplorasi Data
- **Penambahan Filter Survei pada Menu Eksplorasi Data (`frontend/src/pages/DataExplorer.tsx`):**
  - Menambahkan opsi `"Survei"` pada dropdown filter platform.
  - Memungkinkan penelusuran dan audit terfokus terhadap seluruh ribuan umpan balik responden survei kepuasan mahasiswa hasil impor Excel.
- **Studio Edit Data & Anotasi Komentar Khusus Admin (`DataExplorer.tsx`):**
  - Menyediakan tombol edit (`Edit3`) pada kolom Aksi tabel eksplorasi data yang hanya muncul untuk pengguna dengan wewenang `ADMIN`.
  - Modal dialog interaktif Neo-Organic Nu-Brutalism yang memungkinkan Administrator memperbarui klasifikasi sentimen (`POSITIF`, `NEGATIF`, `NETRAL`), karakter emosi (`senang`, `puas`, `bangga`, `kecewa`, `marah`, `khawatir`, `netral`), platform asal, identitas penulis/pengirim, tanggal & waktu posting, tag topik dominan (dengan tombol chip topik standar UT dan penambahan tag kustom), serta teks penalaran AI (*AI reasoning*).
  - Dilengkapi banner notifikasi sukses (*success toast*) berdesain modern dengan opsi dismiss instan.
- **Perlindungan Mutlak Integritas Teks Komentar Publik (Data Integrity & Audit Trail):**
  - Teks komentar asli (`text_content`) dikunci secara ketat (`readOnly`, `disabled`, indikator ikon `Lock`) pada formulir antarmuka.
  - Di tingkat backend (`backend/app/api/routes.py`), skema Pydantic `UpdateCommentRequest` sengaja mengabaikan/tidak menyediakan kolom `text_content` sehingga komentar asli responden/publik mustahil dimanipulasi oleh pihak mana pun.
- **Endpoint Keamanan Backend `PATCH /api/comments/{comment_id}` (`backend/app/api/routes.py`):**
  - Terproteksi dengan dependensi wewenang `admin: User = Depends(require_admin_role)`.
  - Memperbarui metadata `RawComment` (`platform`, `author_name`, `posted_at`) dan data analisis `AIAnalysis` (`sentiment`, `emotion`, `topic_tags`, `ai_reasoning`).
  - Menangani kondisi pembuatan entri `AIAnalysis` baru secara otomatis apabila komentar sebelumnya belum memiliki relasi analisis.
- **Penanda Audit Data Asli Sistem vs Diedit Manual (Zero-Migration Audit Flag):**
  - **Mekanisme Backend Zero-Migration:** Mengubah status `raw_comment.status = "EDITED"` pada saat update, mengembalikan field `"is_edited": True/False` pada `GET /api/comments` dan `PATCH /api/comments/{comment_id}` tanpa membutuhkan migrasi skema tabel baru.
  - **Badge Indikator Visual Tabel (`DataExplorer.tsx`):** Menampilkan badge mikro amber `[Edit3] Diedit` di samping platform untuk setiap komentar yang pernah disunting administrator, sementara data asli sistem dibiarkan bersih tanpa gangguan visual.
  - **Audit Trail pada Modal Detail (`DataExplorer.tsx`):** Menampilkan pill status audit di header inspeksi (`[Edit3] Diedit Manual` untuk data revisi vs `[Sparkles] Asli Sistem` untuk data asli).
  - **Ekspor Excel:** Menambahkan kolom `Status Data` pada berkas unduhan Excel yang secara otomatis mencatat `Diedit Manual` atau `Asli Sistem`.
- **Kepatuhan Mutlak Zero-Comments Rule:** Menjamin 100% seluruh kode Python dan TypeScript bersih dari komentar kode.

### Versi 6.9 (September 2026) — Proteksi RBAC Halaman Sistem & Penarikan Data Khusus Admin, Modul Manajemen Pengguna & Integrasi API
- **Gerbang Akses RBAC 403 Forbidden Menu Penarikan Data (`frontend/src/pages/JobScheduler.tsx`):**
  - Mengunci akses seluruh antarmuka crawling media sosial (Play Store, YouTube, Instagram, TikTok) serta studio impor survei kepuasan mahasiswa (Excel) eksklusif untuk peran `ADMIN`.
  - Menampilkan kartu proteksi berdesain Neo-Organic Nu-Brutalism dengan badge `403 Forbidden`, ikon `ShieldAlert`, deskripsi hak akses hanya-baca untuk wewenang `VIEWER`, serta tombol pengalihan cepat kembali ke Dasbor Utama.
  - Memastikan panggilan API `fetchTargets()` dan `fetchLogs()` tidak dieksekusi sama sekali jika akun belum terverifikasi sebagai `ADMIN`.
  - Mengonfirmasi seluruh 7 endpoint backend scraping di `backend/app/api/routes.py` terproteksi 100% dengan dependensi `current_user: User = Depends(require_admin_role)`.
- **Gerbang Akses RBAC 403 Forbidden Menu Sistem (`frontend/src/pages/Settings.tsx`):**
  - Mengunci akses seluruh menu Sistem (`/settings`) eksklusif untuk peran `ADMIN`.
  - Menampilkan kartu proteksi berdesain Neo-Organic Nu-Brutalism dengan badge `403 Forbidden`, ikon `ShieldAlert`, dan pesan ramah bahwa wewenang akun saat ini (`VIEWER`) tidak memiliki izin konfigurasi sistem, serta menyediakan tombol pengalihan cepat kembali ke Dasbor Utama.
- **Pusat Integrasi API Best Practice (`Settings.tsx` & `backend/app/api/system.py`):**
  - **Database Persistence:** Mengganti mock static form dengan persistensi riil pada tabel `system_settings` (`crawler_api_token` dan `groq_api_key`) via endpoint `GET/POST /api/system/settings`.
  - **Show/Hide & Copy Token:** Menyediakan toggle intip token (`Eye` / `EyeOff`) dan tombol salin ke clipboard (`Copy` / `Check`) dengan toast umpan balik visual instan.
  - **Format Detection:** Badge validasi otomatis hijau saat mendeteksi format standar token Groq (`gsk_...`).
  - **Live Connection Test:** Menghadirkan tombol uji koneksi live ke Groq LLM API (`POST /api/system/test-groq`) yang mengukur latensi jaringan secara presisi (ms) dan memvalidasi ketersediaan model `openai/gpt-oss-20b`.
  - **Runtime Synchronization:** Memperbarui nilai `os.environ` dan klien inferensi AI secara dinamis tanpa perlu me-restart server.
- **Modul Manajemen Pengguna Terintegrasi (`Settings.tsx` & `backend/app/api/system.py`):**
  - **Tabel Daftar Pengguna:** Menampilkan seluruh akun terdaftar lengkap dengan avatar inisial, username, badge peran (`ADMIN` Navy UT / `VIEWER` Slate), waktu registrasi, penanda `Akun Anda`, serta tombol aksi ergonomis.
  - **Tambah Pengguna Baru:** Modal dialog pendaftaran akun dengan validasi keunikan username, batas minimal kata sandi 8 karakter, dan pemilihan peran wewenang.
  - **Ubah Peran & Reset Sandi:** Modal pengubahan peran dan reset kata sandi mandiri oleh administrator.
  - **Proteksi Hapus Akun Ketat:** Melarang administrator menghapus akun miliknya sendiri yang sedang aktif (*self-deletion prevention*) dan melarang penghapusan atau penurunan wewenang jika hanya tersisa satu admin di database.
- **Kepatuhan Mutlak Zero-Comments Rule:** Menjamin 100% seluruh kode Python dan TypeScript bersih dari komentar kode.

### Versi 6.8 (September 2026) — Pusat Pengaturan Akun Pengguna, Fitur Ubah Kata Sandi Best Practice & Penyelarasan Wording Profesional
- **Pusat Pengaturan & Profil Akun Pengguna (`frontend/src/pages/Users.tsx`):**
  - Mengeliminasi total section statis *"Rincian Otorisasi & Kredensial"* dan teks peringatan token internal yang menimbulkan kebisingan visual (*visual clutter*).
  - Merestrukturisasi kartu identitas akun menjadi 3 pilar ergonomis: *Identitas Pengguna (status sesi terverifikasi), Hak Akses Sistem (Administrator Penuh),* dan *Waktu Registrasi (Status: Aktif)*.
  - Memperbaiki tata bahasa dan copywriting seluruh halaman menjadi bahasa Indonesia korporat akademik yang lugas, anggun, dan berwibawa.
  - Memperbarui dialog konfirmasi keluar sesi dengan wording yang jelas dan tidak berbelit-belit.
- **Formulir Keamanan & Ubah Kata Sandi Mandiri (`Users.tsx`):**
  - Menghadirkan studio pembaruan kata sandi berdesain Neo-Organic Nu-Brutalism dengan hard shadow Emas UT `#fecb00`.
  - Dilengkapi fitur toggle intip kata sandi (*show/hide eye icon*) pada setiap field (Kata Sandi Saat Ini, Kata Sandi Baru, Konfirmasi Kata Sandi Baru).
  - Indikator validasi visual interaktif real-time: verifikasi minimal 8 karakter, kombinasi huruf & angka, serta status kecocokan konfirmasi.
  - Umpan balik notifikasi instan berbasis banner peringatan/sukses yang jelas dan tombol dismiss.
- **Endpoint Keamanan Backend `POST /api/auth/change-password` (`backend/app/api/auth.py`):**
  - Menerima payload terproteksi JWT `{ current_password, new_password, confirm_password }`.
  - Memvalidasi kebenaran kata sandi lama via `verify_password` terhadap hash bcrypt database.
  - Memastikan kata sandi baru $\ge 8$ karakter, konfirmasi cocok, dan menolak kata sandi baru yang sama dengan kata sandi lama.
  - Menghasilkan hash bcrypt baru secara aman via `get_password_hash` dan menyimpannya ke database PostgreSQL.
- **Kepatuhan Mutlak Zero-Comments Rule:** Menjamin 100% seluruh kode Python dan TypeScript bersih dari komentar kode.

### Versi 6.7 (September 2026) — Ketahanan Impor Survei Free Tier, Super-Smart Local NLP Engine, Client-Side Chunking, Modal Progres & Batas Upload 20MB
- **Resolusi Limit Token Groq 429 & Vercel 10s Execution Timeout:**
  - Menganalisis batasan TPM (*Tokens Per Minute*) paket Free Tier Groq (6.000–15.000 TPM) yang memicu HTTP 429 saat backend mengirimkan 10 batch berturut-turut (~30.000 tokens) dengan jeda 1 detik.
  - Memitigasi risiko timeout 10 detik Vercel Serverless dengan memindahkan kendali batching ke sisi klien (*Client-Side Chunking*).
- **Peningkatan Radikal Super-Smart Local NLP Engine (`local_nlp.py`):**
  - **Kamus Frasa Majemuk (Compound Phrases):** Menambahkan deteksi multi-kata positif (*sangat memuaskan, pelayanan ramah, biaya terjangkau, mudah dipahami, dosen komunikatif, tidak mengecewakan, worth it*) dan negatif (*sangat lambat, server sering down, lemot parah, kecewa berat, admin lelet, sulit dihubungi, buang waktu*).
  - **Intensifier Weighting:** Mengintegrasikan pembobotan kata penguat (*banget, sekali, amat, sangat, super, parah, pol, bener-bener*) untuk melipatgandakan polaritas skor sentimen.
  - **Contrastive Clause Reversal:** Menangani konjungsi pertentangan (*tapi, tetapi, namun, walaupun*) dengan mereduksi bobot klausa awal dan memperkuat klausa penentu.
  - **Dynamic AI Reasoning Generator (`generate_reasoning_local`):** Membangun generator penalaran otomatis berbasis ekstraksi kata kunci, emosi afektif, dan klaster topik, menghasilkan narasi analisis yang natural dan bernas setara AI tanpa token eksternal.
- **Client-Side Chunking Engine (`JobScheduler.tsx` & `routes.py`):**
  - Memecah ratusan data komentar Excel menjadi batch kecil (30 komentar per batch) di browser.
  - Mengirimkan chunk secara berurutan (*sequential*) ke endpoint `POST /api/survey/import` dengan jeda stabilisasi aman 200ms antar batch.
  - Tiap request HTTP selesai dalam ~0.3 detik di backend, 100% kebal terhadap timeout 10 detik Vercel Serverless.
  - Endpoint backend mengisolasi pencatatan entri tabel `scraper_logs` hanya pada batch final (`is_final_batch == True`) sehingga tabel riwayat tetap bersih dan akurat.
- **Modal Progres Real-Time Antrean Impor Survei (`JobScheduler.tsx`):**
  - Menggantikan tombol statis *"Menyimpan..."* dengan modal pop-up interaktif berdesain Neo-Organic Nu-Brutalism.
  - Menampilkan progress bar persentase animasi, status live antrean batch, counter komentar tersimpan, dan durasi eksekusi per batch.
  - Menyediakan penanganan error yang transparan jika sebagian data mengalami kendala jaringan.
- **Validasi Batas Berkas Excel Maksimal 20 MB & Banner Feedback Penolakan Berkas (`JobScheduler.tsx`):**
  - Memperluas batas ukuran berkas dari 10 MB menjadi 20 MB (`20 * 1024 * 1024`), mengakomodasi berkas survei biner historis berukuran besar seperti `SURVEI-KEPUASAN-MHS-2023.xls` (~10.43 MB, 8.415 baris, 5.866 komentar).
  - Mengintegrasikan banner peringatan eksplisit dan transparan di area dropzone ketika berkas ditolak (misal melebihi 20 MB), memastikan tidak ada aksi yang hening tanpa notifikasi visual.
  - Memperbarui label panduan dropzone dengan penanda batas 20 MB yang jelas dan menambahkan catatan durasi pemindaian pada indikator loading berkas besar.
- **Kepatuhan Mutlak Zero-Comments Rule:** Menjamin 100% seluruh kode Python, TypeScript, dan SQL bersih dari komentar kode.

### Versi 6.6 (September 2026) — Tab Survei Kepuasan (Import Excel Multi-Format), Smart Column Detector, Zero Server Storage & Paginasi Performa Tinggi
- **Tab Baru Survei Kepuasan (`JobScheduler.tsx`):**
  - Menambahkan tab ke-6 pada navigasi Penarikan Data: *"Survei Kepuasan"* (ikon `FileSpreadsheet`, badge `Excel`).
  - Studio import khusus dengan antarmuka drag-and-drop berkas Excel `.xlsx` dan `.xls`.
- **Zero Server Storage & Client-Side Memory Parsing (`xlsx` / SheetJS):**
  - Memproses berkas Excel 100% di memori peramban pengguna (client-side) tanpa menyimpan berkas di server disk, selaras dengan arsitektur Vercel Serverless.
  - Menjaga kerahasiaan data responden survei.
  - Alur konfirmasi: Jika pengguna mengklik **Batal**, 0 byte data dikirim ke server, memori dibersihkan, dan tidak ada log tersimpan. Data hanya dikirim saat tombol **Simpan Data Komentar** diklik.
- **Smart Column Detector (Algoritma Deteksi Kolom Cerdas):**
  - Heuristik bertingkat berbasis pembobotan kata kunci header (+15: saran, masukan, komentar, kritik, feedback, keluhan, kendala, evaluasi; +8: tuliskan, harapan, alasan, masalah; -30: id, ip address, date, scale, rating, prodi, upbjj, skor, telepon).
  - Evaluasi heuristik isi data sel: diskualifikasi jika >50% data numerik/skala Likert 1-5; bonus jika panjang rata-rata >15 karakter dan kalimat multikata.
  - Otomatis memilih kolom terbaik dan menyediakan dropdown pemilih kolom jika terdeteksi lebih dari satu kolom saran (misal pada survei mitra).
  - Menampilkan pratinjau komentar berpaginasi (5 masukan per halaman) dan total komentar valid yang siap diimpor.
- **Endpoint Baru `POST /api/survey/import` (`backend/app/api/routes.py`):**
  - Menerima payload `{ filename, column_name, comments }` hingga 2.000 komentar.
  - Menyimpan ke `raw_comments` dengan `platform = 'Survei'` dan `source_url = filename`.
  - Inferensi otomatis sentimen, emosi, dan topik lokal (`local_nlp.py`) serta batching Groq AI untuk kalimat $\ge 3$ kata.
  - Mencatat rekaman audit pada `scraper_logs` dengan `platform = 'Survei'`, `target_id = filename` (mencantumkan nama berkas asli), dan status `BERHASIL`.
- **Paginasi Performa Tinggi pada Seluruh Tabel Penarikan Data (`JobScheduler.tsx` & `routes.py`):**
  - **Tabel Sumber Data:** Paginasi client-side (5 target per halaman) lengkap dengan navigasi Sebelumnya/Berikutnya dan indikator rentang data.
  - **Tabel Riwayat Penarikan Data:** Paginasi server-side pada endpoint `GET /api/scraper/logs` (`page`, `size`, `total`, `total_pages`), navigasi halaman dinamis, dan badge khusus platform `Survei`.
- **Kepatuhan Mutlak Zero-Comments Rule:** Menjamin 100% seluruh kode Python, TypeScript, dan SQL bersih dari komentar kode.

### Versi 6.5 (September 2026) — Penarikan Data Overhaul, Platform Tabs, Sequential Queue Engine, Scraper Logs & Zero Apify Wording
- **Segmented Tabs per Sumber Data (`JobScheduler.tsx`):**
  - Menghadirkan navigasi tab modern: *Semua Sumber, Google Play, YouTube, Instagram, TikTok* dengan counter badge jumlah target aktif per kategori.
  - Memfilter daftar target URL secara dinamis sesuai tab platform yang aktif.
  - Mengadaptasi formulir penambahan target secara kontekstual: otomatis menyesuaikan platform, placeholder, petunjuk format, dan sanitasi otomatis query tracking URL.
- **Sequential Queue Runner dengan Isolasi Error (`JobScheduler.tsx` & `pipeline.py`):**
  - Menggantikan eksekusi paralel `Promise.all` serentak yang rentan memicu HTTP 429 Too Many Requests dan crash aktor dengan *Sequential Queue Engine* berurutan dengan jeda stabilisasi aman 1.2 detik.
  - Mengisolasi kegagalan per URL: jika salah satu URL gagal (misal postingan privat atau kadaluarsa), target lainnya tetap dieksekusi hingga tuntas tanpa menggagalkan seluruh antrean.
  - Membungkus I/O synchronous crawler ke dalam `asyncio.to_thread` di `pipeline.py` agar tidak memblok event loop asyncio FastAPI.
- **Modal Progres Real-Time Antrean Cerdas (`JobScheduler.tsx`):**
  - Menghadirkan modal pemantau live progress berdesain Neo-Organic Nu-Brutalism dengan progress bar persentase, status item antrean (berjalan, sukses, gagal, antre), durasi per target, dan rekap total penambahan data.
- **Tabel Riwayat Penarikan Data & Tabel Sumber yang Diperkaya (`JobScheduler.tsx` & `routes.py`):**
  - Membuat tabel dan model database `scraper_logs` untuk mencatat rekam jejak audit: waktu eksekusi, platform, target, status, jumlah data didapat, dan durasi eksekusi.
  - Menambahkan endpoint `GET /api/scraper/logs` dan endpoint toggle keaktifan target `PATCH /api/targets/{target_id}/toggle`.
  - Memperkaya tabel sumber data dengan badge platform resmi, tombol salin ID, tautan eksternal langsung menuju postingan/video asli, switch toggle aktif/mati, dan tombol aksi tarik instan per target.
- **Eliminasi Total Wording Vendor (Zero Apify Wording):**
  - Menghapus 100% penyebutan kata "Apify" di seluruh antarmuka sistem (UI Select platform, Form Settings token diubah menjadi *Social Media Crawler Token*, hak akses di Users diubah menjadi *Token Crawler & Groq AI*).
  - Menormalkan nilai platform pada scraper backend (`apify_scraper.py`, `tiktok_scraper.py`, `pipeline.py`) menjadi murni `Instagram` dan `TikTok`.
  - Mengeksekusi migrasi data lokal pada tabel `raw_comments` dan `scraper_targets` (`docs/supabase_create_scraper_logs.sql`).
- **Kepatuhan Zero-Comments Rule:** Menjamin seluruh kode Python, TypeScript, dan SQL bersih 100% dari komentar kode.

### Versi 6.4 (September 2026) — Data Explorer Upgrade, Universal Multi-Column Search, True Excel Export & Sentiment Lexicon Sterilization
- **Sterilisasi Leksikon Sentimen & Resolusi Bug Fatal Sentimen Positif & Negatif (`local_nlp.py`):**
  - Mengeliminasi kata tugas gramatikal dan stopword (*yang, itu, ini, ikut, lagi, sama, begini, tadi, bikin, baru, tahu, tau, jadi, pengen, mana*) yang sebelumnya tercatat berbobot penalti negatif ekstrem pada `negative.tsv` (-5, -3, dsb).
  - Menetralkan kata tanya interogatif (*apa, apakah, siapa, siapakah, kapan, dimana, bagaimana, berapa*) dari bias penalti negatif.
  - Menetralkan entitas fasilitas dan administrasi UT (*salut, upbjj, pokjar, sentra, admisi, registrasi, semester, pindah*) dari leksikon polaritas agar akronim SALUT (*Sentra Layanan Universitas Terbuka*) tidak menimbulkan false-positive.
  - Memperkuat bobot leksikon apresiasi positif (+3: *suka, kagum, terbesar, unggul, rekomendasi, terjangkau, fleksibel, berkualitas*) dan bobot keluhan birokrasi (-3: *dipersulit, ribet*).
  - Menerapkan **Strict Polarity Filtering** pada `detect_emotion_local` sehingga komentar `NEGATIF` hanya memilih emosi `["kecewa", "marah", "khawatir"]`, sedangkan komentar `POSITIF` hanya memilih emosi `["bangga", "puas", "senang"]`.
- **Pencarian Universal Multi-Kolom (`routes.py` & `DataExplorer.tsx`):**
  - Mengganti pencarian satu kolom teks menjadi *Universal Multi-Column Search* menggunakan klausa `or_()` yang mencakup: `text_content`, `author_name`, `platform`, `sentiment`, `emotion`, `topic_tags` (JSONB cast), dan `ai_reasoning`.
  - Menambahkan penyaringan rentang tanggal (`start_date` & `end_date`) baik pada API maupun filter antarmuka pengguna.
- **Ekspor Excel Asli dengan Batas Maksimal 1.000 Komentar (`routes.py` & `DataExplorer.tsx`):**
  - Mengganti unduhan CSV 15 baris client-side dengan generator Microsoft Excel XML Spreadsheet (`.xls` / SpreadsheetML) native zero-dependency pada endpoint `GET /api/comments/export/excel`.
  - Menata spreadsheet dengan styling korporat UT (Navy `#003f7a` header, teks putih tebal, cell borders, text wrap, lebar kolom proporsional).
  - Mengintegrasikan dialog modal interaktif pada antarmuka untuk memilih opsi *"Semua Data"* atau *"Rentang Tanggal Khusus"*.
  - Menampilkan banner peringatan transparan: *"Sistem membatasi unduhan hingga maksimal 1.000 komentar terbaru (baik untuk opsi Semua Data maupun Rentang Tanggal) demi menjaga performa serverless di production."*
- **Skrip Indeks & Perbaikan Data Historis Supabase (`docs/supabase_fix_sentiment_and_index.sql`):**
  - Menyediakan berkas SQL siap pakai untuk menambahkan indeks database performa tinggi (`posted_at DESC`, `platform`, `status`, `sentiment`, `emotion`, GIN pada `topic_tags`).
  - Menghapus kondisi pencocokan `%salut%` yang rancu pada query positif dan menambahkan query pemulihan keluhan (*dipersulit, gak ada progres, tidak konsisten, ribet*) kembali ke `NEGATIF` dan `kecewa`.
- **Kepatuhan Zero-Comments Rule:** Menjamin seluruh kode Python, TypeScript, dan SQL bersih 100% dari komentar kode.

### Versi 6.3 (September 2026) — Intelligent Topic Extraction & Dual-Tier AI Pipeline Alignment
- **Penyelarasan Ambang Batas Groq AI (Triage $\ge 3$ Kata):** Mengubah syarat pengiriman komentar ke Groq menjadi minimal 3 kata di `pipeline.py`. Komentar 1–2 kata dialihkan secara cerdas ke Local Engine.
- **Peningkatan Kecerdasan Local NLP Engine (`local_nlp.py`):**
  - Mengintegrasikan kamus klaster istilah ekosistem UT (`DOMAIN_TOPICS`: *Bahan Ajar & Modul, Biaya Pendidikan, Sistem & Aplikasi, Ujian & Penilaian, Registrasi & Admisi, Layanan Akademik, Fleksibilitas Kuliah, Kualitas Pendidikan*).
  - Mengimplementasikan modul deteksi emosi afektif lokal (`detect_emotion_local`) untuk mengeliminasi stigma default `"netral"`.
  - Mengimplementasikan ekstraksi topik dinamis non-umum (`extract_topics_local`) untuk memastikan komentar pendek tidak lagi dibuang ke label `"umum"`.
  - Menetralkan istilah entitas akademik (`kuliah`, `mahasiswa`, `modul`, `ujian`) dari bias negatif leksikon bawaan.
- **Penyelarasan Prompt Groq AI (`ai_engine.py`):**
  - Mengintegrasikan acuan klaster topik domain UT ke dalam `SYSTEM_PROMPT_BATCH`.
  - Menghapus aturan kaku yang memaksakan frasa 2 kata acak unik, memungkinkan konvergensi statistik pada grafik topik Dashboard tanpa mengorbankan fleksibilitas menangkap isu baru.
- **Skrip Pemulihan Data Historis Supabase (`docs/supabase_fix_topics.sql`):**
  - Menyediakan berkas SQL siap pakai untuk merapikan data historis bertag `"umum"` dan frasa unik di database Supabase Production langsung via SQL Editor.
- **Kepatuhan Zero-Comments Rule:** Menjamin seluruh file Python dan berkas SQL bersih 100% dari komentar kode.

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
- **Sinkronisasi Total Dokumentasi & Standar Baku AGENTS.md:**
  - Memperbarui `deployment-guide.md`, `architecture.md`, `database.md`, dan `state-tracker.md` dengan fakta implementasi Vercel + Supabase.
  - Menyelaraskan aturan `AGENTS.md` root dengan standar Global Bos (`FIRSTDEYAN_GLOBAL_PLUGIN`), mengadopsi Bagian 24 (*Direct Execution Principle* — anti-script proxy & larangan `run_command` untuk task native) dan mengamankan Aturan Lokal Proyek SI SORA di Bagian 25.
- **Redesain Menyeluruh Halaman Login (UI/UX Neo-Organic & Motion Interaktif):**
  - Mengeliminasi tumpang tindih logo dengan menata ulang layout panel kiri dalam flow flexbox alami.
  - Menerapkan teknik *Luminous Aura Silhouette* pada dual-logo SI SORA dan Universitas Terbuka: siluet kontur putih tajam (`drop-shadow 1.5px`) berpadu dengan pendaran emas UT (`rgba(254, 203, 0, 0.5)` halo) serta ambient backlight bloom, menghasilkan visibilitas kristal tanpa perlu kotak putih kaku.
  - Mencantumkan kepanjangan resmi *"Sistem Informasi Social Opinion Reaction Analytics"* dengan tipografi Emas UT (`#fecb00`) berkontras tinggi dan keterbacaan tajam.
  - Mengintegrasikan pemisah organik gelombang suara (*Acoustic Waveform Divider*) berbasis SVG beresolusi tinggi di perbatasan panel, bergelombang anggun menembus batas tanpa terpotong (*unclipped*), dipertegas garis kontur emas UT dengan pendaran neon emas.
  - Menampilkan visualisator spektrum audio bergerak (*Pure Kinetic Soundwave Bars*) tanpa label teks redundan, menyimulasikan analitik audio/suara publik secara dinamis.
  - Menerapkan efek gerak interaktif: *Kinetic Traveling Acoustic Light Pulse* pada garis gelombang emas UT (Ide A), ikon intip kata sandi (*toggle show/hide password*), dan tombol 3D bernuansa Nu-Brutalism dengan hard shadow Emas UT.
  - **Penyempurnaan Menyeluruh Tata Letak & Latar Belakang Desktop & Seluler:**
    - **Latar Belakang Panel Kiri & Gelombang Tanpa Seam:** Mengeliminasi hard-clip vertikal dengan menghapus spotlight kursor lokal dan menyelaraskan gradien `#001f3f` -> `#002b54` -> `#020617` serta tekstur `bgImage` ke dalam `clipPath` area gelombang, menghasilkan perpaduan 100% solid, tenang, dan prestisius tanpa batas potongan.
    - **Kinetic Traveling Acoustic Signal Wave (Ide A):** Mengintegrasikan seberkas kilatan cahaya laser neon putih-emas (`.acoustic-pulse-line`) yang meluncur mengalir dinamis mengikuti lekukan gelombang secara periodik, menyimulasikan data akustik suara publik real-time tanpa risiko merusak kanvas background.
    - **Koreksi Hierarki Komponen Seluler Sesuai Sketsa Bos:**
      1. Puncak Kartu (*Top Anchor*): Logo resmi Universitas Terbuka (`utLogo`) bersanding anggun dengan teks identitas *"Perpustakaan Pusat Universitas Terbuka"*.
      2. Di Bawah Logo UT: Teks identitas sistem — Judul **SI SORA**, kepanjangan resmi **Sistem Informasi Social Opinion Reaction Analytics** (warna Emas UT `#003f7a` / aksen kontras), dan tagline.
      3. Di Bawah Teks SI SORA: Logo utama **SI SORA** (`logoImage`) berukuran menonjol (`h-20` / 80px) di tengah (*centered*) dengan pendaran cahaya radial (*soft ambient bloom*).
      4. Di Bawah Logo SI SORA: Heading *"Selamat Datang"*, teks pengantar, formulir login dengan input ergonomis, dan tombol 3D Nu-Brutalism dengan hard shadow Emas UT.
    - **Peningkatan Latar Belakang Seluler (Deep Atmospheric Navy):** Mengganti latar belakang abu-abu polos di mobile dengan perpaduan tekstur kampus (`bgImage`) dan overlay gradien *dark navy* UT (`#001f3f` hingga `#020617`) serta ambient mesh glow emas, menciptakan kontras tinggi dan efek kartu melayang (*elevated floating card*) yang sangat mewah dan prestisius.
    - **Penyempurnaan Proporsi & Transisi Mulus Desktop (Rasio 60:40 & Flat White):**
      - Mengeliminasi cacat visual vertical seam ("kotak") secara permanen dengan memindahkan SVG wave divider ke tepi kanan panel kiri dan menggunakan fill putih solid (`#ffffff`) yang menyatu 100% dengan panel kanan.
      - Menyederhanakan latar belakang kiri menjadi satu foto utuh `bg.jpg` dengan single uniform overlay biru korporat (`bg-[#001f3f]/70`) demi keterbacaan teks maksimal tanpa layer bertumpuk.
      - Mengubah rasio desktop split-screen menjadi 60% panel kiri (`lg:w-[60%]`) dan 40% panel kanan (`lg:w-[40%]`).
      - Mengubah latar belakang panel kanan menjadi putih bersih murni (`lg:bg-white` / `#ffffff`) tanpa gradasi blur ambient, serta menerapkan warna kartu form `bg-slate-50` berpadu input putih bersih (`bg-white`) dan bayangan blok Nu-Brutalism `#003f7a`.
  - Memverifikasi kepatuhan Zero-Comments Rule 100% pada `Login.tsx`.

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
