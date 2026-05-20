# Testing Checklist - Smart Job Auto Apply Assistant

## Pre-Build Testing

### Build Process
- [ ] `yarn install` runs without errors
- [ ] `yarn build` completes successfully
- [ ] `/dist` folder created
- [ ] All files copied to dist folder correctly

## Installation Testing

### Chrome Extension Loading
- [ ] Extension loads in `chrome://extensions/`
- [ ] No errors in extension card
- [ ] Extension icon appears in toolbar
- [ ] Can pin extension to toolbar
- [ ] Clicking icon opens popup

## Security & Authentication

### Password Setup
- [ ] First time shows setup screen
- [ ] Can create password (4+ chars)
- [ ] Password mismatch shows error
- [ ] Password stored securely (hashed)
- [ ] After setup, goes to dashboard

### Login Flow
- [ ] Locked state shows login screen
- [ ] Correct password unlocks
- [ ] Incorrect password shows error
- [ ] Lock button locks extension
- [ ] Auto-lock after inactivity works

### Password Change
- [ ] Settings → Change Password works
- [ ] Wrong current password rejected
- [ ] New password saved correctly
- [ ] Can login with new password

## Profile Management

### Create Profile
- [ ] Profile form loads
- [ ] All fields render correctly
- [ ] Required fields validated
- [ ] Can add multiple skills
- [ ] Can remove skills
- [ ] Can add multiple roles
- [ ] Can add multiple locations
- [ ] Work mode dropdown works
- [ ] Save profile succeeds
- [ ] Success message shown

### Edit Profile
- [ ] Saved profile loads on revisit
- [ ] Can edit all fields
- [ ] Changes persist after save
- [ ] Validation still works

## Resume Manager

### Add Resumes
- [ ] Can add resume with name
- [ ] First resume set as default automatically
- [ ] Resume appears in list
- [ ] Upload date shown

### Manage Resumes
- [ ] Can set different resume as default
- [ ] Can delete resume
- [ ] Confirmation dialog on delete
- [ ] Cannot have zero resumes after first add

## Q&A Bank

### Default Questions
- [ ] Default questions load
- [ ] Can edit answers
- [ ] Changes persist

### Custom Questions
- [ ] Can add custom question
- [ ] Custom question appears
- [ ] Can edit custom answer
- [ ] Can delete custom question
- [ ] Confirmation on delete

### Save Functionality
- [ ] Save button works
- [ ] Success message shown
- [ ] All answers persist

## Job Detection

### LinkedIn
- [ ] Visit LinkedIn job page
- [ ] Job detected automatically
- [ ] "Job Detected" button appears on page
- [ ] Button positioned correctly
- [ ] Clicking button captures job data
- [ ] Job data extracted correctly:
  - [ ] Title
  - [ ] Company
  - [ ] Location
  - [ ] Salary (if available)
  - [ ] Experience
  - [ ] Description
  - [ ] Job URL

### Indeed
- [ ] Visit Indeed job page
- [ ] Job detected automatically
- [ ] Button appears
- [ ] Job data extracted

### Naukri
- [ ] Visit Naukri job page
- [ ] Job detected automatically
- [ ] Button appears
- [ ] Job data extracted

### SPA Navigation
- [ ] Job detection works after navigating (LinkedIn)
- [ ] Button removed when leaving job page
- [ ] Detects new job on navigation

## Match Score

### Calculation
- [ ] Match score calculated when profile exists
- [ ] Score shows 0-100%
- [ ] Recommendation shown (Strong/Average/Weak)
- [ ] Strong points listed
- [ ] Missing skills shown
- [ ] Visual score ring displays correctly

### Without Profile
- [ ] Shows message to setup profile
- [ ] No crash if profile missing

## Duplicate Detection

### Local Check
- [ ] Detects duplicate by URL
- [ ] Detects duplicate by company+title+location
- [ ] Shows warning banner
- [ ] Warning shows reason and date

### Google Sheets Check
- [ ] Checks sheets if connected
- [ ] Shows sheet duplicate warning
- [ ] Combines with local check

