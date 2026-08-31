---
name: doc-sync-guardian
description: >-
  WAJIB diaktifkan setiap kali melakukan perubahan pada arsitektur, struktur
  database, desain UI/UX, atau state aplikasi. Skill ini memastikan folder docs/
  tidak pernah basi dan selalu merefleksikan kondisi kode terbaru.
---

# Doc Sync Guardian — Penjaga Kebenaran Dokumentasi

## Prinsip Utama

Dokumentasi yang _outdated_ (basi) lebih berbahaya daripada tidak ada dokumentasi sama sekali. Di project besar, folder `docs/` adalah "Otak Kedua".

---

## 1. Trigger Kondisi (Kapan Wajib Sync)

Jika Anda (AI) baru saja melakukan salah satu dari hal ini di dalam kode:

- Menambah, mengubah, atau menghapus tabel/kolom database.
- Menambah _environment variable_ baru.
- Mengubah alur arsitektur atau dependensi utama (misal: ganti library auth).
- Mengubah standar warna atau ukuran di konfigurasi UI (Tailwind config).
- Menyelesaikan sebuah fitur besar atau menemukan bug baru.

**MAKA:** Anda WAJIB membuka folder `docs/` dan mengupdate file yang bersesuaian.

---

## 2. Pemetaan Sinkronisasi

| Perubahan di Kode                           | File Docs yang Wajib Diupdate |
| ------------------------------------------- | ----------------------------- |
| Skema DB, Prisma, SQL                       | `docs/database.md`            |
| Struktur folder, Tech Stack, `package.json` | `docs/architecture.md`        |
| `tailwind.config.ts`, file CSS, warna, font | `docs/design.md`              |
| Fitur selesai, Todo list, bug ditemukan     | `docs/state-tracker.md`       |

---

## 3. Protokol Update

- **Jangan timpa tanpa membaca:** Baca dulu isi file di `docs/` sebelum mengubahnya. Tambahkan apa yang baru, edit yang berubah.
- **Beritahu Bos:** Saat melaporkan hasil kerja, sampaikan secara eksplisit: _"Saya juga sudah mengupdate file `docs/database.md` untuk menyesuaikan perubahan tabel ini."_
- **Akurat:** Pastikan diagram Mermaid (jika ada) tidak _broken_ sintaksnya setelah diupdate.
