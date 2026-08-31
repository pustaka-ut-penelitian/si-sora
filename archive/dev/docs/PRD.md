# Product Requirements Document (PRD)

## Metadata

| Field | Value |
|-------|-------|
| **Document Title** | Sentimen Analisis Dashboard - Universitas Terbuka |
| **Project Name** | Sentimen UT Dashboard |
| **Version** | v1.0 |
| **Date Created** | 2026-03-22 |
| **Last Updated** | 2026-03-22 |
| **Author** | Claude |
| **Status** | `Draft` |
| **Document Owner** | TBD |
| **Stakeholders** | Universitas Terbuka, Research Team |

---

## 1. Executive Summary

### 1.1 Project Overview

Aplikasi web single-page untuk melakukan sentiment analysis terhadap Universitas Terbuka menggunakan data dari social media dan portal berita. Sistem akan melakukan fetch data secara otomatis dari YouTube, Google News RSS, Reddit, dan Twitter/X, kemudian menganalisis sentimen menggunakan lexicon-based Indonesian NLP dan menampilkan hasilnya dalam dashboard real-time.

### 1.2 Problem Statement

Universitas Terbuka perlu memahami persepsi masyarakat terhadap institusi mereka di media sosial dan portal berita. Saat ini tidak ada sistem terstruktur untuk memantau dan menganalisis sentimen publik secara otomatis. Proses manual untuk melacak ribuan mention di berbagai platform tidak efisien dan tidak scalable.

### 1.3 Success Metrics

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Total mentions tracked | > 10,000 (first month) | Database counter |
| Sentiment accuracy | > 70% vs manual validation | Spot-check validation |
| Data freshness | < 2 hours | Timestamp comparison |
| API response time | < 200ms (p95) | APM/logger |
| Uptime | > 99% | Monitoring |
| Error rate | < 1% | Error tracking |

---

## 2. Goals & Objectives

### 2.1 Business Goals

- Mengetahui persepsi masyarakat terhadap Universitas Terbuka secara menyeluruh
- Mengidentifikasi kekuatan dan kelemahan UT di mata publik
- Mendeteksi isu atau topik yang sedang hangat dibicarakan terkait UT

### 2.2 Product Goals

- Dashboard real-time untuk visualisasi data sentimen
- Historical tracking untuk melihat perubahan sentimen dari waktu ke waktu
- Trend analysis untuk mengidentifikasi pola sentimen

### 2.3 User Goals

- Melihat overview sentimen secara cepat dalam satu halaman
- Filter data berdasarkan sumber, sentimen, dan waktu
- Melihat mention individual beserta detail sentimennya

---

## 3. Requirements Specification

### 3.1 Must Have (P0 - Critical)

| ID | Requirement | Acceptance Criteria | Priority |
|----|-------------|---------------------|----------|
| REQ-001 | Data fetching dari YouTube | Sistem dapat mengambil video dan komentar berdasarkan keyword "Universitas Terbuka" dan query terkait | P0 |
| REQ-002 | Data fetching dari Google News RSS | Sistem dapat mengambil berita dari Google News RSS dengan query "Universitas Terbuka" | P0 |
| REQ-003 | Data fetching dari Reddit | Sistem dapat mengambil post dan comment dari subreddit indonesia, kuliah, beasiswa | P0 |
| REQ-004 | Data fetching dari Twitter/X API | Sistem dapat mengambil tweets berdasarkan keyword "Universitas Terbuka" lang:id | P0 |
| REQ-005 | Sentiment analysis Indonesian | Sistem dapat mengklasifikasikan text ke positif, negatif, netral dengan akurasi > 65% | P0 |
| REQ-006 | Keyword extraction | Sistem dapat mengekstrak top keywords dari setiap mention | P0 |
| REQ-007 | Dashboard visualization | Dashboard single-page menampilkan summary cards, trend chart, pie chart, volume chart | P0 |
| REQ-008 | Recent mentions table | Tabel dengan pagination untuk melihat mention individual | P0 |
| REQ-009 | Auto-refresh data | Sistem fetch data secara terjadwal setiap 1 jam | P0 |
| REQ-010 | SQLite database storage | Data disimpan di SQLite dengan schema yang sudah defined | P0 |

