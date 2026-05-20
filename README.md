# Smart Job Auto Apply Assistant - Chrome Extension

## 🎯 Overview

A powerful Chrome extension that automates job application processes on LinkedIn, Indeed, and Naukri. Features include smart job matching, duplicate detection, autofill forms, Google Sheets integration, and AI-powered assistance.

## ✨ Features

### 🔐 Security
- Password-protected extension
- Auto-lock after inactivity
- Secure local storage
- No data sent to external servers (except Google Sheets & AI APIs when configured)

### 👤 Profile Management
- Complete professional profile
- Multiple resume profiles (Frontend, Backend, Full Stack, Fresher)
- Skills, experience, and preferences
- Salary expectations and notice period

### 💬 Q&A Bank
- Pre-configured common interview questions
- Custom questions and answers
- Auto-fill application form fields

### 🔍 Job Detection
- Automatic job detection on:
  - LinkedIn Jobs
  - Indeed
  - Naukri
- Extract job details automatically
- Visual indicator when job is detected

### 📊 Smart Match Score (0-100)
Calculates match based on:
- Skills match (30 points)
- Experience match (25 points)
- Location match (15 points)
- Salary match (15 points)
- Work mode preference (10 points)
- Role/title match (5 points)

Provides:
- Match percentage
- Recommendation (Strong/Average/Weak)
- Missing skills
- Strong points

### 🚫 Duplicate Detection
- Local storage check
- Google Sheets integration
- Checks by URL and job details
- Warning before applying to duplicates

### 📝 Autofill Engine
Automatically fills:
- Name, email, phone
- Location, LinkedIn, portfolio, GitHub
- Experience, skills, education
- Salary fields, notice period
- Common text questions from Q&A bank

### 📋 Application Tracker
Statuses:
- Found, Saved, Applied
- Interview, Offer, Rejected
- Skipped, Needs Manual Action

### 📊 Google Sheets Integration
- OAuth2 authentication
- Automatic sync
- Duplicate checking in sheet
- Tracks:
  - Date, Platform, Job Title, Company
  - Location, Job URL, Match Score
  - Status, Resume Used, Notes
  - Follow-up Date

### 🔔 Notifications
- Matching job found
- Duplicate detected
- Application saved
- Follow-up reminders

### 🤖 AI Helper (Optional - OpenRouter)
- Generate cover letters
- Improve answers
- Summarize job descriptions
- Suggest missing skills

### 🎯 Filters
- Keywords (include/exclude)
- Salary range
- Experience range
- Locations
- Work mode (Remote/Hybrid/Onsite)
- Company blacklist/whitelist
- Minimum match score

## 📦 Installation

### Step 1: Build the Extension

```bash
cd /app/chrome-extension

# Install dependencies
yarn install

# Build for production
yarn build
```

### Step 2: Load in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `/app/chrome-extension/dist` folder
5. Extension icon should appear in toolbar

### Step 3: Pin the Extension

1. Click the puzzle icon in Chrome toolbar
2. Find "Smart Job Auto Apply Assistant"
3. Click the pin icon to keep it visible

## 🚀 Setup Guide

### First Time Setup

1. **Create Password**
   - Click extension icon
   - Create a secure password (minimum 4 characters)
   - Confirm password

2. **Setup Profile**
   - Navigate to Profile tab
   - Fill in all required fields:
     - Full Name, Email, Phone
     - Location, LinkedIn, Portfolio, GitHub
     - Skills (add multiple)
     - Experience, Current Company
     - Current CTC, Expected CTC, Notice Period
     - Preferred Roles and Locations
     - Work Mode Preference
   - Click Save Profile

3. **Add Resumes**
   - Go to Resume tab
   - Add resume profiles:
     - Frontend Resume
     - Backend Resume
     - Full Stack Resume
     - Fresher Resume (if applicable)
   - Set default resume
   - Note: Actual file upload must be done manually during application

