# Smart Job Auto Apply Assistant — Chrome Extension

## What This Is

A **Chrome Extension (Manifest V3)** that automates the job application workflow on **LinkedIn**, **Indeed**, and **Naukri**. It detects job listings, calculates a profile match score (0-100), autofills application forms, tracks applications locally and in Google Sheets, and optionally uses OpenRouter AI for cover letters.

## Tech Stack

| Layer | Tech |
|-------|------|
| Runtime | Chrome Extension Manifest V3 |
| UI | React 19 (popup only) |
| Build | Vite 8 + @vitejs/plugin-react |
| Package Manager | Yarn |
| Storage | `chrome.storage.local` + `chrome.storage.session` |
| External APIs | Google Sheets API, OpenRouter AI API |
| Auth | SHA-256 password hash, Chrome identity OAuth2 for Google |

## Project Structure

```
├── manifest.json            # MV3 manifest — permissions, content_scripts, background, OAuth2
├── background.js            # Service worker — message hub, storage CRUD, notifications, alarms
├── popup/
│   └── popup.html           # 420x600 popup shell — mounts src/popup.jsx
├── content-scripts/
│   ├── content-base.js      # Shared base for all platform content scripts
│   ├── linkedin.js          # LinkedIn job detection + autofill
│   ├── indeed.js            # Indeed job detection + autofill
│   └── naukri.js            # Naukri job detection + autofill
├── src/
│   ├── popup.jsx            # React entry point — createRoot → <App />
│   ├── popup.css            # Global styles — reset, scrollbar, spinner, badges, cards, alerts
│   ├── components/
│   │   ├── App.jsx          # Main shell — auth gate, tab navigation (7 tabs)
│   │   ├── LoginScreen.jsx  # Password setup/unlock screen
│   │   ├── Dashboard.jsx    # Stats: found, applied, duplicates, avg match, follow-ups
│   │   ├── ProfileManager.jsx # Professional profile form (name, skills, CTC, roles, etc.)
│   │   ├── ResumeManager.jsx  # Resume metadata tracking (no file upload — browser security)
│   │   ├── QAManager.jsx    # Q&A bank — 14 pre-filled + custom questions
│   │   ├── JobDetector.jsx  # Current job display, match score, duplicate warning, actions
│   │   ├── ApplicationTracker.jsx # Application list with status filter + CRUD
│   │   └── Settings.jsx     # General, security, Google Sheets, AI config
│   └── services/
│       ├── detector.js      # Platform detection, job page URL matching, DOM extraction
│       ├── matcher.js       # calculateMatchScore (weighted), selectBestResume
│       ├── autofill.js      # AutofillEngine class — fills forms by label matching
│       ├── auth.js         # Password hash (SHA-256 + salt), setup, verify, lock/unlock
│       ├── storage.js       # CRUD wrapper over chrome.storage.local
│       ├── sheets.js        # Google Sheets OAuth connect, sync, duplicate check
│       └── ai.js           # OpenRouter AI — cover letter, answer improvement, summary
├── assets/icons/          # Extension icons (16, 48, 128)
├── vite.config.js         # Vite build config — outputs to /dist
└── post-build.js          # Post-build — copies manifest.json, assets, background.js to /dist
```

## How It Works — End-to-End Flow

### 1. User Installs Extension
- Load `/dist` folder in `chrome://extensions` (Developer Mode)

### 2. First Launch — Password Setup
- Open popup → LoginScreen.jsx → SHA-256 hash password stored in `chrome.storage.local`

### 3. User Fills Profile
- ProfileManager.jsx → saved via `storage.saveProfile()` → `chrome.storage.local`

### 4. User Browses Job Sites (LinkedIn / Indeed / Naukri)
```
User visits job page
  → Content script matches URL (manifest.json host_permissions)
  → content script init() calls extract*JobData() (detector.js)
  → DOM scraped via CSS selectors for title, company, location, salary, description
  → Floating "Job Detected" button injected on page
  → chrome.runtime.sendMessage('jobDetected') to background.js
  → background.js checks filters → shows notification if job matches
```

