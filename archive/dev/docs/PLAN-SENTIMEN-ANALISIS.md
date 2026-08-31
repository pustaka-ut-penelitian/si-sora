# Riset Sentimen Analisis - Universitas Terbuka

## Overview

Aplikasi web single-page untuk melakukan sentiment analysis terhadap Universitas Terbuka menggunakan data dari social media dan portal berita.

**Tech Stack**: Python FastAPI (Backend) + React 19 (Frontend)
**Batasan**: Tanpa auth, single page, $0 biaya third-party
**Target**: Menganalisis persepsi masyarakat terhadap Universitas Terbuka melalui berbagai sumber data publik.

---

## Goals & Objectives

### Primary Goals
1. **Monitoring Sentimen**: Mengetahui apakah persepsi masyarakat terhadap Universitas Terbuka bersifat positif, negatif, atau netral.
2. **Trend Analysis**: Mengidentifikasi isu atau topik yang sedang hangat dibicarakan terkait UT.
3. **Insight Generation**: Menyediakan data-driven insights untuk memahami strength dan weakness UT di mata publik.

### Secondary Goals
1. **Real-time Dashboard**: Visualisasi data sentimen secara real-time dalam satu halaman.
2. **Historical Tracking**: Menyimpan dan melacak data historis untuk melihat perubahan sentimen dari waktu ke waktu.
3. **Alert System** (future): Notifikasi jika ada lonjakan sentimen negatif yang signifikan.

---

## Sumber Data

### Sumber Data yang Digunakan

| Sumber | Auth | Limit | Update Freq | Data yang Diambil |
|--------|------|-------|-------------|-------------------|
| **YouTube Data API v3** | Ya (free) | 10,000 units/day | Per fetch | Video comments, video metadata |
| **Google News RSS** | Tidak | Unlimited | Per fetch | Judul & cuplikan berita |
| **Reddit API** | Tidak | 60 req/min | Per fetch | Post titles, post bodies, comments |
| **Twitter/X API** | Ya (free tier) | 500K tweets/month | Per fetch | Tweets, retweets, replies |

### Tidak Digunakan (untuk saat ini)
- Web scraping langsung - terlalu beresiko blocked/ban IP
- Instagram Graph API - butuh business account + app review
- TikTok API - tidak ada public API untuk data harvesting

---

### YouTube Data API v3 - Detail

#### Kenapa YouTube?
- **Kaya akan sentimen**: Comment section video UT berisi opini jujur dari mahasiswa/potential students
- **Quota generous**: 10,000 units/day - cukup untuk daily fetch
- **No auth needed for public data**: Bisa fetch public video comments tanpa izin pemilik
- **Indonesian content**: Banyak content creator Indonesia yang membahas pengalaman kuliah di UT

#### Search Query untuk YouTube
```
Primary Keywords:
- "Universitas Terbuka"
- "Kuliah di UT"
- "Universitas Terbuka online"

Secondary Keywords (untuk broaden search):
- "review Universitas Terbuka"
- "pengalaman kuliah UT"
- "tips Universitas Terbuka"
- "beasiswa Universitas Terbuka"
- "UT belajar online"
- "Universitas Terbuka worth it"
- "jarak jauh UT"
- "kuliah jarak jauh Indonesia"
```

#### YouTube API Quota Usage
```
Search: 100 units per request
Video List: 1 unit per video
Comment Threads: 1 unit per page
Comment: 1 unit per request

Estimated daily usage: ~500-1000 units (dengan 5-10 video per fetch)
Buffer: Masih ada 8,000+ units untuk kondisi emergency
```

#### YouTube Data Fields yang Diambil
```python
{
    "video_id": str,
    "video_title": str,
    "channel_title": str,
    "published_at": datetime,
    "comment_id": str,
    "comment_text": str,
    "like_count": int,
    "author": str,
    "parent_id": str | None,  # None = top-level comment
}
```

---

### Google News RSS - Detail

#### RSS Endpoint
```
https://news.google.com/rss/search?q=Universitas+Terbuka
```

#### Alternative News Sources
| Portal | Method | Search Query |
|--------|--------|--------------|
| Detik | RSS | Custom URL with search |
| Kompas | RSS | Custom URL with search |
| BeritaSatu | RSS | Custom URL with search |

#### Google News Data Fields
```python
{
    "title": str,
    "link": str,
    "description": str,  # Snippet
    "pubDate": datetime,
    "source": str,  # news portal name
}
```

---

### Reddit API - Detail