### 3.2 Should Have (P1 - Important)

| ID | Requirement | Acceptance Criteria | Priority |
|----|-------------|---------------------|----------|
| REQ-101 | Sentiment trend chart 7 hari | Line chart menampilkan trend sentimen per hari | P1 |
| REQ-102 | Sentiment by source breakdown | Pie/donut chart menampilkan breakdown sentimen per sumber | P1 |
| REQ-103 | Volume over time chart | Area chart menampilkan volume mention per hari | P1 |
| REQ-104 | Top keywords list | List 10 keywords teratas dengan sentiment indicator | P1 |
| REQ-105 | Trending topics | List topic yang sedang naik/turun | P1 |
| REQ-106 | Filter mentions by source | Dropdown filter untuk memilih sumber data | P1 |
| REQ-107 | Filter mentions by sentiment | Dropdown filter untuk memilih sentimen | P1 |
| REQ-108 | Manual fetch trigger | Button untuk trigger fetch manual per source | P1 |
| REQ-109 | Sentiment comparison vs previous period | Percentage change indicator | P1 |
| REQ-110 | Hourly and daily aggregation | Pre-computed aggregates untuk dashboard performance | P1 |

### 3.3 Could Have (P2 - Nice to Have)

| ID | Requirement | Acceptance Criteria | Priority |
|----|-------------|---------------------|----------|
| REQ-201 | Alert system | Notifikasi jika ada lonjakan sentimen negatif signifikan | P2 |
| REQ-202 | Comparative analysis | Bandingkan dengan universitas lain | P2 |
| REQ-203 | Export feature | Export data ke CSV/Excel | P2 |
| REQ-204 | Real-time updates | WebSocket untuk live data | P2 |
| REQ-205 | Multi-language support | Support bahasa Inggris | P2 |

### 3.4 Out of Scope

- Authentication/Authorization system
- Multi-user support
- Web scraping langsung (resiko blocked)
- Instagram Graph API integration (butuh business account + app review)
- TikTok API integration (tidak ada public API untuk data harvesting)
- IndoBERT/ML-based sentiment analysis (GPU cost)

---

## 4. User Stories

### 4.1 Primary User Stories

| ID | As A... | I Want To... | So That... | Acceptance Criteria |
|----|---------|--------------|------------|---------------------|
| US-001 | Viewer | Melihat overall sentiment UT saat ini | Saya dapat memahami apakah persepsi umum terhadap UT positif atau negatif | Dashboard menampilkan sentiment breakdown (positive/neutral/negative) dengan percentage |
| US-002 | Viewer | Melihat trend sentimen 7 hari terakhir | Saya dapat melihat apakah sentimen UT membaik atau memburuk | Line chart menampilkan data 7 hari dengan 3 garis (positive/neutral/negative) |
| US-003 | Viewer | Melihat dari mana saja data berasal | Saya dapat memahami distribusi sumber data | Pie/donut chart menampilkan breakdown per sumber (YouTube, Twitter, Reddit, News) |
| US-004 | Viewer | Melihat recent mentions | Saya dapat membaca langsung apa yang orang katakan | Tabel dengan pagination menampilkan content, author, sentiment, timestamp |
| US-005 | Viewer | Filter mentions berdasarkan sumber | Saya dapat melihat hanya mention dari sumber tertentu | Dropdown filter source, table terfilter sesuai selection |
| US-006 | Viewer | Filter mentions berdasarkan sentimen | Saya dapat melihat hanya mention dengan sentimen tertentu | Dropdown filter sentiment, table terfilter sesuai selection |
| US-007 | Viewer | Search mentions | Saya dapat mencari mention dengan keyword tertentu | Search box, table menampilkan hasil pencarian |
| US-008 | Viewer | Melihat top keywords | Saya dapat mengetahui topik apa yang paling dibicarakan | Keyword list dengan count dan sentiment indicator |
| US-009 | Viewer | Melihat trending topics | Saya dapat mengetahui topik yang sedang naik/turun | Trending list dengan change percentage dan direction indicator |
| US-010 | Admin | Trigger manual fetch | Saya dapat memaksa sistem untuk fetch data sekarang | Button trigger fetch, progress indicator, completion notification |