4. **Fill Q&A Bank**
   - Navigate to Q&A tab
   - Fill answers to common questions:
     - Tell me about yourself
     - Why should we hire you?
     - Current CTC, Expected CTC
     - Notice period
     - Relocation willingness
     - Work authorization
     - Reason for job change
   - Add custom questions if needed
   - Click Save All Answers

### Google Sheets Setup (Recommended)

#### Step 1: Create Google Cloud OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google Sheets API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Sheets API"
   - Click Enable
4. Create OAuth 2.0 Credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Application type: "Chrome Extension"
   - Name: "Job Auto Apply Assistant"
   - Copy the generated Client ID
5. Update manifest.json:
   - Replace `YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com` with your Client ID
   - Rebuild extension: `yarn build`
   - Reload extension in Chrome

#### Step 2: Create Google Sheet

1. Go to [Google Sheets](https://docs.google.com/spreadsheets)
2. Create a new spreadsheet
3. Name it "Job Applications Tracker"
4. Copy the Spreadsheet ID from URL:
   - URL format: `https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit`
   - Copy the [SPREADSHEET_ID] part

#### Step 3: Connect in Extension

1. Open extension
2. Go to Settings tab
3. Scroll to "Google Sheets Integration"
4. Paste Spreadsheet ID
5. Click "Connect Google Sheets"
6. Authorize the extension
7. Headers will be automatically created:
   - Date, Platform, Job Title, Company, Location
   - Job URL, Match Score, Status, Resume Used
   - Notes, Follow-up Date

### OpenRouter AI Setup (Optional)

1. Go to [OpenRouter](https://openrouter.ai/keys)
2. Sign up / Log in
3. Create new API key
4. Copy the API key
5. Open extension > Settings tab
6. Scroll to "AI Helper"
7. Paste API key
8. Click "Save API Key"

AI features now available:
- Generate cover letters
- Improve Q&A answers
- Summarize job descriptions
- Suggest missing skills

## 📖 Usage Guide

### Applying to Jobs

#### Method 1: Automatic Detection

1. Visit a job page on LinkedIn, Indeed, or Naukri
2. Extension automatically detects the job
3. "Job Detected" button appears on page
4. Click the button or open extension popup
5. Review job details and match score
6. Check for duplicate warning
7. Click "Autofill Application" if on application form
8. Review all filled fields
9. Manually fill resume upload and any missed fields
10. Review and submit manually
11. Click "Save Application" in extension

#### Method 2: Manual Save

1. While on job page, open extension
2. Go to "Job" tab
3. Review detected job
4. Click "Save Application"
5. Job saved to tracker and Google Sheets

### Managing Applications

1. Go to "Tracker" tab
2. Filter by status: All, Applied, Interview, Offer, Rejected, etc.
3. Update status by clicking dropdown on each application
4. Click "View Job" to open job URL
5. Delete applications if needed

### Dashboard

- View statistics:
  - Total jobs found
  - Total applied
  - Duplicates skipped
  - Average match score
- See follow-ups due today
- Quick actions to detect jobs or view tracker
- Recent applications list

## ⚙️ Settings

### General
- Auto-lock after inactivity (15 minutes default)
- Show notifications

### Security
- Change password anytime

### Google Sheets
- Connect/disconnect
- View connected spreadsheet

### AI Helper
- Configure OpenRouter API key

## 🎯 Best Practices

1. **Always Review Before Submit**
   - Autofill is smart but not perfect
   - Verify all fields, especially custom ones
   - Check resume upload

2. **Keep Profile Updated**
   - Update skills as you learn
   - Update CTC expectations
   - Update notice period

3. **Use Match Scores**
   - Focus on 70%+ matches
   - Review "missing skills" to improve profile
   - Don't apply to very low matches

4. **Respect Platform Rules**
   - Don't spam applications
   - Follow rate limits
   - Don't bypass captchas
   - Manual final submit recommended

5. **Track Everything**
   - Save all applications
   - Update statuses regularly
   - Use follow-up reminders
   - Add notes for important applications

## 🚨 Important Compliance Notes

### What This Extension Does NOT Do

❌ Does NOT bypass captchas
❌ Does NOT bypass login security
❌ Does NOT violate rate limits
❌ Does NOT scrape private data illegally
❌ Does NOT auto-submit without user permission
❌ Does NOT guarantee job application success

### What This Extension DOES

✅ Detects visible job information
✅ Extracts publicly available job details
✅ Autofills forms with YOUR data
✅ Asks for user confirmation before actions
✅ Provides helpful matching and tracking
✅ Saves time on repetitive form filling

## 🔧 Troubleshooting

### Extension Won't Load
- Make sure you built it: `yarn build`
- Check that you selected the `dist` folder, not root
- Enable Developer Mode in chrome://extensions
- Check browser console for errors

### Job Not Detected
- Make sure you're on a job details page (not search results)
- Try refreshing the page
- Check if website updated their HTML structure
- Content scripts might need updates

### Autofill Not Working
- Ensure you've filled your profile completely
- Make sure you're on the application form page
- Some fields might have custom names and need manual filling
- Check browser console for errors

### Google Sheets Not Connecting
- Verify Client ID in manifest.json is correct
- Ensure Google Sheets API is enabled
- Check spreadsheet sharing permissions
- Make sure you're using correct Spreadsheet ID

### Resume Upload
- Browser security prevents automatic file uploads
- You MUST upload resume manually
- Extension will remind you which resume to use
- This is a browser limitation, not a bug

## 📊 Google Sheet Format

Headers automatically created:

| Date | Platform | Job Title | Company | Location | Job URL | Match Score | Status | Resume Used | Notes | Follow-up Date |
|------|----------|-----------|---------|----------|---------|-------------|--------|-------------|-------|----------------|

Example:
| 2026-01-15 | LinkedIn | Senior Developer | TechCorp | Bangalore | https://... | 85% | Applied | Frontend Resume | Great match! | 2026-01-22 |

## 🔐 Privacy & Security

- All data stored locally in Chrome storage
- Password is hashed using SHA-256
- No data sent to external servers (except when you configure Google Sheets or OpenRouter)
- Google Sheets: Only data you explicitly save is synced
- OpenRouter: Only used when you trigger AI features
- No tracking or analytics
- Open source code - you can audit everything

## 🛣️ Future Improvements

- Support for more job platforms (Monster, Glassdoor, etc.)
- Email notifications for follow-ups
- Interview preparation notes
- Salary negotiation calculator
- Application analytics and insights
- Chrome Sync for multi-device support
- Custom autofill rules
- Export data to PDF/CSV
- Integration with more AI providers

## 🐛 Known Limitations

1. **Resume Upload**: Cannot be automated due to browser security. Must be done manually.
2. **Captcha**: Cannot be bypassed. Must be completed manually.
3. **Rate Limits**: Platform-specific limits apply. Use responsibly.
4. **HTML Changes**: Job platforms may update their HTML, breaking detection. Needs periodic updates.
5. **Dynamic Forms**: Some very custom application forms might not autofill correctly.
6. **Login**: You must be logged into job platforms. Extension doesn't handle authentication.

## 📝 Changelog

### Version 1.0.0 (2026-01-15)
- Initial release
- LinkedIn, Indeed, Naukri support
- Password protection
- Profile management
- Resume manager
- Q&A bank
- Job detection
- Smart match score
- Duplicate detection
- Autofill engine
- Application tracker
- Google Sheets integration
- Notifications
- Follow-up reminders
- Dashboard
- OpenRouter AI helper
- Filters

## 📄 License

MIT License - Feel free to use, modify, and distribute.

## 🤝 Support

For issues or questions:
1. Check Troubleshooting section
2. Review Known Limitations
3. Check browser console for errors
4. Verify all setup steps completed

## 🎉 Acknowledgments

- Built with React and Vite
- Icons created with PIL/Pillow
- Chrome Extension Manifest V3
- Google Sheets API
- OpenRouter AI API

---

**Disclaimer**: This tool is for personal use to assist with job applications. Always respect job platform terms of service, rate limits, and anti-bot measures. The extension does not guarantee job application success or interview calls. Use responsibly and ethically.
