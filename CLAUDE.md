# Smart Job Auto Apply Assistant — Chrome Extension

## What This Is

A **Chrome Extension (Manifest V3)** that automates the job application workflow on **LinkedIn**, **Indeed**, and **Naukri**. It detects job listings, calculates a profile match score (0-100), autofills application forms, tracks applications locally and in Google Sheets, uses OpenRouter AI for cover letters, and proactively discovers new jobs through multi-provider web scraping.

## Tech Stack

| Layer | Tech |
|-------|------|
| Runtime | Chrome Extension Manifest V3 |
| UI | React 19 (popup only) |
| Build | Vite 8 + @vitejs/plugin-react + terser |
| Package Manager | Yarn |
| Storage | `chrome.storage.local` + `chrome.storage.session` |
| External APIs | Google Sheets (OAuth + Service Account), OpenRouter AI, Scraping Providers |
| Scraping Providers | Firecrawl, ScrapingBee, Scrape.do, Apify, ScrapingDog, Custom |
| Auth | SHA-256 (salted) password, Chrome identity OAuth2 for Google |

## Project Structure

```
├── manifest.json            # MV3 manifest — permissions, content_scripts, background, OAuth2
├── background.js            # Service worker — message hub, alarms, discovery, notifications
├── popup/
│   └── popup.html           # 420x600 popup shell — mounts src/popup.jsx
├── content-scripts/
│   ├── content-base.js      # Shared base factory for platform scripts
│   ├── linkedin.js          # LinkedIn job detection (delegates to content-base)
│   ├── indeed.js            # Indeed job detection (delegates to content-base)
│   ├── naukri.js            # Naukri job detection (delegates to content-base)
│   └── auto-scroll.js       # Auto-scroll on search result pages
│   └── hiring-post.js       # LinkedIn hiring post detector
├── src/
│   ├── popup.jsx            # React entry point — createRoot → <App />
│   ├── popup.css            # Global styles
│   ├── components/
│   │   ├── App.jsx          # Main shell — auth gate, 8-tab navigation
│   │   ├── LoginScreen.jsx  # Password setup/unlock
│   │   ├── Dashboard.jsx    # Stats, discovery status, quick actions
│   │   ├── ProfileManager.jsx # Professional profile form
│   │   ├── ResumeManager.jsx  # Resume metadata tracking
│   │   ├── QAManager.jsx    # Q&A bank
│   │   ├── JobDetector.jsx  # Current job, match score, AI, web search
│   │   ├── JobSearch.jsx    # Web job search via scraping API
│   │   ├── ApplicationTracker.jsx # Application CRUD + filter
│   │   └── Settings.jsx     # General, security, Sheets, AI, scraping, discovery
│   └── services/
│       ├── detector.js      # Platform detection, job/card extraction
│       ├── matcher.js       # calculateMatchScore (weighted), selectBestResume
│       ├── autofill.js      # AutofillEngine class
│       ├── qa-matcher.js    # Similarity matching — keyword overlap + AI semantic fallback
│       ├── auth.js         # Salted SHA-256 password hash
│       ├── storage.js       # CRUD over chrome.storage.local
│       ├── sheets.js        # Google Sheets OAuth, sync, duplicate check
│       ├── ai.js           # OpenRouter AI — cover letter, summary, skills
│       ├── ai-providers.js  # AI provider registry — OpenRouter & Excloud
│       ├── qa-matcher.js    # Similarity matching — keyword overlap + AI semantic fallback
│       ├── providers.js     # Scraping provider config constants
│       ├── scraping.js      # Multi-provider scraping with fallback
│       ├── hiring-post.js   # Hiring post detection — email extraction, post classification
│       ├── sheets-auth.js   # Sheets auth — OAuth & Service Account JWT
│       ├── gsheets-sync.js  # Bidirectional Sheets sync (Q&A, Hiring Posts, Applications)
│       └── discovery.js     # Auto job discovery engine
├── assets/icons/          # Extension icons (16, 48, 128)
├── vite.config.js         # Vite build config
└── post-build.js          # Post-build — copies manifest, assets, organizes content-scripts/
```

## Key Flows

### 1. Job Detection (Manual)
```
User visits job detail page
  → Content script (content-base.js) detects via isJobPage()
  → extract*JobData() scrapes DOM
  → "Job Detected" button injected
  → background.js notified → filter match → notification
```

### 2. Job Detection (Auto-Scroll)
```
User visits search results page (e.g., linkedin.com/jobs/search)
  → auto-scroll.js injects, starts scrolling
  → MutationObserver detects new job cards
  → Cards extracted via extractJobCardFrom*()
  → Results stored in chrome.storage.session
  → Control bar shows count + pause/stop
```

