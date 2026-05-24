# Smart Job Auto Apply Assistant

A **Chrome Extension (Manifest V3)** that automates the job application workflow on **LinkedIn**, **Indeed**, and **Naukri**. Detects job listings, calculates a profile match score (0-100), autofills application forms, tracks applications locally and in Google Sheets, uses AI for cover letters and semantic Q&A matching, proactively discovers new jobs through multi-provider web scraping, and detects LinkedIn hiring posts with HR email extraction.

## Features

### Job Detection & Application
- Automatic detection on LinkedIn, Indeed, Naukri job pages
- "Job Detected" button with match score (0-100)
- Duplicate detection (local + Google Sheets)
- Smart autofill engine for all form types (inputs, textareas, selects, radios, checkboxes)
- Visual highlighting of filled fields

### Smart Q&A System
- 14 pre-configured common questions
- Custom Q&A — add your own questions and answers
- **Fuzzy matching** — finds similar questions even with different wording (keyword overlap + AI semantic similarity)
- **Smart prompting** — asks you only for unanswered questions, saves for future
- **Google Sheets sync** — edit Q&A directly in Sheets, sync back to extension

### LinkedIn Hiring Post Detection
- Scans LinkedIn feed for hiring posts automatically
- Extracts email IDs, company name, location, job title from posts
- Follows the post author (HR/Recruiter/Company) automatically
- Saves to Google Sheets "HiringPosts" tab
- Visual highlighting with green border + badge

### Auto-Scroll Engine
- Scans job search result pages automatically
- Scrolls and extracts job cards in real-time
- Live count badge: "🔍 12 jobs found"

### Multi-Provider Scraping API
- 5 providers: Firecrawl, ScrapingBee, Scrape.do, Apify, ScrapingDog
- Auto-fallback — if one fails, tries next automatically
- Priority ordering — user controls which provider to try first
- Individual test button per provider

### Auto Job Discovery
- On-demand or periodic (30 min / 2 hrs / 6 hrs)
- Searches multiple platforms via scraping API
- Notifies you of new matching jobs
- Web search from Job Detector tab

### AI Features (Excloud + OpenRouter)
- **Excloud** (primary) + **OpenRouter** (fallback)
- Cover letter generation
- Job description summarization
- Q&A answer improvement
- Skill suggestions
- Semantic similarity for Q&A matching
- Test button per provider — "Send 'hy' → get reply"

### Application Tracking
- Status tracking: Found, Applied, Interview, Offer, Rejected, Skipped
- Google Sheets sync with multiple tabs
- Follow-up reminders with alarms
- Dashboard with real-time statistics

### Security
- Salted SHA-256 password hashing
- Auto-lock after inactivity
- All data stored locally in Chrome
- OAuth 2.0 for Google Sheets
- No tracking or analytics

## Quick Start

```bash
cd chrome-exention-job
yarn install
yarn build
```

### Load in Chrome
1. Open `chrome://extensions/`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked** → select `/dist` folder
4. Click extension icon → create password → done!

### First-Time Setup
1. **Profile tab** — fill name, email, skills, experience, CTC
2. **Q&A tab** — fill common answers
3. **Settings** — configure Google Sheets, AI keys, scraping providers
4. Visit any job page on LinkedIn/Indeed/Naukri and start applying!

## Google Sheets Setup

### Create the Spreadsheet
1. Go to [Google Sheets](https://docs.google.com/spreadsheets)
2. Create a new spreadsheet named "Job Applications Tracker"
3. Copy the **Spreadsheet ID** from the URL:
   `docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit`

### Three Tabs (Auto-Created)
| Tab | Purpose |
|-----|---------|
| **Sheet1** | Application tracking (Date, Platform, Title, Company, Location, URL, Score, Status, Resume, Notes, Follow-up) |
| **Q&A Bank** | Q&A pairs (Question, Answer, Category) — editable from Sheets or extension |
| **HiringPosts** | HR email extraction (Date, Platform, Author, Company, Emails, Location, Job Title, Post URL, Follow Status, Post Text) |

### Authentication (Choose One)

**Option A: Chrome OAuth**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create project → Enable Google Sheets API
3. Create OAuth client ID → Type: "Chrome Extension"
4. Copy Client ID
5. Edit `manifest.json` → Replace `YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com`
6. Rebuild: `yarn build`
7. Extension Settings → paste Spreadsheet ID → Connect

**Option B: Service Account**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. APIs & Services → Credentials → Create Service Account
3. Generate JSON key → download the `.json` file
4. Share the spreadsheet with the service account email (from JSON)
5. Extension Settings → choose "Service Account" → upload JSON file → Test

### Q&A Sync
- **Edit in Sheets** → Q&A Manager tab → "Load from Sheets" → local bank updated
- **Edit in Extension** → Q&A Manager tab → "Push to Sheets" → Sheets updated

## AI Provider Setup

### Excloud (Primary)
1. Go to [excloud.in](https://www.excloud.in)
2. Get your API key
3. Extension Settings → AI Helper → Excloud API → paste key
4. Click **⚡ Test** → should show "AI working! Reply: ..."
5. If error, check key or try OpenRouter fallback

### OpenRouter (Fallback)
1. Go to [OpenRouter](https://openrouter.ai/keys)
2. Create API key
3. Extension Settings → AI Helper → OpenRouter API → paste key
4. Click **⚡ Test**
5. If both configured: Excloud tried first, OpenRouter used as fallback

## Development

### Auto Watch Mode
```bash
yarn dev:watch
```
Watches for file changes → auto-rebuilds → Chrome extension auto-reloads. Zero manual work.

### Manual Build
```bash
yarn build
```

### Chrome Auto-Reload Setup
1. `chrome://extensions/`
2. "Extension reload notifications" → ON
3. `chrome://flags/#extensions-on-update-behavior` → "Update"

## Configuration

### Google OAuth Client ID
Edit `manifest.json` → replace `YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com`

### AI Providers
Settings tab → AI Helper section → Excloud and/or OpenRouter API keys

### Scraping Providers
Settings tab → add API keys, set priority, enable/disable per provider

### Auto Discovery
Settings tab → enable, set interval (on-demand / 30 min / 2 hrs / 6 hrs), select platforms

### Hiring Post Detection
Automatic — works on LinkedIn feed/post pages, no configuration needed

## Known Limitations

- **Resume upload** — must be done manually (browser security)
- **Captcha** — cannot be bypassed
- **CSS selectors** — platform HTML changes may break detection
- **Google Sheets** — requires separate setup
- **All data in chrome.storage.local** — no cross-device sync
- **No tests** — tested manually
- **AI semantic matching** — requires internet + API key
- **Hiring post detection** — LinkedIn only, limited to visible feed posts

## Best Practices

1. **Always review before submit** — autofill is smart but not perfect
2. **Keep profile updated** — update skills, CTC, notice period regularly
3. **Focus on 70%+ matches** — don't waste time on low scores
4. **Track everything** — save all applications, update statuses
5. **Use follow-ups** — check daily, send polite follow-ups
6. **Quality over quantity** — 10 good applications > 100 random ones