### 4.2 Secondary User Stories

| ID | As A... | I Want To... | So That... | Acceptance Criteria |
|----|---------|--------------|------------|---------------------|
| US-101 | Viewer | Melihat sentiment change vs yesterday | Saya dapat mengetahui apakah sentimen membaik atau memburuk | Card menampilkan percentage change dengan arrow indicator |
| US-102 | Viewer | Auto-refresh dashboard | Saya selalu melihat data terbaru tanpa refresh manual | Dashboard refresh otomatis setiap 5 menit |
| US-103 | Admin | Monitor fetch status | Saya dapat mengetahui apakah fetch berjalan успешно | Status endpoint menampilkan progress dan error info |

---

## 5. Technical Specification

### 5.1 Technical Constraints

| Constraint | Description |
|------------|-------------|
| **Budget** | $0 third-party cost |
| **Technology** | Python FastAPI (Backend), React 19 (Frontend) |
| **Database** | SQLite |
| **Auth** | No authentication required |
| **Deployment** | Single-page, can run locally |
| **Timeline** | 6 weeks (as per plan phases) |
| **Scalability** | Single-user, low traffic |

### 5.2 Dependencies

| Dependency | Owner | Status | Notes |
|------------|-------|--------|-------|
| YouTube Data API v3 | Google | Available | Free tier: 10,000 units/day |
| Twitter/X API v2 | X Corp | Available | Free tier: 500K tweets/month |
| Reddit API | Reddit | Available | 60 requests/min |
| Google News RSS | Google | Available | No auth required |
| Sastrawi | Open-source | Available | Indonesian NLP library |
| YAKE | Open-source | Available | Keyword extraction |
| Google Cloud Console | Google | Required | For YouTube API key |
| Twitter Developer Account | X Corp | Required | For Twitter Bearer token |

### 5.3 Assumptions

- Target users adalah research team atau admin UT yang perlu memantau brand perception
- Data yang diambil adalah public data yang tidak melanggar terms of service
- Sentiment analysis menggunakan lexicon-based cukup akurat untuk use case ini
- Fetch schedule 1x per jam sudah memadai untuk keeping data fresh

### 5.4 Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| YouTube API quota exceeded | High | Medium | Implement aggressive caching, reduce fetch frequency |
| Twitter API rate limit | High | Medium | Implement exponential backoff, queue requests |
| RSS feed format changed | Medium | Low | Error logging, manual verification |
| Sentiment accuracy low | Medium | Low | Extend lexicon, add Indonesian slang |
| SQLite corruption | High | Low | Regular backups, WAL mode |
| API keys compromised | High | Low | Use environment variables, rotate keys |

---

## 6. API Requirements

### 6.1 New APIs

#### 6.1.1 Health Check
| Field | Details |
|-------|---------|
| **Endpoint** | `/api/health` |
| **Method** | GET |
| **Description** | Health check endpoint |
| **Auth Required** | No |

**Response Schema:**
```json
{
  "status": "ok",
  "version": "1.0.0",
  "timestamp": "2026-03-22T10:30:00Z"
}
```

#### 6.1.2 Analytics Summary
| Field | Details |
|-------|---------|
| **Endpoint** | `/api/analytics/summary` |
| **Method** | GET |
| **Description** | Get overall sentiment summary |
| **Auth Required** | No |

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| days | int | 7 | Range hari (max 90) |

