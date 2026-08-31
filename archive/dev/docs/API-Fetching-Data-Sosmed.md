 Kemampuan Fetch Data Akun Orang Lain

  Jawaban Singkat: Tergantung platformnya

  Tidak semua API bisa mengakses akun/postingan orang lain dengan sama mudahnya. Berikut detailnya:

  ---
  Yang BISA Mengakses Data Orang Lain (Public Data)

  ┌───────────┬────────────────────────────────────────────────┬────────────────────────┐
  │ Platform  │             Data yang Bisa Diakses             │      Limit/Notes       │
  ├───────────┼────────────────────────────────────────────────┼────────────────────────┤
  │ Twitter/X │ ✅ Public tweets, timeline, user profile       │ 1,500 tweets/mo (free) │
  ├───────────┼────────────────────────────────────────────────┼────────────────────────┤
  │ YouTube   │ ✅ Public videos, channels, playlists          │ 10,000 units/day       │
  ├───────────┼────────────────────────────────────────────────┼────────────────────────┤
  │ Reddit    │ ✅ Public posts, comments, subreddits          │ 60 requests/min        │
  ├───────────┼────────────────────────────────────────────────┼────────────────────────┤
  │ Pinterest │ ✅ Public pins dan boards                      │ 1,000 requests/day     │
  ├───────────┼────────────────────────────────────────────────┼────────────────────────┤
  │ Facebook  │ ⚠️ Hanya public Pages, bukan personal accounts │ Sangat terbatas        │
  ├───────────┼────────────────────────────────────────────────┼────────────────────────┤
  │ LinkedIn  │ ⚠️ Company pages, public profiles saja         │ Perlu approval         │
  └───────────┴────────────────────────────────────────────────┴────────────────────────┘

  ---
  Yang SULIT/TIDAK BISA (Free Tier)

  ┌───────────┬────────────────────┬───────────────────────────────────────────────────┐
  │ Platform  │    Bisa Akses?     │                      Alasan                       │
  ├───────────┼────────────────────┼───────────────────────────────────────────────────┤
  │ Instagram │ ⚠️ Terbatas        │ Butuh Business account + App Review + permissions │
  ├───────────┼────────────────────┼───────────────────────────────────────────────────┤
  │ TikTok    │ ❌ Sangat terbatas │ Tidak ada public API untuk consumer data          │
  ├───────────┼────────────────────┼───────────────────────────────────────────────────┤
  │ Snapchat  │ ❌ Tidak           │ API fokus ke creative tools, bukan data mining    │
  └───────────┴────────────────────┴───────────────────────────────────────────────────┘

  ---
  Detail Per Platform

  ✅ Twitter/X API - Bisa (Paling Mudah)

  - Read public tweets dari akun manapun
  - Search tweets berdasarkan hashtag/keyword
  - Get user profile dan follower list
  - Tanpa perlu izin dari pemilik akun (asalkan public)

  ✅ YouTube Data API - Bisa

  - Semua video/channel yang public
  - Comment (terbatas)
  - Playlist public
  - Tanpa izin pemilik

  ✅ Reddit API - Bisa

  - Semua post/comment di subreddit public
  - User profile (jika public)
  - Tanpa izin pemilik
  - Rate limit cukup generous

  ⚠️ Instagram Graph API - Terbatas

  Yang BISA:
  - Public posts (jika akun public dan sudah approved)
  - Business/Creator accounts

  Yang TIDAK BISA (tanpa izin):
  - Private accounts
  - Personal accounts
  - Stories, Reels (sangat terbatas)

  ❌ TikTok API - ** практически tidak bisa**

  - Tidak ada API untuk mengambil video/postingan user lain
  - Yang tersedia: hanya untuk content posting你自己
  - Sangat закрыто untuk data harvesting

  ---
  Aturan Umum

  1. PUBLIC DATA = Biasanya bisa diambil tanpa izin
  2. PRIVATE DATA = Butuh izin eksplisit dari pemilik
  3. BUSINESS TOOLS = Lebih banyak akses (contoh: Instagram Business API)
  4. CONSUMER APPS = Sangat dibatasi (contoh: TikTok)

  ---
  Contoh Real

  ┌──────────────────────────┬─────────┬─────────┬────────┬───────────┐
  │         Use Case         │ Twitter │ YouTube │ Reddit │ Instagram │
  ├──────────────────────────┼─────────┼─────────┼────────┼───────────┤
  │ Baca post öffentlich     │ ✅      │ ✅      │ ✅     │ ⚠️        │
  ├──────────────────────────┼─────────┼─────────┼────────┼───────────┤
  │ Cari berdasarkan hashtag │ ✅      │ ✅      │ ✅     │ ❌        │
  ├──────────────────────────┼─────────┼─────────┼────────┼───────────┤
  │ Analytics orang lain     │ ❌      │ ⚠️      │ ❌     │ ⚠️        │
  ├──────────────────────────┼─────────┼─────────┼────────┼───────────┤
  │ Total followers          │ ✅      │ ✅      │ ❌     │ ⚠️        │
  ├──────────────────────────┼─────────┼─────────┼────────┼───────────┤
  │ Komentar/postingan       │ ✅      │ ⚠️      │ ✅     │ ⚠️        │
  └──────────────────────────┴─────────┴─────────┴────────┴───────────┘

  ---
  Rekomendasi

  Yang paling mudah untuk akses data orang lain:
  1. Twitter/X - paling straightforward
  2. YouTube - quota cukup, data lengkap
  3. Reddit - almost everything public is accessible

  Yang perlu dihindari untuk free/public data:
  - Instagram (butuh proses panjang)
  - TikTok (tidak ada akses)