## Autofill Engine

### Basic Fields
- [ ] Full name autofilled
- [ ] Email autofilled
- [ ] Phone autofilled
- [ ] Location autofilled
- [ ] LinkedIn URL autofilled
- [ ] Portfolio URL autofilled
- [ ] GitHub URL autofilled

### Professional Fields
- [ ] Experience autofilled
- [ ] Current company autofilled
- [ ] Current CTC autofilled
- [ ] Expected CTC autofilled
- [ ] Notice period autofilled
- [ ] Skills autofilled

### Textarea Fields
- [ ] Q&A answers autofilled
- [ ] Summary/About autofilled
- [ ] Cover letter suggestion works

### Visual Feedback
- [ ] Filled fields highlighted
- [ ] Success notification shown
- [ ] Summary of filled fields shown

### Edge Cases
- [ ] Handles missing profile fields gracefully
- [ ] Doesn't overwrite existing values
- [ ] Works with dynamic forms

## Application Tracker

### View Applications
- [ ] All applications shown
- [ ] Recent first (reversed order)
- [ ] Empty state shown if none

### Filters
- [ ] All statuses filter works
- [ ] Applied filter works
- [ ] Interview filter works
- [ ] Offer filter works
- [ ] Rejected filter works
- [ ] Count correct for each filter

### Update Status
- [ ] Can change application status
- [ ] Status persists
- [ ] Filter updates automatically

### Actions
- [ ] View Job link opens correct URL
- [ ] Delete confirmation shown
- [ ] Delete removes application
- [ ] Application removed from list

## Dashboard

### Statistics
- [ ] Total found count correct
- [ ] Total applied count correct
- [ ] Duplicates count correct
- [ ] Average match score calculated
- [ ] Follow-ups due count correct

### Follow-up Alert
- [ ] Shows if follow-ups due today
- [ ] Count matches actual due items

### Recent Applications
- [ ] Shows last 5 applications
- [ ] Displays correct info
- [ ] Empty state if none

### Quick Actions
- [ ] Detect Job button navigates to Job tab
- [ ] View Tracker button navigates to Tracker tab

### No Profile State
- [ ] Shows setup prompt
- [ ] Create Profile button navigates

## Google Sheets Integration

### Connection
- [ ] Can paste spreadsheet ID
- [ ] Connect button works
- [ ] OAuth popup appears
- [ ] Can authorize
- [ ] Success message shown
- [ ] Connection status saved

### Sheet Initialization
- [ ] Headers created automatically
- [ ] All 11 columns present
- [ ] Column names correct

### Sync
- [ ] Saving application syncs to sheet
- [ ] Row added with correct data
- [ ] All columns filled correctly

### Disconnect
- [ ] Disconnect button works
- [ ] Confirmation shown
- [ ] Status updated
- [ ] Auth token revoked

## Notifications

### Job Detected
- [ ] Notification shown for matching job
- [ ] Title and company shown
- [ ] Can be disabled in settings

### Follow-up Due
- [ ] Notification shown for due follow-ups
- [ ] Count correct

### Application Saved
- [ ] Notification shown on save
- [ ] Company name shown

## Settings

### General Settings
- [ ] Auto-lock checkbox works
- [ ] Notifications checkbox works
- [ ] Settings persist after save

### Google Sheets
- [ ] Shows connection status
- [ ] Spreadsheet name shown if connected
- [ ] Connect/Disconnect toggle works

### AI Config
- [ ] Can enter API key
- [ ] API key saved
- [ ] Status shown if configured

## AI Features (if API key configured)

### Cover Letter
- [ ] Can generate cover letter
- [ ] Uses job and profile data
- [ ] Result shown
- [ ] Can copy result

### Improve Answer
- [ ] Can improve Q&A answer
- [ ] Context from job used
- [ ] Improved answer shown

### Summarize Job
- [ ] Can summarize job description
- [ ] Bullet points generated
- [ ] Readable summary