**Response Schema:**
```json
{
  "total_mentions": 15420,
  "total_mentions_change": 12.5,
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
  "trend": "improving",
  "top_keywords": [
    { "keyword": "pembelajaran", "count": 120, "sentiment": "positive" }
  ]
}
```

#### 6.1.3 Analytics Trends
| Field | Details |
|-------|---------|
| **Endpoint** | `/api/analytics/trends` |
| **Method** | GET |
| **Description** | Get sentiment trends over time |
| **Auth Required** | No |

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| days | int | 30 | Range hari |

**Response Schema:**
```json
{
  "data": [
    { "date": "2026-03-01", "positive": 45, "neutral": 30, "negative": 25 }
  ],
  "period": "daily"
}
```

#### 6.1.4 Analytics Keywords
| Field | Details |
|-------|---------|
| **Endpoint** | `/api/analytics/keywords` |
| **Method** | GET |
| **Description** | Get top keywords |
| **Auth Required** | No |

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| limit | int | 20 | Max keywords |
| days | int | 7 | Range hari |

#### 6.1.5 Analytics Volume
| Field | Details |
|-------|---------|
| **Endpoint** | `/api/analytics/volume` |
| **Method** | GET |
| **Description** | Get mention volume over time |
| **Auth Required** | No |

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| days | int | 30 | Range hari |

#### 6.1.6 Analytics By Source
| Field | Details |
|-------|---------|
| **Endpoint** | `/api/analytics/by-source` |
| **Method** | GET |
| **Description** | Get sentiment breakdown by source |
| **Auth Required** | No |

#### 6.1.7 Analytics Trending
| Field | Details |
|-------|---------|
| **Endpoint** | `/api/analytics/trending` |
| **Method** | GET |
| **Description** | Get trending topics |
| **Auth Required** | No |

#### 6.1.8 Mentions Recent
| Field | Details |
|-------|---------|
| **Endpoint** | `/api/mentions/recent` |
| **Method** | GET |
| **Description** | Get recent mentions with pagination |
| **Auth Required** | No |

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | int | 1 | Page number |
| limit | int | 20 | Items per page |
| source | string | null | Filter by source |
| sentiment | string | null | Filter by sentiment |

**Response Schema:**
```json
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
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 15420,
    "total_pages": 771
  }
}
```

#### 6.1.9 Mention Detail
| Field | Details |
|-------|---------|
| **Endpoint** | `/api/mentions/{id}` |
| **Method** | GET |
| **Description** | Get single mention detail |
| **Auth Required** | No |

#### 6.1.10 Fetch Manual
| Field | Details |
|-------|---------|
| **Endpoint** | `/api/fetch/manual` |
| **Method** | POST |
| **Description** | Trigger manual fetch |
| **Auth Required** | No |

**Request Schema:**
```json
{
  "source": "youtube"
}
```

**Response Schema:**
```json
{
  "status": "started",
  "job_id": "abc123",
  "sources_triggered": ["youtube", "reddit"]
}
```

#### 6.1.11 Fetch Status
| Field | Details |
|-------|---------|
| **Endpoint** | `/api/fetch/status/{job_id}` |
| **Method** | GET |
| **Description** | Get fetch job status |
| **Auth Required** | No |

### 6.2 Modified APIs

| API | Current Behavior | New Behavior | Changes |
|-----|-----------------|---------------|---------|
| N/A | New project | N/A | All APIs are new |

### 6.3 API Endpoints Summary

