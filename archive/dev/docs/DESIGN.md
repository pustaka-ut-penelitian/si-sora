# Design Document (DESIGN.md)

## Sentimen UT Dashboard - Design Specification

---

## 1. Metadata

| Field              | Value                                         |
| ------------------ | --------------------------------------------- |
| **Project Name**   | Sentimen UT Dashboard                         |
| **Document Title** | Design Document - Sentimen Analisis Dashboard |
| **Version**        | v1.0                                          |
| **Date Created**   | 2026-03-22                                    |
| **Last Updated**   | 2026-03-22                                    |
| **PRD Reference**  | PRD.md (v1.0, 2026-03-22)                     |
| **Status**         | Draft                                         |

---

## 2. Design Tokens

### 2.1 Colors (Light Mode)

#### Primary Palette

| Token           | Hex Code  | Usage                                |
| --------------- | --------- | ------------------------------------ |
| Primary         | `#003f7a` | Header, buttons, primary text        |
| Secondary       | `#fecb00` | Accent highlights, FAB               |
| Accent Blue     | `#2d68ff` | Interactive elements, links          |
| Background      | `#f9f9fa` | Page background                      |
| On Background   | `#1a1c1d` | Primary text color                   |
| Surface         | `#ffffff` | Cards, elevated surfaces             |
| Surface Variant | `#f3f3f4` | Secondary backgrounds, table headers |
| Outline Variant | `#c2c6d3` | Borders, dividers                    |
| Error           | `#ba1a1a` | Error states                         |
| On Primary      | `#ffffff` | Text on primary color                |

#### Sentiment Colors

| Token                    | Hex Code  | Usage                                                 |
| ------------------------ | --------- | ----------------------------------------------------- |
| Sentiment Positive       | `#52b788` | Positive sentiment indicator, positive keyword badges |
| Sentiment Positive Light | `#74c69d` | Gradient end for positive                             |
| Sentiment Neutral        | `#94a3b8` | Neutral sentiment indicator                           |
| Sentiment Neutral Light  | `#cbd5e1` | Gradient end for neutral                              |
| Sentiment Negative       | `#f87171` | Negative sentiment indicator                          |
| Sentiment Negative Light | `#fb923c` | Gradient end for negative                             |

#### Source Colors

| Source            | Color    | Hex Code                |
| ----------------- | -------- | ----------------------- |
| YouTube           | Blue     | `#2d68ff` (100%)        |
| Twitter (X)       | Blue 70% | `#2d68ff` (70% opacity) |
| Reddit            | Blue 40% | `#2d68ff` (40% opacity) |
| Academic Journals | Blue 20% | `#2d68ff` (20% opacity) |

#### Gradient Definitions

```css
.ut-gradient {
  background: linear-gradient(135deg, #003f7a 0%, #2d68ff 100%);
}

.pos-gradient {
  background: linear-gradient(90deg, #52b788 0%, #74c69d 100%);
}

.neu-gradient {
  background: linear-gradient(90deg, #94a3b8 0%, #cbd5e1 100%);
}

.neg-gradient {
  background: linear-gradient(90deg, #f87171 0%, #fb923c 100%);
}
```

### 2.2 Typography

#### Font Families

| Role     | Font Family       | Weights                 |
| -------- | ----------------- | ----------------------- |
| Headline | Plus Jakarta Sans | 400, 500, 600, 700, 800 |
| Body     | Inter             | 400, 500, 600           |
| Label    | Inter             | 400, 500, 600           |

#### Font Sizes

| Element              | Size             | Weight          | Line Height | Letter Spacing    |
| -------------------- | ---------------- | --------------- | ----------- | ----------------- |
| H1 (Dashboard Title) | 2.25rem (36px)   | 800 (Extrabold) | Tight (1.2) | Tighter (-0.02em) |
| H2 (Section Title)   | 2.25rem (36px)   | 700 (Bold)      | Tight       | Tighter           |
| H3 (Card Title)      | 1.25rem (20px)   | 700 (Bold)      | Tight       | Tight             |
| H4 (Subsection)      | 1.125rem (18px)  | 700 (Bold)      | Tight       | Tight             |
| Body Large           | 1.125rem (18px)  | 500 (Medium)    | Normal      | Normal            |
| Body                 | 0.875rem (14px)  | 500 (Medium)    | Normal      | Normal            |
| Body Small           | 0.875rem (14px)  | 600 (Semibold)  | Normal      | Normal            |
| Label                | 0.75rem (12px)   | 600 (Semibold)  | Normal      | Wide (0.05em)     |
| Caption              | 0.6875rem (11px) | 700 (Bold)      | Normal      | Wider (0.06em)    |
| Tiny                 | 0.625rem (10px)  | 700 (Bold)      | Normal      | Widest (0.1em)    |

#### Text Hierarchy

```
UT Intelligence Logo:    1.25rem / 800 / #003f7a
Academic Sentiment AI:   0.625rem / 700 / (text-on-surface-variant)
Academic Pulse Title:   2.25rem / 700 / #003f7a
Section Headers:        1.25rem / 700 / #003f7a
Card Labels:           0.75rem / 600 / uppercase / tracking-widest
Data Values:           2.25rem / 700 / #003f7a
Table Headers:         0.625rem / 700 / uppercase / tracking-widest
Table Body:            0.875rem / 500 / #1a1c1d
Badge Text:            0.6875rem / 700 / sentiment color
```