### Suggest Skills
- [ ] Suggests missing skills
- [ ] Based on job requirements
- [ ] Actionable suggestions

## UI/UX

### Popup Size
- [ ] Popup is 420x600px
- [ ] Scrollable content
- [ ] All content accessible

### Navigation
- [ ] All 7 tabs work
- [ ] Active tab highlighted
- [ ] Tab content switches correctly

### Responsive Design
- [ ] All forms fit popup width
- [ ] No horizontal scroll
- [ ] Buttons properly sized
- [ ] Text readable

### Loading States
- [ ] Spinner shown during loads
- [ ] Button disabled during actions
- [ ] Loading text shown

### Error Handling
- [ ] Error messages shown
- [ ] User-friendly messages
- [ ] No console errors

## Performance

### Load Time
- [ ] Popup opens quickly (<500ms)
- [ ] Job detection fast (<1s)
- [ ] Match calculation instant

### Memory
- [ ] No memory leaks
- [ ] Storage usage reasonable
- [ ] Background script lightweight

## Edge Cases

### Empty States
- [ ] No profile: shows prompt
- [ ] No resumes: shows empty state
- [ ] No applications: shows empty state
- [ ] No Q&A answers: still saves

### Invalid Data
- [ ] Handles missing job fields
- [ ] Handles invalid URLs
- [ ] Handles empty responses

### Network Issues
- [ ] Graceful failure for Google Sheets
- [ ] Graceful failure for AI API
- [ ] Shows error message
- [ ] Doesn't break extension

### Storage Limits
- [ ] Handles many applications (100+)
- [ ] Handles many skills/roles
- [ ] Warns if approaching limits

## Security

### Data Privacy
- [ ] Password hashed, not plain text
- [ ] No sensitive data in console logs
- [ ] No data sent to external servers (except configured)

### Permissions
- [ ] Only necessary permissions requested
- [ ] OAuth scope limited to sheets
- [ ] Content scripts on job sites only

## Browser Compatibility

### Chrome Latest
- [ ] All features work
- [ ] No console errors
- [ ] Manifest V3 compliant

### Storage APIs
- [ ] chrome.storage.local works
- [ ] chrome.storage.session works
- [ ] Data persists across sessions

### Extension APIs
- [ ] chrome.runtime messaging works
- [ ] chrome.tabs messaging works
- [ ] chrome.notifications work
- [ ] chrome.alarms work
- [ ] chrome.identity works

## Documentation

### README.md
- [ ] Complete and accurate
- [ ] All features documented
- [ ] Setup instructions clear
- [ ] Examples provided

### SETUP.md
- [ ] Quick start works
- [ ] Google OAuth guide clear
- [ ] AI setup clear

### Code Comments
- [ ] Key functions commented
- [ ] Complex logic explained
- [ ] API usage documented

## Deployment Ready

### Files
- [ ] All source files present
- [ ] manifest.json complete
- [ ] Icons present
- [ ] README complete

### Build
- [ ] Build script works
- [ ] Dist folder complete
- [ ] No dev dependencies in dist

### Final Checks
- [ ] No console errors
- [ ] No console warnings (except expected)
- [ ] Extension description complete
- [ ] Version number correct
- [ ] License file present

## Known Limitations (Documented)

- [ ] Resume upload manual (browser security)
- [ ] Captcha manual (compliance)
- [ ] Some forms might not autofill (custom HTML)
- [ ] Platform HTML changes might break detection

## Post-Launch Monitoring

### Week 1
- [ ] Monitor for errors
- [ ] Check user feedback
- [ ] Test on different job platforms
- [ ] Verify data persistence

### Month 1
- [ ] Check for platform HTML updates
- [ ] Verify Google Sheets still working
- [ ] Monitor API usage (if AI enabled)
- [ ] Gather improvement ideas

---

## Test Results

Date Tested: _______________
Tester: _______________
Chrome Version: _______________

Overall Status: [ ] PASS [ ] FAIL

Critical Issues Found:
1. 
2. 
3. 

Notes:


---

**Signature**: ________________  **Date**: __________