#### Target Subreddits
```
Primary:
- r/indonesia
- r/kuliah
- r/beasiswa

Secondary:
- r/pertanyaan
- r/kerja
- r/snmptn (untuk UT sebagai alternatif)
```

#### Reddit Data Fields
```python
{
    "post_id": str,
    "subreddit": str,
    "title": str,
    "selftext": str,  # Post body
    "score": int,
    "num_comments": int,
    "created_utc": datetime,
    "url": str,
}

# For comments (via comment threads):
{
    "comment_id": str,
    "post_id": str,
    "body": str,
    "author": str,
    "score": int,
    "created_utc": datetime,
}
```

---

### Twitter/X API - Detail

#### Search Queries
```
"Universitas Terbuka" lang:id
"Universitas Terbuka" from:verified_users
"UT kampus" lang:id
"kuliah online UT"
```

#### Twitter Data Fields
```python
{
    "tweet_id": str,
    "text": str,
    "author_id": str,
    "author_username": str,
    "created_at": datetime,
    "public_metrics": {
        "retweet_count": int,
        "like_count": int,
        "reply_count": int,
    },
    "referenced_tweets": list,  # For replies/retweets
}
```

---

## Sentiment Analysis

### Pendekatan: Lexicon-Based (Indonesian)

**Mengapa Lexicon-Based?**
- Tidak butuh training data yang besar
- Bisa implemented dengan library Sastrawi yang sudah mature
- $0 cost - tidak perlu GPU/ML model hosting
- Cukup akurat untuk understanding umum (~65-75%)

**Alternatif di masa depan (jika needed):**
- IndoBERT (transformer-based) untuk akurasi lebih tinggi
- namun perlu tambahan compute cost

### Library yang Digunakan
```
Preprocessing:
- Sastrawi>=1.0.0: Indonesian stemmer & stopword removal

Sentiment:
- Custom Lexicon: ~500+ kata Indonesia dengan skor sentimen

Keyword Extraction:
- YAKE>=0.4.0: Yet Another Keyword Extractor (Indonesian support)
```

### Pipeline Text Processing

```
┌─────────────────────────────────────────────────────────────────┐
│                     TEXT PROCESSING PIPELINE                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Input Text                                                   │
│     "Universitas Terbuka sangat membantu saya untuk kuliah!"    │
│                                                                  │
│  2. Lowercase                                                    │
│     "universitas terbuka sangat membantu saya untuk kuliah!"     │
│                                                                  │
│  3. Remove URLs, @mentions, #hashtags                           │
│     "universitas terbuka sangat membantu saya untuk kuliah!"     │
│                                                                  │
│  4. Remove extra whitespace, punctuation                        │
│     "universitas terbuka sangat membantu saya untuk kuliah"      │
│                                                                  │
│  5. Tokenization                                                 │
│     ["universitas", "terbuka", "sangat", "membantu", "kuliah"]  │
│                                                                  │
│  6. Stopword Removal (Sastrawi)                                 │
│     ["universitas", "terbuka", "sangat", "membantu", "kuliah"]  │
│     (universitas, untuk mungkin dihapus jika ada di stopword)   │
│                                                                  │
│  7. Stemming (Sastrawi)                                         │
│     ["universitas", "terbuka", "sangat", "bantu", "kuliah"]      │
│                                                                  │
│  8. Sentiment Scoring                                           │
│     - sangat: +1.5 (intensifier)                                │
│     - bantu: +1.0 (positive word)                              │
│     Total: +2.5                                                 │
│                                                                  │
│  9. Normalize to [-1, +1]                                       │
│     score = +2.5 → normalized = +0.83                          │
│                                                                  │
│  10. Label Assignment                                           │
│      +0.83 → "positive" (threshold: >0.2)                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Sentiment Classification Rules

```python
def classify_sentiment(score: float) -> str:
    if score > 0.2:
        return "positive"
    elif score < -0.2:
        return "negative"
    else:
        return "neutral"
```

### Keyword Extraction

```
Method: YAKE (Yet Another Keyword Extractor)

Configuration:
- Language: Indonesian (id)
- Max n-grams: 3
- Number of keywords: 10 (top per document)

