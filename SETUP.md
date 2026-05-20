# Quick Setup Guide - Smart Job Auto Apply Assistant

## 🚀 Quick Start (5 minutes)

### Step 1: Build Extension (1 minute)
```bash
cd /app/chrome-extension
yarn build
```

### Step 2: Load in Chrome (1 minute)
1. Open Chrome → `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select `/app/chrome-extension/dist` folder
5. Extension loaded! 🎉

### Step 3: First Time Setup (3 minutes)

1. **Create Password**
   - Click extension icon
   - Create password → Confirm
   - You're in!

2. **Setup Profile** (Required for autofill)
   - Go to Profile tab
   - Fill: Name, Email, Phone
   - Add Skills (comma-separated)
   - Add Experience, Current/Expected CTC
   - Save Profile

3. **Fill Q&A Bank** (Recommended)
   - Go to Q&A tab
   - Fill common answers:
     - Tell me about yourself
     - Why should we hire you?
     - Current CTC, Expected CTC
     - Notice period
   - Save All

### Step 4: Start Using! 🚀
1. Visit any job on LinkedIn/Indeed/Naukri
2. Extension auto-detects job
3. Click "Job Detected" button
4. See match score
5. Click "Autofill Application"
6. Review & Submit manually
7. Click "Save Application"

---

## 📄 Google Sheets Setup (Optional, 10 minutes)

### Why?
- Track all applications in one place
- Prevent duplicate applications
- Share with mentors/friends
- Analyze application data

### How?

#### A. Create OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create/Select Project
3. Enable API:
   - "APIs & Services" → "Library"
   - Search "Google Sheets API" → Enable
4. Create Credentials:
   - "Credentials" → "Create Credentials" → "OAuth client ID"
   - Type: Chrome Extension
   - Name: Job Auto Apply
   - **Copy Client ID** (format: `xxxxx.apps.googleusercontent.com`)

5. Update Extension:
   ```bash
   cd /app/chrome-extension
   # Edit manifest.json - line 34
   # Replace: YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com
   # With: your-actual-client-id.apps.googleusercontent.com
   
   yarn build
   ```

6. Reload Extension:
   - Chrome → `chrome://extensions/`
   - Click refresh icon on extension

#### B. Create Spreadsheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create new spreadsheet
3. Name it: "Job Applications"
4. Copy Spreadsheet ID:
   - From URL: `docs.google.com/spreadsheets/d/[THIS_IS_THE_ID]/edit`
   - Copy the ID part

#### C. Connect

1. Open Extension → Settings
2. Paste Spreadsheet ID
3. Click "Connect Google Sheets"
4. Authorize
5. Done! ✅

---

## 🤖 AI Helper Setup (Optional, 2 minutes)

### Why?
- Generate cover letters
- Improve Q&A answers
- Get skill suggestions
- Summarize long job descriptions

### How?

1. Get API Key:
   - Go to [OpenRouter](https://openrouter.ai/keys)
   - Sign up (free credits available)
   - Create new key
   - Copy key (starts with `sk-or-...`)

2. Add to Extension:
   - Open Extension → Settings
   - Scroll to "AI Helper"
   - Paste API key
   - Save
   - Done! ✨

---

## 📝 Daily Usage

### Morning Routine
1. Open LinkedIn/Indeed/Naukri
2. Search for jobs
3. Open interesting job
4. Extension auto-detects
5. Check match score
6. If 70%+:
   - Click Autofill
   - Review
   - Submit
   - Save Application

### Evening Review
1. Open Extension
2. Go to Tracker
3. Update statuses
4. Check follow-ups
5. Plan tomorrow

---

## ✨ Pro Tips

1. **Update Profile Weekly**
   - Add new skills learned
   - Update CTC expectations

2. **Focus on High Matches**
   - 80%+ = Strong Match → Apply!
   - 60-80% = Average → Review carefully
   - <60% = Weak → Usually skip

3. **Use Filters**
   - Settings → Add keywords
   - Exclude companies you don't want
   - Set min salary

4. **Track Everything**
   - Always save applications
   - Update statuses promptly
   - Add notes for important ones

5. **Follow Up**
   - Check "Follow-ups Due" daily
   - Send polite follow-up emails
   - Update status after response

---

## ❗ Important Rules

❌ **DON'T:**
- Spam 100 applications/day
- Apply to same job twice
- Bypass captchas
- Submit without review
- Ignore rate limits

✅ **DO:**
- Review all fields
- Upload resume manually
- Submit manually
- Track applications
- Update profile regularly

---

## 🐛 Troubleshooting

**Extension not loading?**
- Did you run `yarn build`?
- Did you select `dist` folder?
- Is Developer Mode enabled?

**Job not detected?**
- Are you on job details page?
- Try refresh
- Check if website updated

**Autofill not working?**
- Is profile complete?
- Are you on application form?
- Some fields might be custom

**Google Sheets not connecting?**
- Is Client ID correct in manifest.json?
- Did you rebuild after editing?
- Is Sheets API enabled?

---

## 🎯 Success Metrics

Track your progress:
- Applications sent per week
- Average match score
- Response rate
- Interview conversion
- Time saved

**Goal**: Quality over Quantity!
- 10 good applications > 100 random ones
- Focus on 70%+ matches
- Personalize when possible

---

## 📧 Support

If stuck:
1. Read README.md (comprehensive guide)
2. Check browser console for errors
3. Verify all setup steps
4. Review Known Limitations section

---

## 🎉 You're Ready!

Start applying smarter, not harder! 🚀

Good luck with your job search! 🌟
