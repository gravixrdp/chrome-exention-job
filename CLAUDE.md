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
| External APIs | Google Sheets, OpenRouter AI, Scraping Providers |
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
│       ├── auth.js         # Salted SHA-256 password hash
│       ├── storage.js       # CRUD over chrome.storage.local
│       ├── sheets.js        # Google Sheets OAuth, sync, duplicate check
│       ├── ai.js           # OpenRouter AI — cover letter, summary, skills
│       ├── providers.js     # Scraping provider config constants
│       ├── scraping.js      # Multi-provider scraping with fallback
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
| `chrome.storage.local` | Persistent | Profile, resumes, Q&A, applications, settings, filters, scraping providers |
| `chrome.storage.session` | Session-only | Lock state, current job, scroll detected jobs, discovery results |

## Required Configuration

1. **manifest.json `oauth2.client_id`** — Replace with real Google OAuth client ID
2. **Google Sheets** — Create spreadsheet, paste ID in Settings
3. **OpenRouter AI (optional)** — API key in Settings
4. **Scraping Providers** — Add API keys for Firecrawl, ScrapingBee, etc. in Settings
5. **Auto Discovery** — Enable and set interval (on-demand / 30 min / 2 hours / 6 hours)

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