### 2.3 Spacing Scale

| Token       | Value (px) | Usage                             |
| ----------- | ---------- | --------------------------------- |
| `space-0.5` | 2px        | Icon internal spacing             |
| `space-1`   | 4px        | Tight element grouping            |
| `space-1.5` | 6px        | Icon-to-text gap                  |
| `space-2`   | 8px        | Small gaps, badge padding         |
| `space-2.5` | 10px       | Button internal padding           |
| `space-3`   | 12px       | Card padding (small)              |
| `space-4`   | 16px       | Standard gaps, table cell padding |
| `space-5`   | 20px       | Medium spacing                    |
| `space-6`   | 24px       | Page margins, card padding        |
| `space-8`   | 32px       | Section gaps                      |
| `space-10`  | 40px       | Page vertical padding             |
| `space-12`  | 48px       | Large section gaps                |
| `space-20`  | 80px       | Footer padding                    |

#### Layout Spacing

| Element        | Padding/Margin         | Value                             |
| -------------- | ---------------------- | --------------------------------- |
| Page Container | max-w-7xl mx-auto px-6 | max-width 1280px, 24px horizontal |
| Header Height  | h-20                   | 80px                              |
| Card Padding   | p-8                    | 32px                              |
| Section Gap    | space-y-12             | 48px between sections             |
| Grid Gap       | gap-6                  | 24px between grid items           |
| Button Padding | px-6 py-2.5            | 24px horizontal, 10px vertical    |

### 2.4 Border Radius

| Token            | Value          | Usage                             |
| ---------------- | -------------- | --------------------------------- |
| `radius DEFAULT` | 4px (0.25rem)  | Small elements, inputs            |
| `radius lg`      | 8px (0.5rem)   | Buttons, badges                   |
| `radius xl`      | 12px (0.75rem) | Cards, panels                     |
| `radius 2xl`     | 16px (1rem)    | Large cards                       |
| `radius full`    | 9999px         | Pills, avatars, status indicators |

#### Component-Specific Radius

| Component     | Radius         | Value  |
| ------------- | -------------- | ------ |
| Cards         | `rounded-xl`   | 12px   |
| Summary Cards | `rounded-xl`   | 12px   |
| Buttons       | `rounded-lg`   | 8px    |
| Badges/Pills  | `rounded-full` | 9999px |
| Input Fields  | `rounded-lg`   | 8px    |
| Progress Bars | `rounded-full` | 9999px |
| FAB           | `rounded-full` | 9999px |
| System Status | `rounded-full` | 9999px |
| Table Header  | `rounded-none` | 0px    |

### 2.5 Shadows

| Token      | Value                              | Usage                  |
| ---------- | ---------------------------------- | ---------------------- |
| Shadow SM  | `0 1px 2px 0 rgba(0,0,0,0.05)`     | Default card state     |
| Shadow MD  | (hover: shadow-lg)                 | Hover card state       |
| Shadow LG  | `0 10px 15px -3px rgba(0,0,0,0.1)` | Elevated elements, FAB |
| Shadow XL  | `0 20px 25px -5px rgba(0,0,0,0.1)` | Modals (if needed)     |
| Shadow 2XL | `shadow-2xl`                       | FAB default            |

#### Shadow Usage by Component

| Component            | State   | Shadow               |
| -------------------- | ------- | -------------------- |
| Summary Cards        | Default | `shadow-sm`          |
| Summary Cards        | Hover   | `hover:shadow-md`    |
| Trend Indicator Card | Default | `shadow-lg`          |
| Trend Indicator Card | Hover   | `hover:shadow-xl`    |
| FAB                  | Default | `shadow-2xl`         |
| Header               | Sticky  | Subtle border-b only |

### 2.6 Z-Index Scale

| Layer          | Value | Usage                           |
| -------------- | ----- | ------------------------------- |
| Base           | 0     | Default content                 |
| Dropdown       | 40    | Dropdown menus                  |
| Sticky         | 45    | Sticky elements                 |
| Header         | 50    | Fixed header                    |
| Modal Backdrop | 60    | Modal overlay (if needed)       |
| FAB            | 50    | Floating Action Button          |
| Toast          | 70    | Toast notifications (if needed) |
| Tooltip        | 80    | Tooltips (if needed)            |
| Max            | 9999  | Maximum stacking                |

### 2.7 Animation

#### Duration Tokens

| Token            | Value | Usage                                |
| ---------------- | ----- | ------------------------------------ |
| Duration Fast    | 150ms | Micro-interactions, button press     |
| Duration Default | 200ms | Standard transitions                 |
| Duration Slow    | 300ms | Page transitions, expanding elements |
| Duration Slower  | 500ms | Large element animations             |

#### Easing

| Token          | Value                          | Usage                    |
| -------------- | ------------------------------ | ------------------------ |
| Easing Default | `cubic-bezier(0.4, 0, 0.2, 1)` | Standard transitions     |
| Easing In      | `cubic-bezier(0.4, 0, 1, 1)`   | Enter animations         |
| Easing Out     | `cubic-bezier(0, 0, 0.2, 1)`   | Exit animations          |
| Easing In Out  | `cubic-bezier(0.4, 0, 0.2, 1)` | Bidirectional animations |

#### Animation Definitions