### 5. User Opens Extension Popup
```
JobDetector.jsx reads chrome.storage.session for current job
  → calculateMatchScore(job, profile, filters) from matcher.js
  → Scoring: Skills(30) + Experience(25) + Location(15) + Salary(15) + WorkMode(10) + Role(5) = 100
  → checkDuplicate in local storage + Google Sheets
  → Display: match %, strong points, missing skills, duplicate warning
```

### 6. Autofill
```
User clicks "Autofill Application"
  → chrome.tabs.sendMessage to active tab's content script
  → Content script creates AutofillEngine(profile, qaBank, selectedResume)
  → Engine scans form fields by label/placeholder/name/id
  → Fills text inputs, textareas, selects, radios, checkboxes
  → Dispatches input + change events for React/DOM frameworks
  → Highlights filled fields in green
```

### 7. Save Application
```
User clicks "Save Application"
  → chrome.runtime.sendMessage('saveApplication') to background.js
  → background.js saves to chrome.storage.local + Google Sheets
  → Shows notification
```

### 8. Follow-up Reminders
```
chrome.alarms creates 'checkFollowUps' alarm (60 min period)
  → Every hour: filters applications where followUpDate == today
  → Pushes Chrome notification
```

## Key Data Models

### Profile
```js
{
  fullName, email, phone, location,
  linkedinUrl, portfolioUrl, githubUrl,
  skills: string[],           // e.g. ["React", "Node.js", "AWS"]
  experience,                   // e.g. "3 years"
  currentCompany, currentCTC, expectedCTC, noticePeriod,
  preferredRoles: string[],     // e.g. ["Frontend Developer", "Full Stack"]
  preferredLocations: string[], // e.g. ["Bangalore", "Remote"]
  workModePreference          // "Remote" | "Hybrid" | "Onsite" | "Any"
}
```

### Application
```js
{
  id, date, platform, title, company, location,
  jobUrl, matchScore, status, resumeUsed, notes, followUpDate
}
// status: "Saved" | "Applied" | "Interview" | "Offer" | "Rejected" | "Skipped"
```

### Match Score Result
```js
{
  score: 0-100,
  recommendation: "Strong Match" | "Average Match" | "Weak Match",
  details: {
    skillsMatch, experienceMatch, locationMatch,
    salaryMatch, workModeMatch, roleMatch,
    missingSkills: string[], strongPoints: string[]
  }
}
```

## Communication Channels

| Channel | Direction | Purpose |
|---------|-----------|---------|
| `chrome.runtime.onMessage` | Content → Background | `jobDetected`, `checkDuplicate`, `saveApplication` |
| `chrome.runtime.onMessage` | Background → Content | `getAuthToken`, `revokeAuthToken`, `resetInactivityTimer` |
| `chrome.tabs.sendMessage` | Popup → Content Script | `autofillForm`, `getCurrentJob` |
| `chrome.storage.local` | Persistent | Profile, resumes, Q&A, applications, settings, filters |
| `chrome.storage.session` | Session-only | Lock state, current job data |

## Required Configuration

1. **manifest.json `oauth2.client_id`** — Replace `YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com` with real Google OAuth client ID
2. **Google Sheets** — Create spreadsheet, paste ID in Settings
3. **OpenRouter AI (optional)** — API key in Settings for AI features

## Build Commands

```bash
yarn install        # Install dependencies
yarn build          # Build to /dist (vite build + post-build.js copies assets)
```

## Known Limitations

- Resume upload cannot be automated (browser security — file input requires user interaction)
- Captcha cannot be bypassed
- CSS selectors in detector.js are fragile — platforms may break detection on layout changes
- All data lives in `chrome.storage.local` — no cross-device sync (Chrome Sync not used)
- No tests