### 3. Web Job Search (Scraping API)
```
User clicks "Search Web" or "Search All Platforms"
  → scraping.js tries providers by priority (Firecrawl → ScrapingBee → ...)
  → If one fails, tries next provider automatically
  → Results normalized and displayed in JobSearch tab
  → User can save jobs to tracker
```

### 4. Auto Discovery
```
chrome.alarms('autoDiscovery') fires at configured interval (30m/2h/6h) or on-demand
  → discovery.js builds search URLs from user profile
  → scraping.js fetches via configured providers
  → Results diffed against existing applications
  → User notified of new matching jobs
```

### 5. Match Score
```
calculateMatchScore(job, profile, filters):
  Skills(30) + Experience(25) + Location(15) + Salary(15) + WorkMode(10) + Role(5) = 100
  Returns: score, recommendation, strongPoints[], missingSkills[]
```

## Communication Channels

| Channel | Direction | Purpose |
|---------|-----------|---------|
| `chrome.runtime.onMessage` | Content ↔ Background | `jobDetected`, `scrollJobsFound`, `checkDuplicate`, `saveApplication`, `startDiscovery` |
| `chrome.tabs.sendMessage` | Popup → Content Script | `autofillForm`, `getCurrentJob`, `startScroll`, `stopScroll` |
| `chrome.storage.local` | Persistent | Profile, resumes, Q&A, applications, settings, filters, scraping providers, sheetsConfig |
| `chrome.storage.session` | Session-only | Lock state, current job, scroll detected jobs, discovery results |
| `chrome.runtime.sendMessage` | Content ↔ Background | `saveHiringPost` for hiring post data |
| `chrome.runtime.sendMessage` | Popup ↔ Background | `getServiceAccountToken` for Sheets auth |

## Required Configuration

1. **manifest.json `oauth2.client_id`** — Replace with real Google OAuth client ID
2. **Google Sheets** — Create spreadsheet with these tabs:
   - `Sheet1` (or custom name): Applications tracking
   - `Q&A Bank`: Q&A pairs (editable from Sheets & extension)
   - `HiringPosts`: HR emails and hiring post data
   Paste spreadsheet ID in Settings. Choose auth method (OAuth or Service Account).
3. **OpenRouter AI (optional)** — API key in Settings
4. **Scraping Providers** — Add API keys for Firecrawl, ScrapingBee, etc. in Settings
5. **Auto Discovery** — Enable and set interval (on-demand / 30 min / 2 hours / 6 hours)
6. **Hiring Post Detection** — Enabled on LinkedIn feed/post pages

## Build Commands

```bash
yarn install        # Install dependencies
yarn build          # Build to /dist (vite build + post-build.js)
```

## Known Limitations

- Resume upload cannot be automated (browser security)
- Captcha cannot be bypassed
- CSS selectors are fragile — platforms may break detection on layout changes
- Scraping API requires external provider (configurable, user provides API key)
- All data in `chrome.storage.local` — no cross-device sync
- No tests

### 6. LinkedIn Hiring Post Detection
```
User visits LinkedIn feed or post page
  -> hiring-post.js content script loaded
  -> MutationObserver + 5s interval scans articles
  -> isHiringPost() matches against HIRING_KEYWORDS
  -> extractPostData() gets author, company, emails, location, jobTitle
  -> highlightPost() adds green border + badge
  -> followAuthor() clicks Follow/Connect button
  -> saveToSheets() saves to Google Sheets "HiringPosts" tab
  -> Status badge shows count: "X hiring post(s) found · Y email(s)"
```

### 8. Q&A Similarity Matching (Keyword Overlap + AI Fallback)
```
Form question appears
  → findSimilarQA() checks Q&A bank for similar questions
  → Keyword overlap (Jaccard similarity): shared words / total unique words
  → Score >= 0.4: Use the best matching answer
  → Score < 0.4: AI semantic fallback (OpenRouter, top-3 closest)
  → AI score >= 75%: Use the answer
  → No match: Prompt user, save answer for future

Examples:
  "Tell me about yourself" ↔ "Describe your background" → 33% (yourself)
  "Why should we hire you?" ↔ "What makes you a good fit?" → AI checks: ~85%
  "Reason for leaving" ↔ "Reason for job change" → 60% (reason, job)
```
```
User configures spreadsheet ID + auth method in Settings
  -> OAuth: Chrome identity login popup
  -> Service Account: Upload GCP JSON file, share sheet with service account email

QAManager Tab:
  -> "Load from Sheets": Pulls all Q&A from Sheets, replaces local bank
  -> "Push to Sheets": Writes all local Q&A to Sheets tab

Sheets Structure (Q&A Bank Tab):
  Column A: Question, Column B: Answer, Column C: Category

User edits in Google Sheets → clicks "Load from Sheets" → local bank updated
User edits in extension → clicks "Push to Sheets" → Sheets updated
```

