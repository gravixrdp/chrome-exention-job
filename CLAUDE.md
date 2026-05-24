# Smart Job Auto Apply Assistant — Chrome Extension

## What This Is

A **Chrome Extension (Manifest V3)** that automates the job application workflow on **LinkedIn**, **Indeed**, and **Naukri**. It detects job listings, calculates a profile match score (0-100), autofills application forms, tracks applications locally and in Google Sheets, uses AI for cover letters and semantic Q&A matching, proactively discovers new jobs through multi-provider web scraping, and detects LinkedIn hiring posts with HR email extraction.

## Documentation Strategy

Two files only — keep both in sync on every change:

| File | For | Content |
|------|-----|---------|
| [README.md](README.md) | Users & developers | Features, setup, configuration, best practices |
| [CLAUDE.md](CLAUDE.md) (this file) | AI agents | Architecture, code structure, flows, communication channels |

**Rule**: Every feature add/modify → update both files before committing.

## Tech Stack

| Layer | Tech |
|-------|------|
| Runtime | Chrome Extension Manifest V3 |
| UI | React 19 (popup only) |
| Build | Vite 8 + @vitejs/plugin-react + terser |
| Package Manager | Yarn |
| Storage | `chrome.storage.local` + `chrome.storage.session` |
| External APIs | Google Sheets (OAuth + Service Account), OpenRouter AI, Excloud AI, Scraping Providers |
| Scraping Providers | Firecrawl, ScrapingBee, Scrape.do, Apify, ScrapingDog, Custom |
| Auth | SHA-256 (salted) password, Chrome identity OAuth2 for Google, GCP Service Account JWT |

## Project Structure

```
├── manifest.json            # MV3 manifest — permissions, content_scripts, background, OAuth2
├── background.js            # Service worker — message hub, alarms, discovery, notifications
├── dev-watch.js            # File watcher — auto rebuild on change
├── popup/
│   └── popup.html          # 420x600 popup shell — mounts src/popup.jsx
├── content-scripts/
│   ├── content-base.js     # Shared base factory for platform scripts
│   ├── linkedin.js        # LinkedIn job detection (delegates to content-base)
│   ├── indeed.js          # Indeed job detection (delegates to content-base)
│   ├── naukri.js          # Naukri job detection (delegates to content-base)
│   ├── auto-scroll.js     # Auto-scroll on search result pages
│   └── hiring-post.js     # LinkedIn hiring post detector
├── src/
│   ├── popup.jsx          # React entry point — createRoot → <App />
│   ├── popup.css          # Global styles
│   ├── components/
│   │   ├── App.jsx        # Main shell — auth gate, 8-tab navigation
│   │   ├── LoginScreen.jsx # Password setup/unlock
│   │   ├── Dashboard.jsx  # Stats, discovery status, quick actions
│   │   ├── ProfileManager.jsx # Professional profile form
│   │   ├── ResumeManager.jsx  # Resume metadata tracking
│   │   ├── QAManager.jsx    # Q&A bank + Sheets sync buttons
│   │   ├── JobDetector.jsx  # Current job, match score, AI, web search
│   │   ├── JobSearch.jsx    # Web job search via scraping API
│   │   ├── ApplicationTracker.jsx # Application CRUD + filter
│   │   └── Settings.jsx     # General, security, Sheets, AI, scraping, discovery
│   └── services/
│       ├── detector.js      # Platform detection, job/card extraction
│       ├── matcher.js       # calculateMatchScore (weighted), selectBestResume
│       ├── autofill.js      # AutofillEngine — keyword overlap Q&A matching
│       ├── qa-matcher.js    # Similarity matching — keyword overlap + AI semantic fallback
│       ├── auth.js         # Salted SHA-256 password hash
│       ├── storage.js      # CRUD over chrome.storage.local
│       ├── sheets.js       # Google Sheets OAuth, sync, duplicate check
│       ├── sheets-auth.js  # Sheets auth — OAuth & Service Account JWT
│       ├── gsheets-sync.js # Bidirectional Sheets sync (Q&A, Hiring Posts, Applications)
│       ├── ai.js           # OpenRouter AI — cover letter, summary, skills
│       ├── ai-providers.js # AI provider registry — OpenRouter & Excloud
│       ├── providers.js    # Scraping provider config constants
│       ├── scraping.js     # Multi-provider scraping with fallback
│       ├── hiring-post.js  # Hiring post — email extraction, post classification
│       └── discovery.js    # Auto job discovery engine
├── assets/icons/          # Extension icons (16, 48, 128)
├── vite.config.js         # Vite build config
├── post-build.js          # Post-build — copies manifest, assets, organizes content-scripts/
├── README.md              # User guide — features, setup, best practices
└── CLAUDE.md              # This file — AI agent reference
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

### 6. Q&A Autofill with Smart Matching
```
Form textarea detected
  → get field label + placeholder
  → Exact match in Q&A bank → use answer
  → Substring match → use answer
  → Keyword overlap (Jaccard >= 0.4) → use answer
  → AI semantic fallback (Excloud → OpenRouter, score >= 75%) → use answer
  → No match → prompt user, save answer for future
