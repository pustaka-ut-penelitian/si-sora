# Design System — SI SORA

**Nama Sistem:** SI SORA (Sistem Informasi Social Opinion Reaction Analytics)  
**Konsep Visual:** Neo-Organic UI / Nu-Brutalism  
**Filosofi:** Menghubungkan ketegasan data institusional dengan kehangatan interaksi publik (*Zero AI-Slop*)  
**Status:** Terimplementasi 100% pada Frontend React 19  

---

## 1. Filosofi & Karakter Visual

SI SORA menolak tampilan antarmuka AI yang generik, hambar, dan membosankan (*anti AI-slop*). Antarmuka dibangun di atas perpaduan dua gaya visual mutakhir:
- **Nu-Brutalism:** Batas garis tegas (*high-contrast borders*), bayangan retro keras (*offset hard shadows*), tipografi kontras tinggi, dan struktur kartu bento yang modular.
- **Neo-Organic:** Bentuk-bentuk lembut bersudut membulat ekstrem (*squircle* / kapsul `rounded-[2rem]`), efek kaca buram (*glassmorphism backdrop blur*), dan palet warna resmi Universitas Terbuka yang berwibawa.

---

## 2. Palet Warna Resmi (Color Palette)

### A. Warna Utama Institusional (Universitas Terbuka)
- **Primary Navy Blue (`#003f7a`):** Warna biru tua kehormatan Universitas Terbuka. Digunakan pada header kartu utama, tombol aksi primer, teks penekanan, dan bayangan tegas modular.
- **Secondary Gold / Yellow (`#fecb00`):** Warna kuning emas Universitas Terbuka. Digunakan sebagai aksen vital, highlight badge, penanda interaktif, dan tombol pemicu insight AI.

### B. Warna Semantik Sentimen & Emosi
- **Sentimen Positif:** Emerald / Green (`#10b981` / teks `#059669`, latar `bg-emerald-50`, border `border-emerald-200`).
- **Sentimen Negatif:** Rose / Red (`#f43f5e` / teks `#e11d48`, latar `bg-rose-50`, border `border-rose-200`).
- **Sentimen Netral:** Slate / Gray (`#64748b` / teks `#475569`, latar `bg-slate-50`, border `border-slate-200`).

### C. Warna Latar & Permukaan
- **Canvas Background:** `#f8fafc` hingga `#f1f5f9` dilengkapi motif dot-matrix halus (*subtle grid pattern*).
- **Surface Card (Bento Tile):** `bg-white/85 backdrop-blur-md border-2 border-slate-200`.
- **Card Hard Shadow:** `shadow-[4px_4px_0px_0px_#cbd5e1]` untuk kartu reguler, dan `shadow-[6px_6px_0px_0px_#003f7a]` untuk kartu hero pimpinan.

---

## 3. Tipografi (Typography)

Sistem menggunakan kombinasi dua font modern dari Google Fonts:
1. **Headline Font — Plus Jakarta Sans:**
   - Bobot: `font-extrabold` (800) dan `font-black` (900).
   - Penerapan: Judul halaman dashboard, metrik angka statistik sentimen, label kartu metrik, dan judul modal.
   - Sifat: Berani, modern, geometris, dan mudah dibaca secara sekilas oleh pimpinan.
2. **Body Font — Inter:**
   - Bobot: `font-medium` (500) dan `font-semibold` (600).
   - Penerapan: Teks komentar masyarakat, deskripsi analitik, narasi AI, tabel data explorer, dan kontrol formulir.
   - Sifat: Sangat ergonomis dan jernih pada berbagai resolusi layar.

---

## 4. Komponen Arsitektur UI (Bento Grid)

### A. Floating Header Card
- Kartu utama di bagian atas yang menampilkan identitas resmi sistem:
  - Logo SI SORA di sisi kiri (bersih tanpa kotak latar belakang biru yang mengganggu).
  - Judul sistem: *Sistem Informasi Social Opinion Reaction Analytics*.
  - Logo Universitas Terbuka di sisi kanan.
  - Kartu ringkasan waktu penarikan data terakhir.

### B. Metric Summary Bento (3 Kartu Sentimen + 1 Total)
- Susunan 4 kartu modular melayang yang memperlihatkan proporsi persepsi masyarakat:
  - Kartu Total Analisis Komentar & Opini Publik.
  - Kartu Persentase Sentimen Positif.
  - Kartu Persentase Sentimen Negatif.
  - Kartu Persentase Sentimen Netral.
- Masing-masing kartu memiliki interaksi hover micro-elevation (`hover:-translate-y-1 transition-transform`).

### C. Word Cloud Panel
- Panel visualisasi dinamis yang merender kata kunci paling vokal dibicarakan mahasiswa/masyarakat.
- Visual awan kata dihasilkan dengan latar transparan dan warna kata yang terhubung dengan sentimen dominan.

### D. Floating Dock Navigation (Pill Dock)
- Menu navigasi melayang berbentuk kapsul membulat penuh (*pill shape*) di bagian bawah layar.
- Dilengkapi ikon intuitif dari Lucide Icons untuk berpindah antara Dasbor, Ekplorasi Data, Penjadwalan Job, Data Pengguna, dan Pengaturan Sistem.