| Animation        | Duration | Easing      | Usage                           |
| ---------------- | -------- | ----------- | ------------------------------- |
| Pulse            | 2s       | infinite    | System live indicator           |
| Card Hover Scale | 200ms    | ease-out    | Card hover transform            |
| Button Press     | 150ms    | ease-out    | Button active state scale(0.95) |
| FAB Expand       | 300ms    | ease-in-out | FAB text reveal                 |
| Link Color       | 200ms    | ease        | Navigation link hover           |
| Progress Bar     | 500ms    | ease-out    | Initial load animation          |
| Line Chart Draw  | 1000ms   | ease-in-out | Chart rendering                 |

#### Transition Properties

| Property               | Duration | Usage                     |
| ---------------------- | -------- | ------------------------- |
| `transition-colors`    | 200ms    | Color changes on hover    |
| `transition-all`       | 300ms    | Multiple property changes |
| `transition-transform` | 200ms    | Scale, translate changes  |
| `transition-shadow`    | 200ms    | Shadow changes on hover   |

---

## 3. Components

### 3.1 Button

#### Primary Button

| State    | Background            | Text Color            | Shadow            | Transform     |
| -------- | --------------------- | --------------------- | ----------------- | ------------- |
| Default  | `#003f7a`             | `#ffffff`             | `shadow-sm`       | none          |
| Hover    | `#003f7a`             | `#ffffff`             | `hover:shadow-lg` | none          |
| Active   | `#003f7a`             | `#ffffff`             | -                 | `scale(0.95)` |
| Disabled | `#003f7a` opacity 50% | `#ffffff` opacity 50% | none              | none          |
| Loading  | `#003f7a`             | `#ffffff`             | none              | none          |

**Dimensions:** `px-6 py-2.5` (24px horizontal, 10px vertical)
**Border Radius:** `rounded-lg` (8px)
**Font:** Plus Jakarta Sans, 700 (Bold), 14px

#### Secondary Button

| State   | Background | Text Color | Border                             | Shadow |
| ------- | ---------- | ---------- | ---------------------------------- | ------ |
| Default | `#ffffff`  | `#003f7a`  | `border border-outline-variant/30` | none   |
| Hover   | `#f3f3f4`  | `#003f7a`  | same                               | none   |
| Active  | `#e2e8f0`  | `#003f7a`  | same                               | none   |

#### Icon Button

| State   | Background  | Text Color | Shadow |
| ------- | ----------- | ---------- | ------ |
| Default | transparent | `#c2c6d3`  | none   |
| Hover   | `#f3f3f4`   | `#1a1c1d`  | none   |
| Active  | `#e2e8f0`   | `#1a1c1d`  | none   |

**Dimensions:** `p-2` (8px)
**Border Radius:** `rounded-lg` (8px)

#### FAB (Floating Action Button)

| State   | Background | Text Color | Shadow       | Scale         |
| ------- | ---------- | ---------- | ------------ | ------------- |
| Default | `#fecb00`  | `#003f7a`  | `shadow-2xl` | 1             |
| Hover   | `#fecb00`  | `#003f7a`  | `shadow-2xl` | `scale(1.05)` |
| Active  | `#fecb00`  | `#003f7a`  | `shadow-2xl` | `scale(0.95)` |

**Dimensions:** `p-4` (16px)
**Border Radius:** `rounded-full` (9999px)
**Border:** `border-4 border-white/20`

### 3.2 Input

#### Text Input

| State    | Background            | Border         | Ring                     | Shadow |
| -------- | --------------------- | -------------- | ------------------------ | ------ |
| Default  | `#f3f3f4`             | none           | none                     | none   |
| Focus    | `#f3f3f4`             | none           | `ring-2 ring-primary/20` | none   |
| Error    | `#f3f3f4`             | `border-error` | `ring-2 ring-error/20`   | none   |
| Disabled | `#f3f3f4` opacity 50% | none           | none                     | none   |

**Dimensions:** `w-full py-2.5 pl-10 pr-4`
**Border Radius:** `rounded-lg` (8px)
**Font:** Inter, 14px, 500
**Placeholder Color:** `#c2c6d3`

#### Search Input with Icon

**Structure:**

```
[Icon: search] + [Input Field] + [Clear Button (on focus)]
```

**Icon Position:** Absolute left-3 (12px from left edge)
**Icon Color:** `#c2c6d3` (outline variant)

### 3.3 Card

#### Summary Card (Bento Item)

| State   | Background | Border                      | Shadow            | Transform |
| ------- | ---------- | --------------------------- | ----------------- | --------- |
| Default | `#ffffff`  | `border-outline-variant/10` | `shadow-sm`       | none      |
| Hover   | `#ffffff`  | same                        | `hover:shadow-md` | none      |

**Padding:** `p-8` (32px)
**Border Radius:** `rounded-xl` (12px)

#### Trend Indicator Card (Gradient)

| State   | Background                                  | Shadow            | Transform                 |
| ------- | ------------------------------------------- | ----------------- | ------------------------- |
| Default | `linear-gradient(135deg, #003f7a, #2d68ff)` | `shadow-lg`       | none                      |
| Hover   | same                                        | `hover:shadow-xl` | `group-hover:scale(1.02)` |

**Padding:** `p-8` (32px)
**Border Radius:** `rounded-xl` (12px)

#### Standard Content Card