| ID | Endpoint | Method | Description | New/Modified | Priority |
|----|----------|--------|-------------|--------------|----------|
| API-001 | /api/health | GET | Health check | New | P0 |
| API-002 | /api/sources | GET | List sources | New | P0 |
| API-003 | /api/sources | POST | Create source | New | P0 |
| API-004 | /api/analytics/summary | GET | Analytics summary | New | P0 |
| API-005 | /api/analytics/trends | GET | Sentiment trends | New | P1 |
| API-006 | /api/analytics/keywords | GET | Top keywords | New | P1 |
| API-007 | /api/analytics/volume | GET | Volume over time | New | P1 |
| API-008 | /api/analytics/by-source | GET | By source | New | P1 |
| API-009 | /api/analytics/trending | GET | Trending topics | New | P1 |
| API-010 | /api/mentions/recent | GET | Recent mentions | New | P0 |
| API-011 | /api/mentions/{id} | GET | Mention detail | New | P0 |
| API-012 | /api/fetch/manual | POST | Manual fetch | New | P1 |
| API-013 | /api/fetch/status/{job_id} | GET | Fetch status | New | P1 |

---

## 7. Data Models

### 7.1 New Entities

| Entity: sources | | |
|----------------|-|-|
| Field | Type | Description |
| id | INTEGER PRIMARY KEY | Auto increment |
| name | VARCHAR(100) | Source name |
| type | VARCHAR(50) | 'rss', 'reddit', 'twitter', 'youtube' |
| url | TEXT | Source URL |
| is_active | BOOLEAN | Active status |
| created_at | TIMESTAMP | Creation time |

| Entity: raw_mentions | | |
|----------------|-|-|
| Field | Type | Description |
| id | INTEGER PRIMARY KEY | Auto increment |
| source_id | INTEGER FK | Reference to sources |
| external_id | VARCHAR(255) | External platform ID |
| content | TEXT | Raw text content |
| author | VARCHAR(100) | Author name |
| posted_at | TIMESTAMP | When posted |
| fetched_at | TIMESTAMP | When fetched |
| url | TEXT | Link to original |
| metadata | TEXT | JSON for platform-specific data |

| Entity: processed_mentions | | |
|----------------|-|-|
| Field | Type | Description |
| id | INTEGER PRIMARY KEY | Auto increment |
| mention_id | INTEGER FK | Reference to raw_mentions |
| clean_text | TEXT | Cleaned text |
| sentiment_score | FLOAT | -1 to 1 |
| sentiment_label | VARCHAR(20) | positive/neutral/negative |
| sentiment_confidence | FLOAT | 0 to 1 |
| keywords | TEXT | JSON array of keywords |
| processed_at | TIMESTAMP | Processing time |

| Entity: hourly_aggregates | | |
|----------------|-|-|
| Field | Type | Description |
| id | INTEGER PRIMARY KEY | Auto increment |
| source_id | INTEGER FK | Reference to sources |
| hour_bucket | TIMESTAMP | Hour timestamp |
| positive_count | INTEGER | Positive mentions count |
| neutral_count | INTEGER | Neutral mentions count |
| negative_count | INTEGER | Negative mentions count |
| total_count | INTEGER | Total mentions count |

| Entity: daily_aggregates | | |
|----------------|-|-|
| Field | Type | Description |
| id | INTEGER PRIMARY KEY | Auto increment |
| source_id | INTEGER FK | Reference to sources |
| date_bucket | DATE | Date |
| positive_count | INTEGER | Positive mentions count |
| neutral_count | INTEGER | Neutral mentions count |
| negative_count | INTEGER | Negative mentions count |
| total_count | INTEGER | Total mentions count |

| Entity: fetch_logs | | |
|----------------|-|-|
| Field | Type | Description |
| id | INTEGER PRIMARY KEY | Auto increment |
| source_id | INTEGER FK | Reference to sources |
| fetched_at | TIMESTAMP | Fetch time |
| items_fetched | INTEGER | Total fetched |
| items_new | INTEGER | New items |
| items_updated | INTEGER | Updated items |
| status | VARCHAR(20) | success/partial/failed |
| error_message | TEXT | Error details |