Output: List of (keyword, score) tuples
- Lower score = more relevant keyword
```

---

## Database Schema (SQLite)

```sql
-- sources: sumber data
CREATE TABLE sources (
    id INTEGER PRIMARY KEY,
    name VARCHAR(100),
    type VARCHAR(50),  -- 'rss', 'reddit', 'twitter', 'youtube'
    url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- raw_mentions: data mentah dari sources
CREATE TABLE raw_mentions (
    id INTEGER PRIMARY KEY,
    source_id INTEGER REFERENCES sources(id),
    external_id VARCHAR(255),
    content TEXT NOT NULL,
    author VARCHAR(100),
    posted_at TIMESTAMP,
    fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    url TEXT,
    metadata TEXT,  -- JSON for source-specific data (e.g., like_count, video_id)
    UNIQUE(source_id, external_id)
);

-- processed_mentions: hasil analisis
CREATE TABLE processed_mentions (
    id INTEGER PRIMARY KEY,
    mention_id INTEGER REFERENCES raw_mentions(id),
    clean_text TEXT,
    sentiment_score FLOAT,  -- -1 to 1
    sentiment_label VARCHAR(20),  -- positive, neutral, negative
    sentiment_confidence FLOAT,  -- 0 to 1, how certain the classification is
    keywords TEXT,  -- JSON array of {keyword, score}
    processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- hourly_aggregates: pre-computed untuk dashboard
CREATE TABLE hourly_aggregates (
    id INTEGER PRIMARY KEY,
    source_id INTEGER REFERENCES sources(id),
    hour_bucket TIMESTAMP,
    positive_count INTEGER DEFAULT 0,
    neutral_count INTEGER DEFAULT 0,
    negative_count INTEGER DEFAULT 0,
    total_count INTEGER DEFAULT 0,
    UNIQUE(source_id, hour_bucket)
);

-- daily_aggregates: pre-computed untuk trend yang lebih panjang
CREATE TABLE daily_aggregates (
    id INTEGER PRIMARY KEY,
    source_id INTEGER REFERENCES sources(id),
    date_bucket DATE,
    positive_count INTEGER DEFAULT 0,
    neutral_count INTEGER DEFAULT 0,
    negative_count INTEGER DEFAULT 0,
    total_count INTEGER DEFAULT 0,
    UNIQUE(source_id, date_bucket)
);

-- fetch_logs: tracking history fetch
CREATE TABLE fetch_logs (
    id INTEGER PRIMARY KEY,
    source_id INTEGER REFERENCES sources(id),
    fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    items_fetched INTEGER,
    items_new INTEGER,
    items_updated INTEGER,
    status VARCHAR(20),  -- 'success', 'partial', 'failed'
    error_message TEXT
);

-- videos: khusus untuk YouTube video metadata
CREATE TABLE youtube_videos (
    id INTEGER PRIMARY KEY,
    video_id VARCHAR(50) UNIQUE,
    title VARCHAR(500),
    channel_title VARCHAR(200),
    published_at TIMESTAMP,
    fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Database Indexes

```sql
CREATE INDEX idx_mentions_source ON raw_mentions(source_id);
CREATE INDEX idx_mentions_posted ON raw_mentions(posted_at);
CREATE INDEX idx_processed_sentiment ON processed_mentions(sentiment_label);
CREATE INDEX idx_aggregates_hour ON hourly_aggregates(hour_bucket);
CREATE INDEX idx_aggregates_date ON daily_aggregates(date_bucket);
```

---

## API Endpoints

### Health & Sources

```
GET  /api/health
     Response: { "status": "ok", "version": "1.0.0", "timestamp": "..." }

GET  /api/sources
     Response: [{ "id": 1, "name": "YouTube", "type": "youtube", "is_active": true, ... }]

POST /api/sources
     Body: { "name": "YouTube", "type": "youtube", "url": "..." }
     Response: { "id": 1, ... }
```

### Analytics

```
GET  /api/analytics/summary
     Query params: ?days=7 (default 7, max 90)
     Response:
     {
       "total_mentions": 15420,
       "total_mentions_change": 12.5,  // % change from previous period
       "sentiment_breakdown": {
         "positive": 0.45,
         "neutral": 0.30,
         "negative": 0.25
       },
       "sentiment_change": {
         "positive": 2.1,
         "neutral": -0.5,
         "negative": -1.6
       },
       "last_updated": "2026-03-22T10:30:00Z",
       "trend": "improving",  // "improving", "stable", "declining"
       "top_keywords": [
         { "keyword": "pembelajaran", "count": 120, "sentiment": "positive" },
         { "keyword": "online", "count": 98, "sentiment": "neutral" },
         { "keyword": "fleksibel", "count": 87, "sentiment": "positive" }
       ]
     }

GET  /api/analytics/trends
     Query params: ?days=30
     Response:
     {
       "data": [
         { "date": "2026-03-01", "positive": 45, "neutral": 30, "negative": 25 },
         { "date": "2026-03-02", "positive": 47, "neutral": 28, "negative": 25 },
         ...
       ],
       "period": "daily"
     }

GET  /api/analytics/keywords
     Query params: ?limit=20&days=7
     Response:
     {
       "keywords": [
         { "keyword": "pembelajaran", "count": 120, "sentiment": "positive", "avg_score": 0.65 },
         { "keyword": "biaya", "count": 98, "sentiment": "negative", "avg_score": -0.42 },
         ...
       ]
     }

GET  /api/analytics/volume
     Query params: ?days=30
     Response:
     {
       "data": [
         { "date": "2026-03-01", "total": 520 },
         { "date": "2026-03-02", "total": 480 },
         ...
       ]
     }

GET  /api/analytics/by-source
     Response:
     {
       "sources": [
         {
           "name": "YouTube",
           "type": "youtube",
           "total": 5000,
           "positive": 0.48,
           "neutral": 0.32,
           "negative": 0.20
         },
         ...
       ]
     }

GET  /api/analytics/trending
     Response:
     {
       "trending_up": [
         { "keyword": "pembelajaran online", "change": 15.2, "sentiment": "positive" },
         ...
       ],
       "trending_down": [
         { "keyword": "biaya kuliah", "change": -8.5, "sentiment": "negative" },
         ...
       ]
     }
```

### Mentions

```
GET  /api/mentions/recent
     Query params: ?page=1&limit=20&source=youtube&sentiment=positive
     Response:
     {
       "data": [
         {
           "id": 123,
           "source": "youtube",
           "content": "Universitas Terbuka sangat membantu saya...",
           "author": "John Doe",
           "sentiment": "positive",
           "sentiment_score": 0.83,
           "posted_at": "2026-03-22T08:00:00Z",
           "url": "https://youtube.com/watch?v=..."
         },
         ...
       ],
       "pagination": {
         "page": 1,
         "limit": 20,
         "total": 15420,
         "total_pages": 771
       }
     }

GET  /api/mentions/{id}
     Response:
     {
       "id": 123,
       "source": "youtube",
       "external_id": "abc123",
       "content": "Original text...",
       "clean_text": "Cleaned text...",
       "author": "John Doe",
       "posted_at": "2026-03-22T08:00:00Z",
       "url": "https://youtube.com/watch?v=...",
       "sentiment": "positive",
       "sentiment_score": 0.83,
       "sentiment_confidence": 0.91,
       "keywords": [{"keyword": "membantu", "score": 0.15}, ...],
       "metadata": { "like_count": 42, "video_title": "Review UT" }
     }
```

### Fetching

```
POST /api/fetch/manual
     Body (optional): { "source": "youtube" }  // Jika kosong, fetch semua
     Response:
     {
       "status": "started",
       "job_id": "abc123",
       "sources_triggered": ["youtube", "reddit"]
     }

GET  /api/fetch/status/{job_id}
     Response:
     {
       "job_id": "abc123",
       "status": "running",  // "running", "completed", "failed"
       "progress": { "youtube": 50, "reddit": 100 },
       "started_at": "2026-03-22T10:00:00Z"
     }
```

---

## Dashboard UI Design

### Single Page Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│  HEADER                                                                  │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │ 🔍 Sentimen Analisis - Universitas Terbuka    [🔄 Refresh] [📅]   │ │
│  └───────────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────────┤
│  SUMMARY CARDS                                                          │
│  ┌──────────────┐ ┌──────────────────────┐ ┌────────────────────────┐ │
│  │ Total Data   │ │    Sentimen Overall   │ │     Trend Indicator   │ │
│  │   15,420    │ │  Pos: 45%  Neu: 30%   │ │  ↗ Meningkat +2.1%    │ │
│  │  ↑ +12.5%   │ │  Neg: 25%            │ │  vs yesterday         │ │
│  └──────────────┘ └──────────────────────┘ └────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────────┤
│  CHARTS ROW 1                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │              SENTIMENT TREND (7 Hari) - Line Chart                 │ │
│  │   50% ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─      │ │
│  │   45% ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─      │ │
│  │   40% ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─      │ │
│  │        Mon   Tue   Wed   Thu   Fri   Sat   Sun                     │ │
│  │        ── Positive  ── Neutral  ── Negative                       │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────────┤
│  CHARTS ROW 2                                                            │
│  ┌───────────────────────────────┐ ┌───────────────────────────────────┐│
│  │    SENTIMENT BY SOURCE        │ │       VOLUME OVER TIME            ││
│  │         (Pie/Donut)           │ │         (Area Chart)             ││
│  │   YouTube  ████████  45%     │ │   ╭╮                               ││
│  │   Twitter  ██████    30%     │ │  ╭╯ ╰──╮                          ││
│  │   Reddit   ████      20%     │ │ ╭╯     ╰──╮                       ││
│  │   News     ██        10%     │ │╭╯         ╰────╮                  ││
│  └───────────────────────────────┘ └───────────────────────────────────┘│
├─────────────────────────────────────────────────────────────────────────┤
│  KEYWORDS & TRENDING                                                    │
│  ┌───────────────────────────────┐ ┌───────────────────────────────────┐│
│  │        TOP KEYWORDS           │ │         TRENDING TOPICS          ││
│  │                                │ │                                   ││
│  │  🔵 pembelajaran (pos)   120  │ │  📈 ↑ pembelajaran online  +15% ││
│  │  ⚪ online (neu)          98  │ │  📈 ↑ fleksibel           +12%  ││
│  │  🔵 fleksibel (pos)       87  │ │  📉 ↓ biaya kuliah        -8%  ││
│  │  🔴 biaya (neg)           75  │ │  📈 ↑ mudah                +7%  ││
│  │  🔵 mudah (pos)           68  │ │                                   ││
│  │                                │ │                                   ││
│  └───────────────────────────────┘ └───────────────────────────────────┘│
├─────────────────────────────────────────────────────────────────────────┤
│  RECENT MENTIONS                                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │  Filter: [All Sources ▼] [All Sentiment ▼] [Search...]            │ │
│  ├─────────────────────────────────────────────────────────────────────┤ │
│  │ Source  │ Content Preview                    │ Sentiment │ Time │ │
│  ├─────────┼──────────────────────────────────────┼───────────┼──────┤ │
│  │ 📺 UT   │ "Universitas Terbuka sangat memb... │  Positive │ 2h   │ │
│  │ 🐦 @user │ "Reviewed UT, recommend untuk ja... │  Positive │ 4h   │ │
│  │ 📰 Detik│ "Universitas Terbuka launches new... │  Neutral  │ 6h   │ │
│  │ 💬 r/    │ "Pengalaman kuliah di UT, biaya t... │  Negative │ 8h   │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│  [← Previous]  Page 1 of 771  [Next →]                                 │
└─────────────────────────────────────────────────────────────────────────┘
```

### Component Specifications

| Component | Library | Type |
|-----------|--------|------|
| Line Chart | Recharts | Sentiment Trends |
| Area Chart | Recharts | Volume Over Time |
| Pie/Donut | Recharts | Sentiment by Source |
| Keyword List | Custom | Top Keywords |
| Mentions Table | Custom + React Table | Recent Data |

### Color Palette

```
Positive:  #22C55E (green-500)
Neutral:   #6B7280 (gray-500)
Negative:  #EF4444 (red-500)
Primary:   #3B82F6 (blue-500)
Background: #F9FAFB (gray-50)
Card BG:   #FFFFFF
Text:      #111827 (gray-900)
Text Muted: #6B7280 (gray-500)
```

### Responsive Breakpoints

```
Mobile:  < 640px   (single column, stacked cards)
Tablet:  640-1024px (2 columns)
Desktop: > 1024px  (full layout as shown)
```

---

## Project Structure

```
sentiment-dashboard/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI entry point
│   │   ├── config.py            # Settings & environment
│   │   ├── database.py          # SQLite connection & session
│   │   ├── models.py            # SQLAlchemy ORM models
│   │   ├── schemas.py           # Pydantic request/response schemas
│   │   │
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   ├── router.py        # Main API router
│   │   │   ├── analytics.py     # Dashboard analytics endpoints
│   │   │   ├── sources.py       # Source management endpoints
│   │   │   ├── mentions.py      # Raw mentions endpoints
│   │   │   └── fetch.py         # Manual fetch endpoints
│   │   │
│   │   ├── pipelines/
│   │   │   ├── __init__.py
│   │   │   ├── base.py          # Base fetcher class
│   │   │   ├── fetchers/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── youtube_fetcher.py   # YouTube Data API v3
│   │   │   │   ├── rss_fetcher.py      # Google News RSS
│   │   │   │   ├── reddit_fetcher.py   # Reddit API
│   │   │   │   └── twitter_fetcher.py  # Twitter/X API v2
│   │   │   │
│   │   │   ├── processors/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── preprocessor.py      # Text cleaning & normalization
│   │   │   │   ├── sentiment.py         # Lexicon-based sentiment analysis
│   │   │   │   └── keywords.py         # YAKE keyword extraction
│   │   │   │
│   │   │   ├── aggregator.py     # Hourly/daily aggregation
│   │   │   └── pipeline.py        # Main pipeline orchestrator
│   │   │
│   │   └── scheduler.py         # APScheduler background jobs
│   │
│   ├── tests/
│   │   ├── __init__.py
│   │   ├── test_fetchers.py
│   │   ├── test_sentiment.py
│   │   └── test_api.py
│   │
│   ├── .env.example
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   ├── App.css
│   │   │
│   │   ├── components/
│   │   │   ├── Header.jsx
│   │   │   ├── SummaryCards.jsx
│   │   │   ├── SentimentTrendChart.jsx
│   │   │   ├── SentimentBySourceChart.jsx
│   │   │   ├── VolumeChart.jsx
│   │   │   ├── KeywordList.jsx
│   │   │   ├── TrendingTopics.jsx
│   │   │   ├── MentionsTable.jsx
│   │   │   └── Pagination.jsx
│   │   │
│   │   ├── hooks/
│   │   │   ├── useDashboardData.js
│   │   │   └── useRefresh.js
│   │   │
│   │   ├── api/
│   │   │   └── index.js          # Axios instance & API calls
│   │   │
│   │   └── utils/
│   │       └── formatters.js     # Date, number formatters
│   │
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── docker-compose.yml
├── .env.example
├── README.md
└── CLAUDE.md                     # Project-specific instructions
```

---

## Implementation Phases

### Phase 1: Backend Foundation (Week 1)
- [ ] Setup FastAPI project structure
- [ ] Configure SQLite database with models
- [ ] Implement database migrations
- [ ] Create base fetcher class
- [ ] Implement RSS fetcher (Google News)
- [ ] Implement Reddit fetcher
- [ ] Test data fetching from all sources
- [ ] Write unit tests for fetchers

### Phase 2: Sentiment Analysis Engine (Week 2)
- [ ] Integrate Sastrawi for preprocessing
- [ ] Build Indonesian sentiment lexicon (~500+ words)
- [ ] Implement sentiment scoring algorithm
- [ ] Add negation & intensifier handling
- [ ] Implement YAKE keyword extraction
- [ ] Create aggregation pipeline
- [ ] Write unit tests for sentiment analysis

### Phase 3: YouTube Integration (Week 2-3)
- [ ] Setup Google Cloud Console project
- [ ] Enable YouTube Data API v3
- [ ] Implement YouTube video search fetcher
- [ ] Implement YouTube comment fetcher
- [ ] Handle pagination for large comment threads
- [ ] Implement quota tracking & optimization
- [ ] Write integration tests

### Phase 4: Twitter/X Integration (Week 3)
- [ ] Setup Twitter Developer account
- [ ] Create Project + App (Free tier)
- [ ] Implement Twitter Bearer token auth
- [ ] Implement tweet search fetcher
- [ ] Handle rate limiting
- [ ] Write integration tests

### Phase 5: API & Scheduler (Week 3-4)
- [ ] Implement all analytics endpoints
- [ ] Implement mentions endpoints with pagination
- [ ] Setup APScheduler
- [ ] Configure hourly fetch schedule
- [ ] Implement fetch status tracking
- [ ] Add error handling & retry logic

### Phase 6: Frontend Dashboard (Week 4-5)
- [ ] Setup Vite + React + Tailwind CSS
- [ ] Create dashboard layout
- [ ] Implement SummaryCards component
- [ ] Implement SentimentTrendChart (Recharts Line)
- [ ] Implement SentimentBySourceChart (Recharts Pie)
- [ ] Implement VolumeChart (Recharts Area)
- [ ] Implement KeywordList component
- [ ] Implement TrendingTopics component
- [ ] Implement MentionsTable with pagination
- [ ] Connect all components to API
- [ ] Add auto-refresh functionality

### Phase 7: Testing & Bug Fixes (Week 5-6)
- [ ] End-to-end testing
- [ ] UI/UX polish
- [ ] Performance optimization
- [ ] Error handling edge cases
- [ ] Mobile responsive testing

### Phase 8: Deployment (Week 6)
- [ ] Deploy backend (Railway/Render/VPS)
- [ ] Deploy frontend (Vercel/Netlify)
- [ ] Setup environment variables
- [ ] Configure CORS for production
- [ ] DNS & domain setup (optional)

---

## Setup Instructions

### Prerequisites
- Python 3.10+
- Node.js 18+
- npm or yarn
- Google Cloud account (for YouTube API)
- Twitter Developer account (for Twitter API)

### 1. Google Cloud Console - YouTube API Setup

1. Buka https://console.cloud.google.com
2. Buat project baru atau pilih existing project
3. Enable "YouTube Data API v3"
4. Go to "Credentials" → "Create Credentials" → "API Key"
5. Copy API key ke `.env`

### 2. Twitter Developer - API Setup

1. Buka https://developer.twitter.com
2. Apply for Developer Account (free)
3. Buat Project + App dengan type "Free"
4. Dapatkan credentials:
   - API Key
   - API Key Secret
   - Bearer Token (untuk recent search API)
5. Copy ke `.env`

### 3. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Setup environment
cp .env.example .env
# Edit .env dan isi semua credentials

# Run database migrations
python -m alembic upgrade head

# Run server
uvicorn app.main:app --reload --port 8000
```

### 4. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run dev server
npm run dev
```

### 5. Initial Data Fetch

```bash
# Fetch all sources
curl -X POST http://localhost:8000/api/fetch/manual

# Or specific source
curl -X POST http://localhost:8000/api/fetch/manual \
  -H "Content-Type: application/json" \
  -d '{"source": "youtube"}'
```

---

## Backend Dependencies (requirements.txt)

```
# Core
fastapi>=0.109.0
uvicorn[standard]>=0.27.0
python-dotenv>=1.0.0

# Database
sqlalchemy>=2.0.0
aiosqlite>=0.19.0
alembic>=1.13.0

# Scheduler
apscheduler>=3.10.0

# Text Processing
sastrawi>=1.0.0
yake>=0.4.0
beautifulsoup4>=4.12.0

# HTTP Clients
httpx>=0.26.0
feedparser>=6.0.0

# Utilities
python-dateutil>=2.8.0
pydantic>=2.0.0
pydantic-settings>=2.0.0

# Testing
pytest>=7.4.0
pytest-asyncio>=0.21.0
pytest-cov>=4.1.0
```

---

## Frontend Dependencies (package.json)

```json
{
  "name": "sentiment-dashboard-frontend",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "recharts": "^2.12.0",
    "@tanstack/react-query": "^5.60.0",
    "axios": "^1.7.0",
    "date-fns": "^4.0.0",
    "clsx": "^2.1.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.0",
    "vite": "^6.0.0",
    "tailwindcss": "^4.0.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0"
  }
}
```

---

## Indonesian Sentiment Lexicon (Extended)

### Positive Words

```python
POSITIVE_WORDS = {
    # Umum
    "baik": 1.0, "bagus": 1.0, "senang": 1.5, "gembira": 1.5,
    "bahagia": 1.5, "mantap": 1.5, "keren": 1.0, "suka": 1.0,
    "cinta": 2.0, "puas": 1.5, "terima kasih": 1.5, "membantu": 1.0,
    "enak": 1.0, "nyaman": 1.0, "indah": 1.0, "cantik": 1.0,

    # Pendidikan
    "belajar": 0.5, "mudah": 0.8, "fleksibel": 1.5, "praktis": 1.0,
    "efisien": 1.0, "berkualitas": 1.5, "professional": 1.5,
    "recommended": 2.0, "worth it": 1.5, "nilai": 0.5,

    # Biaya
    "murah": 1.5, "terjangkau": 1.5, "hemat": 1.0, "free": 1.0,

    # Fasilitas
    "lengkap": 1.0, "modern": 1.0, "cukup": 0.5,

    # Akademik
    "ilmu": 0.5, "pengetahuan": 0.5, "skill": 0.5, "IJAZAH": 0.5,
    "sarjana": 0.5, "kuliah": 0.3, "universitas": 0.3,
}

# Modifiers
INTENSIFIERS = {
    "sangat": 1.5, "sekali": 2.0, "banget": 1.8, "amat": 1.5,
    "terlalu": 1.3, "benar-benar": 1.5, "super": 2.0,
}
```

### Negative Words

```python
NEGATIVE_WORDS = {
    # Umum
    "buruk": -1.0, "jelek": -1.0, "sedih": -1.5, "marah": -1.5,
    "kecewa": -1.5, "benci": -2.0, "gagal": -1.5, "salah": -0.5,
    "rusak": -1.5, "problem": -1.0, "masalah": -1.0, "bug": -1.0,
    "lambat": -1.0, " Mahal": -1.5, "ribet": -1.5, "rumit": -1.0,
    "gampang": -0.5, "remeh": -0.5, "kasar": -1.0,

    # Pendidikan
    "susah": -1.0, "sulit": -1.0, "rumit": -1.0, "birokrasi": -1.5,
    "phising": -2.0, "scam": -2.0, "bodoh": -1.0,

    # Biaya
    "mahal": -1.5, "mahalnya": -1.5, "biaya": -0.3,

    # Proses
    "lamanya": -1.0, "lama": -0.8, "panjang": -0.5,
    "banyak": -0.3, "ribetnya": -1.5,

    # Kualitas
    "jelek": -1.0, "buruk": -1.0, "parah": -1.5,
}

NEGATIONS = {
    "tidak", "bukan", "jangan", "belum", "tak", "nggak", "gak",
    "nggak", "gak", "kagak", "no", "nope", "nada",
}
```

### UT-Specific Terms

```python
UT_SPECIFIC = {
    # Positif
    "terbuka": 0.8,  # Univ Terbuka = open university
    "jarak jauh": 1.0,
    "online": 0.5,
    "fleksibel": 1.5,
    "mandiri": 1.0,
    "belajar sendiri": 0.8,

    # Netral
    "ut": 0.0,  # acronym
    "universitas terbuka": 0.0,

    # Negatif (-context dependent)
    "tidak diakui": -1.5,
    "IJAZAH tidak": -1.5,
    "phising": -2.0,
    "modus": -2.0,
}
```

---

## Troubleshooting

### YouTube API Issues

**Error: "Daily Limit Exceeded"**
- Kurangi jumlah video per fetch
- Implement caching yang lebih agresif
- Cek https://console.cloud.google.com/apis/dashboard untuk quota usage

**Error: "Comments Disabled"**
- Skip video tersebut, tidak ada yang bisa dilakukan
- Log untuk tracking

**Error: "Video Not Found"**
- Video mungkin di-delete/private
- Skip dan continue

### Twitter API Issues

**Error: 401/403 Unauthorized**
- Pastikan Bearer Token sudah benar
- Cek apakah app sudah disetujui (Free tier mungkin limited)

**Error: 429 Too Many Requests**
- Implement exponential backoff
- Kurangi request frequency

### RSS Feed Issues

**Feed Kosong**
- Cek URL RSS sudah benar
- Beberapa feed memerlukan User-Agent header
- Cek apakah website mengubah format RSS

### Sentiment Analysis Issues

**Akurasi Rendah**
- Extend lexicon dengan kata-kata spesifik UT
- Tambahkan slang Indonesia yang sering dipakai
- Consider menggunakan IndoBERT jika budget memungkinkan

**False Positives**
- "Mahal" di lexicon -> negative
- Tapi dalam konteks "Tidak mahal" -> seharusnya positive
- Pastikan negation handling sudah work dengan baik

---

## Performance Considerations

### Database
- Buat indexes pada kolom yang sering di-query
- Gunakan `UNIQUE(source_id, external_id)` untuk prevent duplicates
- Implement pagination untuk mentions endpoint

### YouTube API Quota
- Cache video metadata untuk avoid duplicate fetches
- Batch comment fetches jika memungkinkan
- Monitor quota usage daily

### Background Jobs
- Fetch scheduler: setiap 1 jam
- Aggregate recalc: setiap 1 jam setelah fetch
- Jangan run fetch + aggregate sekaligus

---

## Success Metrics

### Technical Metrics
- API Response Time: < 200ms (p95)
- Data Freshness: < 2 hours
- Uptime: > 99%
- Error Rate: < 1%

### Business Metrics
- Total mentions tracked: > 10,000 (first month)
- Sentiment accuracy: > 70% (vs manual validation)
- Dashboard visitors: TBD

---

## Future Enhancements

1. **Sentiment Prediction**: Gunakan ML untuk predict trend sentimen
2. **Alert System**: Notifikasi jika ada spike sentimen negatif
3. **Comparative Analysis**: Bandingkan dengan universitas lain
4. **Source Expansion**: TikTok, Instagram ( jika API tersedia)
5. **Export Feature**: Export data ke CSV/Excel
6. **Multi-language**: Support bahasa Inggris untuk international mentions
7. **Real-time Updates**: WebSocket untuk live data

---

## License

MIT - Free for commercial use

## Version

1.0.0 - Initial Plan (2026-03-22)