| State   | Background | Border                      | Shadow      |
| ------- | ---------- | --------------------------- | ----------- |
| Default | `#ffffff`  | `border-outline-variant/10` | `shadow-sm` |

**Padding:** `p-8` (32px)
**Border Radius:** `rounded-xl` (12px)

### 3.4 Select/Dropdown

| State    | Background | Border                      | Text                  | Ring                  |
| -------- | ---------- | --------------------------- | --------------------- | --------------------- |
| Default  | `#ffffff`  | `border-outline-variant/30` | `#1a1c1d`             | none                  |
| Focus    | `#ffffff`  | same                        | same                  | `ring-1 ring-primary` |
| Open     | `#ffffff`  | `border-primary`            | same                  | `ring-1 ring-primary` |
| Disabled | `#f3f3f4`  | `border-outline-variant/30` | `#1a1c1d` opacity 50% | none                  |

**Dimensions:** `px-4 py-2` (16px horizontal, 8px vertical)
**Border Radius:** `rounded-lg` (8px)
**Font:** Inter, 11px, 700 (Bold)

### 3.5 Table

#### Table Container

**Border Radius:** `rounded-xl` (12px)
**Overflow:** `overflow-hidden`
**Shadow:** `shadow-sm`
**Border:** `border-outline-variant/10`

#### Table Header

| Property       | Value                                        |
| -------------- | -------------------------------------------- |
| Background     | `#f3f3f4` (surface-variant) with 30% opacity |
| Text Color     | `#1a1c1d` with 70% opacity                   |
| Font           | Inter, 10px, 700 (Extrabold)                 |
| Letter Spacing | Widest (0.1em)                               |
| Text Transform | Uppercase                                    |
| Padding        | `px-8 py-4` (32px horizontal, 16px vertical) |

#### Table Row

| State   | Background                                   | Transition          |
| ------- | -------------------------------------------- | ------------------- |
| Default | transparent                                  | none                |
| Hover   | `#f3f3f4` (surface-variant) with 10% opacity | `transition-colors` |

**Divider:** `border-b border-surface-variant/30` (last row no border)

#### Table Cell

**Padding:** `px-8 py-6` (32px horizontal, 24px vertical)
**Font:** Inter, 14px, 500 (Medium)
**Text Color:** `#1a1c1d`

### 3.6 Modal/Dialog

_Not currently implemented in UI-001_

### 3.7 Toast/Notification

_Not currently implemented in UI-001_

### 3.8 Badge/Pill

#### Sentiment Badge

| Sentiment | Background     | Text Color | Border             | Dot Color |
| --------- | -------------- | ---------- | ------------------ | --------- |
| Positive  | `bg-green-50`  | `#52b788`  | `border-green-100` | `#52b788` |
| Neutral   | `bg-slate-100` | `#94a3b8`  | none               | `#94a3b8` |
| Negative  | `bg-red-50`    | `#f87171`  | `border-red-100`   | `#f87171` |

**Dimensions:** `px-4 py-1.5` (16px horizontal, 6px vertical)
**Border Radius:** `rounded-full` (9999px)
**Font:** Inter, 11px, 700 (Bold)
**Dot Size:** `w-1.5 h-1.5 rounded-full`

#### Keyword Badge

| Sentiment | Background    | Border                      | Text Color |
| --------- | ------------- | --------------------------- | ---------- |
| Positive  | `bg-green-50` | `border-green-100`          | `#52b788`  |
| Neutral   | `bg-slate-50` | `border-outline-variant/30` | `#94a3b8`  |
| Negative  | `bg-red-50`   | `border-red-100`            | `#f87171`  |

**Dimensions:** `px-5 py-2.5` (20px horizontal, 10px vertical)
**Border Radius:** `rounded-full` (9999px)
**Font:** Inter, 14px, 700 (Bold)
**Dot Size:** `w-2 h-2 rounded-full` (inline indicator)

### 3.9 Progress Bar

#### Sentiment Progress Bar (Stacked)