| Entity: youtube_videos | | |
|----------------|-|-|
| Field | Type | Description |
| id | INTEGER PRIMARY KEY | Auto increment |
| video_id | VARCHAR(50) UNIQUE | YouTube video ID |
| title | VARCHAR(500) | Video title |
| channel_title | VARCHAR(200) | Channel name |
| published_at | TIMESTAMP | Publish time |
| fetched_at | TIMESTAMP | Fetch time |

---

## 8. UI/UX Requirements

### 8.1 Key Screens/Pages

| Screen ID | Screen Name | Description | Priority |
|-----------|-------------|-------------|----------|
| UI-001 | Dashboard | Single-page dashboard dengan semua visualizations | P0 |
| UI-002 | Header | Logo, title, refresh button, last updated time | P0 |
| UI-003 | Summary Cards | Total mentions, sentiment overall, trend indicator | P0 |
| UI-004 | Sentiment Trend Chart | Line chart 7 hari | P1 |
| UI-005 | Sentiment by Source | Pie/donut chart | P1 |
| UI-006 | Volume Chart | Area chart | P1 |
| UI-007 | Keywords Panel | Top 10 keywords dengan sentiment | P1 |
| UI-008 | Trending Topics | Rising/falling topics | P1 |
| UI-009 | Mentions Table | Paginated table dengan filter | P0 |

### 8.2 User Flows

```
User Opens Dashboard
     ↓
Dashboard Loads → API: /api/analytics/summary
     ↓
Summary Cards Display ← API: /api/analytics/trends
     ↓                    ← API: /api/analytics/by-source
Charts Render ← API: /api/analytics/volume
     ↓                  ← API: /api/analytics/keywords
                    ← API: /api/analytics/trending
     ↓
Mentions Table ← API: /api/mentions/recent
     ↓
User Filters → API: /api/mentions/recent?source=youtube
     ↓
Table Updates with filtered data
```

### 8.3 Wireframes/Links

*[Reference to DESIGN.md - Stage 2B]*

Design context akan di-generate terpisah menggunakan Stitch setelah PRD approved.

---

## 9. Non-Functional Requirements

| Requirement Type | Specification |
|------------------|---------------|
| **Performance** | API response time < 200ms (p95) |
| **Performance** | Dashboard initial load < 3 seconds |
| **Scalability** | Support 1-10 concurrent users |
| **Availability** | 99% uptime (single server) |
| **Security** | No auth, but API keys stored in environment variables |
| **Security** | CORS configured for frontend domain |
| **Data Safety** | SQLite WAL mode enabled |
| **Backup** | Daily backup of SQLite file |

---

## 10. Testing Requirements

### 10.1 Test Scenarios

| ID | Scenario | Expected Result | Priority |
|----|----------|-----------------|----------|
| TEST-001 | Fetch YouTube with valid API key | Returns videos and comments | P0 |
| TEST-002 | Fetch YouTube with invalid/quota exceeded | Returns error, graceful degradation | P0 |
| TEST-003 | Fetch Reddit without rate limit | Returns posts and comments | P0 |
| TEST-004 | Fetch Twitter with valid bearer token | Returns tweets | P0 |
| TEST-005 | Sentiment analysis - positive text | Returns "positive" label | P0 |
| TEST-006 | Sentiment analysis - negative text | Returns "negative" label | P0 |
| TEST-007 | Sentiment analysis - neutral text | Returns "neutral" label | P0 |
| TEST-008 | Sentiment analysis - negation | "tidak mahal" classified correctly | P0 |
| TEST-009 | Dashboard loads with no data | Shows empty state | P0 |
| TEST-010 | Dashboard loads with data | Shows charts and table | P0 |
| TEST-011 | Filter mentions by source | Table filters correctly | P1 |
| TEST-012 | Filter mentions by sentiment | Table filters correctly | P1 |
| TEST-013 | Pagination works | Navigate pages correctly | P0 |
| TEST-014 | Manual fetch trigger | Fetch starts and completes | P1 |
| TEST-015 | Scheduled fetch runs | Data updates automatically | P0 |

