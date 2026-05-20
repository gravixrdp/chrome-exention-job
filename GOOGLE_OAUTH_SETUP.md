# Google Cloud OAuth Setup - Detailed Guide

## Overview
To enable Google Sheets integration, you need to create OAuth 2.0 credentials in Google Cloud Console.

## Step-by-Step Instructions

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account
3. Click "Select a project" dropdown (top left)
4. Click "NEW PROJECT"
5. Project name: `Job Auto Apply Assistant`
6. Click "CREATE"
7. Wait for project creation (10-20 seconds)
8. Select the new project from dropdown

### 2. Enable Google Sheets API

1. In left sidebar, click "APIs & Services" → "Library"
2. In search box, type: `Google Sheets API`
3. Click on "Google Sheets API" result
4. Click "ENABLE" button
5. Wait for API to enable (5-10 seconds)

### 3. Configure OAuth Consent Screen

1. In left sidebar, click "APIs & Services" → "OAuth consent screen"
2. Select "External" user type
3. Click "CREATE"
4. Fill in required fields:
   - App name: `Smart Job Auto Apply Assistant`
   - User support email: (your email)
   - Developer contact: (your email)
5. Click "SAVE AND CONTINUE"
6. Scopes: Click "ADD OR REMOVE SCOPES"
   - Search for: `spreadsheets`
   - Check: `https://www.googleapis.com/auth/spreadsheets`
   - Click "UPDATE"
7. Click "SAVE AND CONTINUE"
8. Test users: Add your email
9. Click "SAVE AND CONTINUE"
10. Click "BACK TO DASHBOARD"

### 4. Create OAuth Client ID

1. In left sidebar, click "APIs & Services" → "Credentials"
2. Click "+ CREATE CREDENTIALS" (top)
3. Select "OAuth client ID"
4. Application type: Select "Chrome Extension" from dropdown
   - If not visible, select "Web application" temporarily
5. Name: `Job Auto Apply Extension`
6. For Chrome Extension:
   - You'll get an Extension ID after loading unpacked extension
   - Come back here and update with actual Extension ID
7. Click "CREATE"
8. A dialog shows your credentials:
   - **Client ID**: Copy this! Format: `xxxxx-yyyyy.apps.googleusercontent.com`
9. Click "OK"

### 5. Get Chrome Extension ID

1. Build your extension:
   ```bash
   cd /app/chrome-extension
   yarn build
   ```

2. Load in Chrome:
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select `/app/chrome-extension/dist` folder

3. Copy Extension ID:
   - Look for extension card
   - Under the name, you'll see "ID: abcdefghijklmnopqrstuvwxyz"
   - Copy this ID

### 6. Update OAuth Client ID with Extension ID

1. Go back to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "APIs & Services" → "Credentials"
3. Click on your OAuth client name
4. In "Authorized redirect URIs", add:
   ```
   https://[YOUR_EXTENSION_ID].chromiumapp.org/
   ```
   Replace `[YOUR_EXTENSION_ID]` with actual ID from step 5
5. Click "SAVE"

### 7. Update Extension Manifest

1. Edit `/app/chrome-extension/manifest.json`:
   ```json
   "oauth2": {
     "client_id": "YOUR_CLIENT_ID_HERE.apps.googleusercontent.com",
     "scopes": [
       "https://www.googleapis.com/auth/spreadsheets"
     ]
   }
   ```

2. Replace `YOUR_CLIENT_ID_HERE` with Client ID from step 4

3. Rebuild extension:
   ```bash
   yarn build
   ```

4. Reload extension:
   - Go to `chrome://extensions/`
   - Click refresh icon on your extension

### 8. Create Google Sheet

1. Go to [Google Sheets](https://docs.google.com/spreadsheets)
2. Click "+ Blank" to create new
3. Name it: "Job Applications Tracker"
4. Copy Spreadsheet ID from URL:
   ```
   https://docs.google.com/spreadsheets/d/[COPY_THIS_ID]/edit
   ```

### 9. Connect in Extension

1. Open extension popup
2. Go to "Settings" tab
3. Scroll to "Google Sheets Integration"
4. Paste Spreadsheet ID
5. Click "Connect Google Sheets"
6. Authorize popup appears
7. Select your Google account
8. Click "Allow"
9. Success! Headers will be auto-created

### 10. Verify Connection

1. Check your Google Sheet
2. You should see headers:
   - Date | Platform | Job Title | Company | Location | Job URL | Match Score | Status | Resume Used | Notes | Follow-up Date

3. Test by saving an application:
   - Visit a job page
   - Open extension
   - Save application
   - Check if it appears in sheet

## Troubleshooting

### Error: "Redirect URI mismatch"
- Make sure Extension ID in manifest matches ID in OAuth settings
- Check redirect URI format: `https://[extension-id].chromiumapp.org/`

### Error: "Access blocked: This app's request is invalid"
- OAuth consent screen not configured
- Go back to step 3

### Error: "API key not valid"
- Make sure Google Sheets API is enabled
- Check Client ID is correct in manifest.json

### Extension ID Changed After Rebuild
- Extension ID changes when you modify manifest
- To keep same ID, don't change manifest structure
- Or update OAuth settings with new ID

### "Authorization popup doesn't appear"
- Check popup blocker
- Make sure you're using Chrome (not other browsers)
- Try in incognito mode

### "Cannot read properties of undefined"
- Make sure all services are using chrome.runtime correctly
- Rebuild extension
- Hard refresh: Ctrl+Shift+R

## Quick Reference

**Google Cloud Console**: https://console.cloud.google.com/
**API Library**: https://console.cloud.google.com/apis/library
**Credentials**: https://console.cloud.google.com/apis/credentials
**Google Sheets**: https://sheets.google.com/

## Security Notes

- Never share your Client ID publicly if using restricted scopes
- For this use case (personal use), it's relatively safe
- If publishing extension, use proper security practices
- Regularly review OAuth connections: https://myaccount.google.com/permissions

## Video Tutorial

For visual learners, search YouTube for:
"Chrome Extension OAuth Google Sheets API Tutorial"

Most concepts are similar across different extensions.

---

Need more help? Check the main README.md for additional troubleshooting steps.