| Segment  | Background                         | Width (Example) |
| -------- | ---------------------------------- | --------------- |
| Positive | `pos-gradient` (#52b788 → #74c69d) | 45%             |
| Neutral  | `neu-gradient` (#94a3b8 → #cbd5e1) | 30%             |
| Negative | `neg-gradient` (#f87171 → #fb923c) | 25%             |

**Container:** `h-4 rounded-full bg-surface-variant/50 p-0.5 border border-outline-variant/10`
**Segment Height:** `h-full rounded-full`
**Overlap:** `-ml-1` for neutral and negative to create seamless stack

#### Source Progress Bar (Horizontal)

| Property      | Value                               |
| ------------- | ----------------------------------- |
| Height        | `h-2.5` (10px)                      |
| Background    | `#f3f3f4` (surface-variant)         |
| Border Radius | `rounded-full`                      |
| Fill          | Source color with opacity variation |
| Overflow      | `overflow-hidden`                   |

### 3.10 Trend Indicator

#### Positive Trend

| Property      | Value                                      |
| ------------- | ------------------------------------------ |
| Background    | `bg-green-50`                              |
| Text Color    | `#52b788`                                  |
| Border        | `border-green-100`                         |
| Icon          | `trending_up` (Material Symbols)           |
| Icon Color    | `#52b788`                                  |
| Icon Size     | 14px                                       |
| Padding       | `px-2 py-1` (8px horizontal, 4px vertical) |
| Border Radius | `rounded`                                  |

**Font:** Inter, 12px, 800 (Extrabold)

#### Negative Trend

| Property   | Value                              |
| ---------- | ---------------------------------- |
| Background | `bg-red-50`                        |
| Text Color | `#f87171`                          |
| Border     | `border-red-100`                   |
| Icon       | `trending_down` (Material Symbols) |
| Icon Color | `#f87171`                          |

### 3.11 System Status Indicator

| Property      | Value                                         |
| ------------- | --------------------------------------------- |
| Background    | `#f0fdf4` (green-50)                          |
| Border        | `border-green-100`                            |
| Dot Size      | `w-2 h-2`                                     |
| Dot Color     | `#52b788`                                     |
| Dot Animation | `animate-pulse`                               |
| Text          | Inter, 11px, 700 (Bold), uppercase            |
| Text Color    | `#52b788`                                     |
| Padding       | `px-3 py-1.5` (12px horizontal, 6px vertical) |
| Border Radius | `rounded-full`                                |

---

## 4. Screens

### UI-001: Dashboard (Main View)

**Screen Name:** Dashboard - Academic Pulse
**Screen ID:** UI-001
**Path:** `/` (Single Page Application root)
**Description:** Single-page dashboard yang menampilkan semua visualizations dan data sentiment analysis secara real-time.

#### Layout Structure

```
+------------------------------------------------------------------+
|  HEADER (sticky, z-50)                                           |
|  [Logo + Brand] [Navigation Links] [System Status] [Actions]     |
+------------------------------------------------------------------+
|  MAIN CONTENT (max-w-7xl mx-auto px-6 py-10)                    |
|                                                                  |
|  +------------------------------------------------------------+  |
|  | HERO SECTION                                               |  |
|  | [Title: Academic Pulse] [Search Input] [Export Button]     |  |
|  +------------------------------------------------------------+  |
|                                                                  |
|  +----------------+ +----------------+ +----------------------+  |
|  | SUMMARY CARD 1 | | SUMMARY CARD 2 | | TREND INDICATOR      |  |
|  | Total Data     | | Sentiment Mix  | | (Gradient Card)      |  |
|  | Points (15,420)| | [Progress Bar] | | ↑ +2.1% Growth       |  |
|  | +12.5% change  | | Pos/Neu/Neg %  | |                      |  |
|  +----------------+ +----------------+ +----------------------+  |
|                                                                  |
|  +------------------------------------------------------------+  |
|  | SENTIMENT TREND CHART (7 DAYS)                            |  |
|  | [Title + Legend]                                          |  |
|  | [Line Chart - SVG]                                         |  |
|  | [MON TUE WED THU FRI SAT SUN]                            |  |
|  +------------------------------------------------------------+  |
|                                                                  |
|  +----------------------------+ +-----------------------------+  |
|  | SENTIMENT BY SOURCE        | | VOLUME OVER TIME            |  |
|  | [Bar Chart Progress]       | | [Area Chart - SVG]          |  |
|  | YouTube 45%                | | [JAN FEB MAR APR MAY JUN]   |  |
|  | Twitter 30%                | |                             |  |
|  | Reddit 20%                 | |                             |  |
|  | Academic 5%                | |                             |  |
|  +----------------------------+ +-----------------------------+  |
|                                                                  |
|  +----------------------------+ +-----------------------------+  |
|  | TOP KEYWORDS                | | TRENDING TOPICS            |  |
|  | [Keyword Badges]           | | [Topic List]                |  |
|  | pembelajaran (pos)          | | Ujian Akhir Semester ↑ +14% |  |
|  | online (pos)               | | Digital Library ↑ +8%       |  |
|  | fleksibel (neu)            | | Registration System ↓ -5%   |  |
|  | biaya (neg)                | |                             |  |
|  | mudah (pos)                | |                             |  |
|  +----------------------------+ +-----------------------------+  |
|                                                                  |
|  +------------------------------------------------------------+  |
|  | RECENT MENTIONS TABLE                                      |  |
|  | [Filter Bar: Source Dropdown] [Sentiment Dropdown]        |  |
|  | +--------+-------------+-----------+---------+------------+|  |
|  | | Source | Content    | Sentiment | Time    | Actions    ||  |
|  | +--------+-------------+-----------+---------+------------+|  |
|  | | YouTube| "Pengalam..| [Positive]| 2 min   |            ||  |
|  | | Twitter| "Server... | [Negative]| 15 min  |            ||  |
|  | | Reddit | "Tips...   | [Neutral] | 1 hour  |            ||  |
|  | +--------+-------------+-----------+---------+------------+|  |
|  | [Pagination: Showing 1-3 of 15,420] [< 1 2 3 >]           |  |
|  +------------------------------------------------------------+  |
|                                                                  |
+------------------------------------------------------------------+
|  FOOTER                                                         |
|  [Brand] [Links] [Copyright]                                    |
+------------------------------------------------------------------+
                                        +------------------------+
                                        | FAB (Fixed Bottom-Right)|
                                        | [+] Add New Insight    |
                                        +------------------------+
```

#### Components Used

| Component        | Instance Count | Variants                                  |
| ---------------- | -------------- | ----------------------------------------- |
| Header           | 1              | Sticky                                    |
| Primary Button   | 2              | Default, with icon                        |
| Secondary Button | 2              | Icon buttons (notifications, settings)    |
| Summary Card     | 3              | Data Card, Sentiment Mix, Trend Indicator |
| Line Chart       | 1              | 3 lines (positive, neutral, negative)     |
| Bar Progress     | 4              | By source                                 |
| Area Chart       | 1              | Volume over time                          |
| Keyword Badge    | 5              | 3 positive, 1 neutral, 1 negative         |
| Topic Row        | 3              | 2 rising, 1 falling                       |
| Table            | 1              | With pagination                           |
| Select Dropdown  | 2              | Source filter, Sentiment filter           |
| FAB              | 1              | With expandable text                      |
| Search Input     | 1              | With icon                                 |

### UI-002: Header

**Screen Name:** Header
**Screen ID:** UI-002
**Path:** N/A (component, not standalone screen)
**Description:** Header sticky navigation dengan logo, navigation links, system status indicators, dan action buttons.

#### Layout Structure

```
[h-20: 80px] [sticky top-0 z-50]
max-w-7xl mx-auto px-6

[Logo + Brand] ---- [Nav Links] ---- [Status + Actions]
```

#### Components Used

| Component               | Position |
| ----------------------- | -------- |
| Brand Logo              | Left     |
| Navigation Links        | Center   |
| System Status Indicator | Right    |
| Notification Button     | Right    |
| Settings Button         | Right    |

### UI-003: Summary Cards

**Screen Name:** Summary Cards (Bento Grid)
**Screen ID:** UI-003
**Path:** N/A (component, not standalone screen)
**Description:** Kumpulan 3 summary cards yang menampilkan metrik utama dashboard.

#### Card 1: Total Data Points

| Element      | Value                 | Style                                                                     |
| ------------ | --------------------- | ------------------------------------------------------------------------- |
| Label        | "Total Data Points"   | `text-xs font-semibold uppercase tracking-widest text-on-surface-variant` |
| Value        | "15,420"              | `text-4xl font-bold text-primary`                                         |
| Change Badge | "+12.5% vs last week" | `bg-green-50 text-sent-pos flex items-center gap-2`                       |

#### Card 2: Overall Sentiment

| Element      | Value                   | Style                                                                     |
| ------------ | ----------------------- | ------------------------------------------------------------------------- |
| Label        | "Overall Sentiment"     | `text-xs font-semibold uppercase tracking-widest text-on-surface-variant` |
| Progress Bar | Stacked 45%/30%/25%     | 3-color gradient bar                                                      |
| Legend       | Pos/Neu/Neg percentages | `text-[11px] font-bold flex items-center gap-1.5`                         |

#### Card 3: Trend Velocity

| Element     | Value                             | Style                                                           |
| ----------- | --------------------------------- | --------------------------------------------------------------- |
| Label       | "Trend Velocity"                  | `text-xs font-semibold uppercase tracking-widest text-white/60` |
| Value       | "↑ +2.1%"                         | `text-4xl font-bold text-white`                                 |
| Description | "Growth in positive sentiment..." | `text-sm text-white/80`                                         |
| Background  | UT Gradient                       | `linear-gradient(135deg, #003f7a, #2d68ff)`                     |
| Icon        | analytics (background)            | `text-9xl text-white/20 absolute -right-4 -bottom-4`            |

### UI-004: Sentiment Trend Chart

**Screen Name:** Sentiment Trend (7 Days)
**Screen ID:** UI-004
**Path:** N/A (component, not standalone screen)
**Description:** Line chart SVG yang menampilkan trend sentimen selama 7 hari dengan 3 garis (positive, neutral, negative).

#### Chart Specifications

| Property          | Value                                            |
| ----------------- | ------------------------------------------------ |
| Type              | Line Chart with Area Fill                        |
| Height            | `h-80` (320px)                                   |
| Width             | `w-full` (700px SVG viewBox)                     |
| Grid Lines        | 4 horizontal dashed lines at 25%, 50%, 75%, 100% |
| X-Axis Labels     | MON, TUE, WED, THU, FRI, SAT, SUN                |
| Y-Axis            | Auto-scaled 0-100                                |
| Line Stroke Width | 3px                                              |
| Line Cap          | Round                                            |
| Area Fill Opacity | 10%                                              |

#### Line Colors

| Line     | Stroke Color | Area Fill                  |
| -------- | ------------ | -------------------------- |
| Positive | `#52b788`    | `rgba(82, 183, 136, 0.1)`  |
| Neutral  | `#94a3b8`    | `rgba(148, 163, 184, 0.1)` |
| Negative | `#f87171`    | `rgba(248, 113, 113, 0.1)` |

### UI-005: Sentiment by Source

**Screen Name:** Sentiment by Source
**Screen ID:** UI-005
**Path:** N/A (component, not standalone screen)
**Description:** Horizontal bar chart yang menampilkan breakdown sentimen per sumber data.

#### Source Breakdown

| Source            | Percentage | Bar Color               |
| ----------------- | ---------- | ----------------------- |
| YouTube           | 45%        | `#2d68ff` (100%)        |
| Twitter (X)       | 30%        | `#2d68ff` (70% opacity) |
| Reddit            | 20%        | `#2d68ff` (40% opacity) |
| Academic Journals | 5%         | `#2d68ff` (20% opacity) |

### UI-006: Volume Chart

**Screen Name:** Volume Over Time
**Screen ID:** UI-006
**Path:** N/A (component, not standalone screen)
**Description:** Area chart yang menampilkan volume mention dari waktu ke waktu.

#### Chart Specifications

| Property      | Value                                             |
| ------------- | ------------------------------------------------- |
| Type          | Area Chart                                        |
| Height        | `h-56` (224px)                                    |
| Background    | `bg-gradient-to-br from-primary/5 to-transparent` |
| Border        | `border border-outline-variant/10`                |
| X-Axis Labels | JAN, FEB, MAR, APR, MAY, JUN                      |
| Line Color    | `#003f7a`                                         |
| Line Width    | 2px                                               |
| Fill          | `rgba(0, 63, 122, 0.05)`                          |

### UI-007: Keywords Panel

**Screen Name:** Top Keywords
**Screen ID:** UI-007
**Path:** N/A (component, not standalone screen)
**Description:** Panel yang menampilkan 10 keywords teratas dengan sentiment indicator.

#### Keywords List

| Keyword      | Sentiment | Badge Style                |
| ------------ | --------- | -------------------------- |
| pembelajaran | Positive  | Green badge with green dot |
| online       | Positive  | Green badge with green dot |
| fleksibel    | Neutral   | Gray badge with gray dot   |
| biaya        | Negative  | Red badge with red dot     |
| mudah        | Positive  | Green badge with green dot |

#### Badge Layout

- Gap between badges: `gap-3` (12px)
- Hover state: Color intensity increases
- Cursor: `cursor-default` (not clickable in current impl)

### UI-008: Trending Topics

**Screen Name:** Trending Topics
**Screen ID:** UI-008
**Path:** N/A (component, not standalone screen)
**Description:** List topic yang sedang naik atau turun dengan change percentage.

#### Topics List

| Topic                  | Change | Direction | Style                         |
| ---------------------- | ------ | --------- | ----------------------------- |
| Ujian Akhir Semester   | +14%   | Rising    | Green badge, trending_up icon |
| Digital Library Access | +8%    | Rising    | Green badge, trending_up icon |
| Registration System    | -5%    | Falling   | Red badge, trending_down icon |

#### Row Structure

```
[Topic Name - hover:accent-blue] ---- [Change Badge]
```

### UI-009: Mentions Table

**Screen Name:** Recent Mentions Feed
**Screen ID:** UI-009
**Path:** N/A (component, not standalone screen)
**Description:** Tabel dengan pagination untuk melihat mention individual dari berbagai sumber.

#### Table Structure

| Column          | Header            | Width              | Alignment |
| --------------- | ----------------- | ------------------ | --------- |
| Source          | "Source"          | Auto               | Left      |
| Content Preview | "Content Preview" | `max-w-sm` (256px) | Left      |
| Sentiment       | "Sentiment"       | Auto               | Left      |
| Time            | "Time"            | Auto               | Right     |

#### Filter Bar

| Filter    | Type            | Options                               |
| --------- | --------------- | ------------------------------------- |
| Source    | Select Dropdown | All Sources, YouTube, Twitter, Reddit |
| Sentiment | Select Dropdown | All Sentiment, Positive, Negative     |

#### Pagination

| Element        | Value                                    |
| -------------- | ---------------------------------------- |
| Showing Text   | "Showing 1 to 3 of 15,420 entries"       |
| Page Buttons   | chevron_left, 1, 2, 3, chevron_right     |
| Active Page    | `bg-primary text-white`                  |
| Inactive Pages | `hover:bg-white text-on-surface-variant` |

---

## 5. Do's and Don'ts

### Do's

1. **Gunakan Primary Color (#003f7a)** untuk semua elemen interaktif utama seperti buttons, links, dan headers untuk konsistensi branding.

2. **Gunakan Sentiment Colors secara konsisten**: hijau (#52b788) untuk positive, abu-abu (#94a3b8) untuk neutral, merah (#f87171) untuk negative di seluruh dashboard.

3. **Gunakan Shadow SM untuk cards default** dan Shadow MD/LG untuk cards yang di-hover untuk memberikan feedback visual yang halus.

4. **Gunakan Plus Jakarta Sans untuk headlines** dan Inter untuk body text sesuai dengan typography hierarchy yang sudah ditetapkan.

5. **Gunakan Border Radius XL (12px)** untuk semua cards dan rounded-lg (8px) untuk buttons dan inputs untuk konsistensi visual.

6. **Selalu tampilkan System Status Indicator** di header untuk memberikan confidence kepada user bahwa sistem sedang live.

7. **Gunakan animations dan transitions** dengan duration 200-300ms untuk hover states dan micro-interactions.

8. **Gunakan Sticky Header** dengan z-index 50 untuk memastikan navigation selalu accessible.

9. **Gunakan Gradient untuk Trend Indicator Card** untuk menonjolkan importance of metric tersebut.

10. **Gunakan Pagination** dengan format "Showing X to Y of Z entries" untuk transparency terhadap user.

11. **Gunakan Uppercase + Letter Spacing untuk Labels** seperti "TOTAL DATA POINTS" dan table headers untuk visual hierarchy.

12. **Gunakan Material Symbols Outlined** sebagai icon library dengan weight FILL 0 untuk visual consistency.

### Don'ts

1. **Jangan gunakan Dark Mode** karena tidak ada dark mode support dalam spec ini - semua colors dan backgrounds harus Light Mode.

2. **Jangan gunakan Shadow yang terlalu berat** (shadow-xl atau lebih) pada elemen yang bukan FAB atau modal - keep it subtle.

3. **Jangan gunakan Text Color yang terlalu terang** (opacity rendah) untuk body text - readability adalah priority.

4. **Jangan gunakan Border Radius yang berbeda** untuk komponen yang sama - consistency is key.

5. **Jangan gunakan Animasi yang terlalu cepat atau lambat** - 200-300ms adalah sweet spot untuk transitions.

6. **Jangan gunakan lebih dari 3 colors untuk satu section** - keep visual clutter minimum.

7. **Jangan gunakan uppercase untuk body text atau content** - hanya untuk labels dan headers.

8. **Jangan gunakan hard-coded colors** - selalu gunakan design tokens yang sudah defined untuk maintainability.

9. **Jangan tampilkan empty states tanpa proper messaging** - jika data belum ada, tampilkan skeleton atau empty state yang informatif.

10. **Jangan gunakan z-index lebih dari 50 untuk elemen non-modal** kecuali ada specific reason (seperti FAB).

11. **Jangan gunakan font sizes yang tidak ada dalam typography scale** - 10px, 11px, 12px, 14px, 18px, 20px, 36px only.

12. **Jangan gunakan padding yang inconsistent** - gunakan spacing scale yang sudah defined (4px, 8px, 12px, 16px, 24px, 32px, 40px).

---

## 6. Appendix

### 6.1 Icons

**Icon Library:** Material Symbols Outlined

| Property     | Value                                                                |
| ------------ | -------------------------------------------------------------------- |
| Library      | Google Material Symbols                                              |
| Style        | Outlined                                                             |
| Weight Range | FILL 0, GRAD 0, opsz 24                                              |
| Weight Value | 400 (default)                                                        |
| Variable CSS | `font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24` |

#### Icon List Used

| Icon Name     | Usage                     | Size        |
| ------------- | ------------------------- | ----------- |
| school        | Logo/branding             | 24px        |
| trending_up   | Positive change indicator | 14px, 16px  |
| trending_down | Negative change indicator | 14px, 16px  |
| video_library | YouTube source indicator  | 20px        |
| chat          | Twitter source indicator  | 20px        |
| groups        | Reddit source indicator   | 20px        |
| notifications | Notification bell         | 24px        |
| settings      | Settings gear             | 24px        |
| search        | Search input icon         | 24px        |
| download      | Export button             | 20px        |
| chevron_left  | Pagination left           | 20px        |
| chevron_right | Pagination right          | 20px        |
| add           | FAB icon                  | 24px        |
| analytics     | Background decoration     | 144px (9xl) |

### 6.2 Breakpoints

**Framework:** Tailwind CSS

| Breakpoint | Min Width | Usage                     |
| ---------- | --------- | ------------------------- |
| sm         | 640px     | Small tablets             |
| md         | 768px     | Tablets, laptops          |
| lg         | 1024px    | Desktop                   |
| xl         | 1280px    | Large desktop (max-w-7xl) |
| 2xl        | 1536px    | Extra large screens       |

#### Responsive Behavior

| Element           | Mobile (<768px)   | Desktop (>=768px) |
| ----------------- | ----------------- | ----------------- |
| Header Navigation | Hidden            | Visible           |
| Hero Section      | Stacked vertical  | Horizontal flex   |
| Summary Cards     | 1 column          | 3 columns         |
| Insights Grid     | 1 column          | 2 columns         |
| Keywords/Trending | 1 column          | 2 columns         |
| Mentions Table    | Horizontal scroll | Full width        |
| Filter Bar        | Stacked           | Horizontal flex   |
| Footer            | Stacked           | Horizontal flex   |

### 6.3 Screenshots Index

| UI-ID  | Screen Name           | Folder Path                         | File               | Description                          |
| ------ | --------------------- | ----------------------------------- | ------------------ | ------------------------------------ |
| UI-001 | Dashboard             | `designs/full_dashboard_sentiment/` | `screen.png`       | Full dashboard dengan semua komponen |
| UI-001 | Dashboard             | `designs/full_dashboard_sentiment/` | `code.html`        | Complete HTML/CSS implementation     |
| UI-002 | Header                | -                                   | Included in UI-001 | Sticky header component              |
| UI-003 | Summary Cards         | -                                   | Included in UI-001 | Bento grid dengan 3 cards            |
| UI-004 | Sentiment Trend Chart | -                                   | Included in UI-001 | Line chart 7 hari                    |
| UI-005 | Sentiment by Source   | -                                   | Included in UI-001 | Bar chart breakdown                  |
| UI-006 | Volume Chart          | -                                   | Included in UI-001 | Area chart                           |
| UI-007 | Keywords Panel        | -                                   | Included in UI-001 | Keyword badges                       |
| UI-008 | Trending Topics       | -                                   | Included in UI-001 | Topic list dengan trends             |
| UI-009 | Mentions Table        | -                                   | Included in UI-001 | Paginated table                      |

---

## Revision History

| Version | Date       | Author | Changes                                                |
| ------- | ---------- | ------ | ------------------------------------------------------ |
| v1.0    | 2026-03-22 | Claude | Initial design document from PRD.md and designs folder |

---

_Document generated from: PRD.md (v1.0) and designs/full_dashboard_sentiment/_
