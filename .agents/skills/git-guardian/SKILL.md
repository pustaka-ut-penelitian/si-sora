---
name: git-guardian
description: >-
  WAJIB diaktifkan sebelum operasi Git apapun (commit, push, merge, branch).
  Skill ini memastikan version control digunakan secara aman, konsisten,
  dan tidak ada perubahan yang hilang atau merusak branch utama.
---

# Git Guardian — Safe & Consistent Version Control

## Prinsip Utama

Git adalah jaring pengaman. Digunakan dengan benar, tidak ada pekerjaan yang hilang dan history selalu bisa ditelusuri. Digunakan sembarangan, satu push bisa merusak production.

---

## 1. Aturan Absolut (Tidak Ada Pengecualian)

- **DILARANG** commit atau push tanpa instruksi eksplisit dari Bos.
- **DILARANG** push langsung ke branch `main` atau `master` — selalu lewat branch feature.
- **DILARANG** force push (`git push --force`) tanpa persetujuan eksplisit Bos dan penjelasan risiko yang jelas.
- **DILARANG** merge branch tanpa Bos mengetahui dan menyetujuinya.

---

## 2. Konvensi Commit Message (Conventional Commits)

Format wajib untuk semua commit:
```
<type>(<scope>): <deskripsi singkat dalam bahasa Indonesia>
```

| Type | Kapan Dipakai |
|------|---------------|
| `feat` | Fitur baru |
| `fix` | Perbaikan bug |
| `refactor` | Perubahan kode tanpa mengubah behavior |
| `style` | Perubahan format/style (bukan CSS) |
| `perf` | Peningkatan performa |
| `security` | Perbaikan keamanan |
| `docs` | Perubahan dokumentasi |
| `chore` | Maintenance (update dependency, config, dll.) |

**Contoh yang benar:**
```
feat(auth): tambahkan login dengan Google OAuth
fix(api): perbaiki error 500 saat payload kosong
refactor(user): pisahkan logika validasi ke service terpisah
```

**DILARANG:**
```
git commit -m "update"
git commit -m "fix bug"
git commit -m "changes"
```

---

## 3. Branching Strategy

```
main / master     ← Production — TIDAK BOLEH langsung di-push
    └── develop   ← Integration branch (jika ada)
          └── feature/nama-fitur    ← Tempat semua development
          └── fix/nama-bug
          └── hotfix/nama-issue     ← Untuk fix urgent di production
```

**Cara membuat branch baru:**
```
git checkout -b feature/nama-fitur-deskriptif
```

Nama branch harus deskriptif — bukan `feature/1`, `fix/test`, atau `branch-baru`.

---

## 4. Pre-Commit Checklist

Sebelum setiap commit, pastikan:
- [ ] Tidak ada file `.env`, credential, atau secret yang ikut ter-commit
- [ ] Tidak ada file `node_modules/`, `vendor/`, atau build artifact yang ter-commit
- [ ] `.gitignore` sudah mencakup semua file yang tidak perlu di-track
- [ ] Kode sudah diverifikasi berjalan — tidak commit kode yang broken
- [ ] Commit message mengikuti format Conventional Commits
- [ ] Scope commit tidak terlalu besar — satu commit satu perubahan yang logis

---

## 5. Situasi Darurat

**Commit salah sudah terlanjur di-push:**
- Jangan panik, jangan force push
- Buat commit baru yang memperbaiki masalahnya (`fix:` atau `revert:`)
- Laporkan ke Bos sebelum mengambil tindakan apapun

**File sensitif ter-commit:**
- Hentikan semua aktivitas Git
- Laporkan ke Bos segera
- Jangan coba "tutup-tutupi" dengan commit baru — ini butuh penanganan khusus (git history rewrite)