```

### 7. LinkedIn Hiring Post Detection
```
User visits LinkedIn feed or post page
  → hiring-post.js content script loaded
  → MutationObserver + 5s interval scans articles
  → isHiringPost() matches against HIRING_KEYWORDS
  → extractPostData() gets author, company, emails, location, jobTitle
  → highlightPost() adds green border + badge
  → followAuthor() clicks Follow/Connect button
  → saveToSheets() saves to Google Sheets "HiringPosts" tab
  → Status badge shows count: "X hiring post(s) found · Y email(s)"
```

### 8. Q&A Google Sheets Sync (Bidirectional)
```
User configures spreadsheet ID + auth method in Settings
  → OAuth: Chrome identity login popup
  → Service Account: Upload GCP JSON file, share sheet with service account email

QAManager Tab:
  → "Load from Sheets": Pulls all Q&A from Sheets, replaces local bank
  → "Push to Sheets": Writes all local Q&A to Sheets tab

Sheets Structure (Q&A Bank Tab):
  Column A: Question, Column B: Answer, Column C: Category

User edits in Google Sheets → clicks "Load from Sheets" → local bank updated
User edits in extension → clicks "Push to Sheets" → Sheets updated
```

## Communication Channels

| Channel | Direction | Purpose |
|---------|-----------|---------|
| `chrome.runtime.onMessage` | Content ↔ Background | `jobDetected`, `scrollJobsFound`, `checkDuplicate`, `saveApplication`, `startDiscovery` |
| `chrome.runtime.onMessage` | Content ↔ Background | `saveHiringPost`, `getServiceAccountToken`, `promptQuestion` |
| `chrome.tabs.sendMessage` | Popup → Content Script | `autofillForm`, `getCurrentJob`, `startScroll`, `stopScroll` |
| `chrome.storage.local` | Persistent | Profile, resumes, Q&A, applications, settings, filters, scraping providers, sheetsConfig |
| `chrome.storage.session` | Session-only | Lock state, current job, scroll detected jobs, discovery results |

## Required Configuration

1. **manifest.json `oauth2.client_id`** — Replace with real Google OAuth client ID
2. **Google Sheets** — Create spreadsheet with tabs:
   - `Sheet1` (or custom): Applications tracking
   - `Q&A Bank`: Q&A pairs (editable from Sheets & extension)
   - `HiringPosts`: HR emails and hiring post data
   Paste spreadsheet ID in Settings. Choose auth method (OAuth or Service Account).
3. **AI Providers** — Excloud API key (primary) and/or OpenRouter API key (fallback)
4. **Scraping Providers** — Add API keys in Settings
5. **Auto Discovery** — Enable and set interval (on-demand / 30 min / 2 hrs / 6 hrs)
6. **Hiring Post Detection** — Enabled by default on LinkedIn feed/post pages

## Build Commands

```bash
yarn install        # Install dependencies
yarn build          # Build to /dist (vite build + post-build.js)
yarn dev:watch      # File watch + auto rebuild
```

## Storage Schema

### chrome.storage.local
```javascript
{
  passwordHash: "sha256_hash (salted)",
  isSetup: true,
  profile: { fullName, email, phone, skills, experience, ... },
  resumes: [{ id, name, isDefault, uploadedAt }, ...],
  qaBank: [{ question, answer }, ...],
  filters: { keywords, locations, minSalary, ... },
  applications: [{ id, date, platform, title, company, location, jobUrl, ... }, ...],
  hiringPosts: [{ id, timestamp, author, company, emails, ... }, ...],
  settings: { autoLockEnabled, inactivityTimeout, notifications, minMatchScore },
  googleSheets: { connected, spreadsheetId, spreadsheetName, connectedAt },
  sheetsConfig: { authMethod, serviceAccountJson, spreadsheetId, qaTabName, hiringPostsTabName, applicationsTabName, lastSyncAt },
  aiConfig: { enabled, apiKey, excloudApiKey },
  scrapingProviders: [{ id, name, apiKey, enabled, priority, lastError, ... }, ...],
  discoveryConfig: { enabled, intervalMinutes, platforms },
  salt: "hex_string (per-install random)"
}
```

### chrome.storage.session
```javascript
{
  locked: true/false,
  currentJob: { title, company, ... },
  scrollDetectedJobs: [...],
  discoveryResults: [...],
  discoveryTimestamp: "ISO string"
}
```

## Known Limitations

- **Resume upload** — cannot be automated (browser security)
- **Captcha** — cannot be bypassed
- **CSS selectors** — fragile, platforms may break detection on layout changes
- **Scraping API** — requires external provider configuration
- **All data in chrome.storage.local** — no cross-device sync
- **No tests** — tested manually
- **AI semantic matching** — requires internet + API key
- **Hiring post detection** — LinkedIn only, limited to visible feed posts
- **Content script dynamic imports** — paths relative to dist/, may break after build changes