### 10.2 UAT (User Acceptance Testing)

- **Who**: Research team Universitas Terbuka
- **Criteria**:
  1. Dashboard loads within 3 seconds
  2. All charts display correct data
  3. Filters work correctly
  4. Pagination works correctly
  5. Manual fetch trigger works
  6. Sentiment accuracy validated via spot-check

---

## 11. Documentation Requirements

| Document | Owner | Status | Notes |
|----------|-------|--------|-------|
| API Documentation | TBD | Pending | Auto-generated via FastAPI Swagger UI |
| User Guide | TBD | Pending | Dashboard usage guide |
| Deployment Guide | TBD | Pending | Setup instructions |
| Runbook | TBD | Pending | Common issues and solutions |

---

## 12. Approval

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Product Owner | | | |
| Tech Lead | | | |
| QA Lead | | | |
| Business Stakeholder | | | |

---

## Appendix

### A. Glossary

| Term | Definition |
|------|------------|
| Sentiment Analysis | Proses menentukan apakah text bersifat positif, negatif, atau netral |
| Lexicon-based | Metode sentiment analysis berdasarkan dictionary kata dan skor |
| Sastrawi | Indonesian stemmer library untuk preprocessing text |
| YAKE | Yet Another Keyword Extractor - unsupervised keyword extraction |
| Mention | Single piece of content dari social media atau news |
| Sentiment Score | Numeric score dari -1 (negative) sampai +1 (positive) |
| Aggregates | Pre-computed summary data untuk performance |

### B. References

| Reference | Link |
|-----------|------|
| FastAPI Documentation | https://fastapi.tiangolo.com/ |
| React Documentation | https://react.dev/ |
| YouTube Data API v3 | https://developers.google.com/youtube/v3 |
| Twitter API v2 | https://developer.twitter.com/en/docs/twitter-api |
| Reddit API | https://www.reddit.com/dev/api/ |
| Sastrawi | https://github.com/har07/pysastrawi |
| YAKE | https://github.com/LIAAD/yake |
| Recharts | https://recharts.org/ |

### C. Change Log

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| v1.0 | 2026-03-22 | Claude | Initial version from PLAN-SENTIMEN-ANALISIS.md |

---

## Source Attribution

| Requirement ID | Source Type | Source | Location/Notes |
|----------------|-------------|--------|----------------|
| REQ-001 to REQ-004 | Document | PLAN-SENTIMEN-ANALISIS.md | Section: Sumber Data |
| REQ-005 to REQ-006 | Document | PLAN-SENTIMEN-ANALISIS.md | Section: Sentiment Analysis |
| REQ-007 to REQ-110 | Document | PLAN-SENTIMEN-ANALISIS.md | Section: Dashboard UI Design |
| REQ-201 to REQ-205 | Document | PLAN-SENTIMEN-ANALISIS.md | Section: Future Enhancements |
| All REQ | Chat | Conversation | Tech stack discussion, React 19, SQLite |
| API-001 to API-013 | Document | PLAN-SENTIMEN-ANALISIS.md | Section: API Endpoints |
| Data Models | Document | PLAN-SENTIMEN-ANALISIS.md | Section: Database Schema |
| YouTube API Limits | Document | API-Fetching-Data-Sosmed.md | Section: Detail Per Platform |
| Twitter API Limits | Document | API-Fetching-Data-Sosmed.md | Section: Detail Per Platform |

---

## Design Notes

**Design Context berada di DESIGN.md (Stage 2B), bukan di PRD ini.**

Alur design:
1. `design_references/` → Stitch (Stage 2A) → `designs/` folder
2. `/generate-design-doc` → DESIGN.md dengan Design Context
3. `/implement` menggunakan DESIGN.md untuk visual reference
