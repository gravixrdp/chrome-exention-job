// Background Service Worker — Smart Job Auto Apply Assistant

const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes
const MESSAGE_TIMEOUT = 5000; // 5 seconds for sendMessage
let inactivityTimer;

// Helper: sendMessage with timeout
function sendMessageWithTimeout(message) {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => resolve(null), MESSAGE_TIMEOUT);
    chrome.runtime.sendMessage(message, (response) => {
      clearTimeout(timeout);
      resolve(response);
    });
  });
}

// Initialize extension
chrome.runtime.onInstalled.addListener(async () => {
  console.log('Smart Job Auto Apply Assistant installed');

  const settings = await chrome.storage.local.get(['settings']);
  if (!settings.settings) {
    await chrome.storage.local.set({
      settings: {
        autoLockEnabled: true,
        inactivityTimeout: 15,
        notifications: true,
        minMatchScore: 60
      }
    });
  }

  // Create alarms for follow-ups
  chrome.alarms.create('checkFollowUps', { periodInMinutes: 60 });

  // Create alarm for auto-discovery
  const { discoveryConfig } = await chrome.storage.local.get(['discoveryConfig']);
  if (discoveryConfig?.enabled && discoveryConfig.intervalMinutes > 0) {
    chrome.alarms.create('autoDiscovery', { periodInMinutes: discoveryConfig.intervalMinutes });
  }
});

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'jobDetected') {
    handleJobDetected(request.data);
    return false;
  } else if (request.action === 'scrollJobsFound') {
    handleScrollJobsFound(request.data);
    return false;
  } else if (request.action === 'checkDuplicate') {
    checkDuplicate(request.data).then(sendResponse);
    return true;
  } else if (request.action === 'saveApplication') {
    saveApplication(request.data).then(sendResponse);
    return true;
  } else if (request.action === 'getAuthToken') {
    getGoogleAuthToken().then(sendResponse);
    return true;
  } else if (request.action === 'getServiceAccountToken') {
    getServiceAccountTokenHandler(request.serviceAccountJson).then(sendResponse);
    return true;
  } else if (request.action === 'revokeAuthToken') {
    revokeGoogleAuthToken().then(sendResponse);
    return true;
  } else if (request.action === 'resetInactivityTimer') {
    resetInactivityTimer();
    return false;
  } else if (request.action === 'startDiscovery') {
    startDiscovery().then(sendResponse);
    return true;
  } else if (request.action === 'saveHiringPost') {
    saveHiringPost(request.data).then(sendResponse);
    return true;
  } else if (request.action === 'promptQuestion') {
    // Show question prompt in the active tab via scripting API
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      if (tabs.length === 0) {
        sendResponse({ answer: '' });
        return;
      }
      const tab = tabs[0];
      const [{ result }] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: askQuestion,
        args: [request.question, request.isQuestionNew]
      });
      sendResponse({ answer: result });
    });
    return true;
  }
});

// Helper: show native prompt in page context
function askQuestion(question, isQuestionNew) {
  const heading = isQuestionNew
    ? '📝 Smart Q&A — New Question\n\nAnswer this question (will be saved for future):'
    : '📝 Smart Q&A\n\nYou haven\'t answered this question yet:';

  return prompt(`${heading}\n\nQ: ${question}`);
}

// Handle job detected
async function handleJobDetected(jobData) {
  const settings = await chrome.storage.local.get(['settings']);
  if (settings.settings?.notifications) {
    const matches = await checkJobFilters(jobData);
    if (matches) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'assets/icons/icon128.png',
        title: 'Matching Job Found!',
        message: `${jobData.title} at ${jobData.company}`,
        priority: 2
      });
    }
  }
}

// Handle scroll-detected jobs from auto-scroll content script
async function handleScrollJobsFound(data) {
  const settings = await chrome.storage.local.get(['settings']);
  if (settings.settings?.notifications && data.newCount > 0) {
    // Only notify if this is a significant batch
    if (data.count > 0 && data.count % 5 === 0) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'assets/icons/icon128.png',
        title: '📜 Scrolling...',
        message: `${data.count} jobs detected on search page`,
        priority: 1
      });
    }
  }
}

// Check if job matches user filters
async function checkJobFilters(jobData) {
  const { filters } = await chrome.storage.local.get(['filters']);
  if (!filters) return true;

  if (filters.keywords && filters.keywords.length > 0) {
    const hasKeyword = filters.keywords.some(keyword =>
      jobData.title.toLowerCase().includes(keyword.toLowerCase()) ||
      jobData.description?.toLowerCase().includes(keyword.toLowerCase())
    );
    if (!hasKeyword) return false;
  }

  if (filters.excludedKeywords && filters.excludedKeywords.length > 0) {
    const hasExcluded = filters.excludedKeywords.some(keyword =>
      jobData.title.toLowerCase().includes(keyword.toLowerCase()) ||
      jobData.description?.toLowerCase().includes(keyword.toLowerCase())
    );
    if (hasExcluded) return false;
  }

  if (filters.locations && filters.locations.length > 0 && jobData.location) {
    const matchesLocation = filters.locations.some(loc =>
      jobData.location.toLowerCase().includes(loc.toLowerCase())
    );
    if (!matchesLocation) return false;
  }

  return true;
}

// Check for duplicate application
async function checkDuplicate(jobData) {
  try {
    const { applications } = await chrome.storage.local.get(['applications']);
    const apps = applications || [];

    const urlMatch = apps.find(app => app.jobUrl === jobData.jobUrl);
    if (urlMatch) {
      return { isDuplicate: true, reason: 'Already applied to this URL', application: urlMatch };
    }

    const detailsMatch = apps.find(app =>
      app.company.toLowerCase() === jobData.company.toLowerCase() &&
      app.title.toLowerCase() === jobData.title.toLowerCase() &&
      app.location?.toLowerCase() === jobData.location?.toLowerCase()
    );
    if (detailsMatch) {
      return { isDuplicate: true, reason: 'Similar job already applied', application: detailsMatch };
    }

    return { isDuplicate: false };
  } catch (error) {
    console.error('Error checking duplicate:', error);
    return { isDuplicate: false, error: error.message };
  }
}

// Save application
async function saveApplication(appData) {
  try {
    const { applications = [] } = await chrome.storage.local.get(['applications']);

    const newApp = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      ...appData
    };

    applications.push(newApp);
    await chrome.storage.local.set({ applications });

    // Sync to Google Sheets (non-blocking)
    syncToGoogleSheets(newApp).catch(err => {
      console.error('Failed to sync to Google Sheets:', err);
    });

    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'assets/icons/icon128.png',
      title: 'Application Saved',
      message: `Saved application to ${appData.company}`,
      priority: 1
    });

    return { success: true, application: newApp };
  } catch (error) {
    console.error('Error saving application:', error);
    return { success: false, error: error.message };
  }
}

// Google OAuth
async function getGoogleAuthToken() {
  try {
    const token = await new Promise((resolve, reject) => {
      chrome.identity.getAuthToken({ interactive: true }, (t) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(t);
        }
      });
    });
    return { success: true, token };
  } catch (error) {
    console.error('Error getting auth token:', error);
    return { success: false, error: error.message };
  }
}

async function revokeGoogleAuthToken() {
  try {
    const token = await new Promise((resolve) => {
      chrome.identity.getAuthToken({ interactive: false }, (t) => {
        if (chrome.runtime.lastError) {
          resolve(null);
        } else {
          resolve(t);
        }
      });
    });

    if (token) {
      await new Promise((resolve) => {
        chrome.identity.removeCachedAuthToken({ token }, resolve);
      });
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Service Account JWT Token Handler
async function getServiceAccountTokenHandler(serviceAccountJson) {
  try {
    const sa = typeof serviceAccountJson === 'string'
      ? JSON.parse(serviceAccountJson)
      : serviceAccountJson;

    const { cleanPemKey, importRsaKey, createJwt, exchangeJwtForToken } =
      await import('src/services/sheets-auth.js');

    // We need to call these from the module, but they're not exported as a namespace
    // So let's do the work directly here
    const pem = sa.private_key;
    const raw = pem.replace(/-----BEGIN PRIVATE KEY-----/, '')
                   .replace(/-----END PRIVATE KEY-----/, '')
                   .replace(/\s/g, '');
    const binary = Uint8Array.from(atob(raw), c => c.charCodeAt(0));
    const key = await crypto.subtle.importKey(
      'pkcs8', binary,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false, ['sign']
    );

    const now = Math.floor(Date.now() / 1000);
    const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({
      iss: sa.client_email,
      scope: 'https://www.googleapis.com/auth/spreadsheets',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now
    }));

    const toSign = header + '.' + payload.replace(/=+$/, '');
    const signature = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5', key,
      new TextEncoder().encode(toSign)
    );
    const sigB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const jwt = toSign + '.' + sigB64;

    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=' + encodeURIComponent(jwt)
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Token exchange failed: ${res.status} ${text}`);
    }
    const data = await res.json();

    return { success: true, token: data.access_token, method: 'service-account' };
  } catch (error) {
    console.error('Service account token error:', error);
    return { success: false, error: error.message };
  }
}

// Save hiring post to storage + Google Sheets
async function saveHiringPost(postData) {
  try {
    const { hiringPosts = [] } = await chrome.storage.local.get(['hiringPosts']);

    const newPost = {
      id: Date.now().toString(),
      ...postData
    };

    hiringPosts.push(newPost);
    await chrome.storage.local.set({ hiringPosts });

    // Sync to Google Sheets "HiringPosts" tab (non-blocking)
    syncHiringPostToSheets(newPost).catch(err => {
      console.error('Failed to sync hiring post to sheets:', err);
    });

    return { success: true, post: newPost };
  } catch (error) {
    console.error('Error saving hiring post:', error);
    return { success: false, error: error.message };
  }
}

// Sync hiring post to Google Sheets
async function syncHiringPostToSheets(postData) {
  const { googleSheets } = await chrome.storage.local.get(['googleSheets']);
  if (!googleSheets?.spreadsheetId) {
    throw new Error('Google Sheets not configured');
  }

  const tokenResponse = await getGoogleAuthToken();
  if (!tokenResponse.success) {
    throw new Error('Failed to get auth token');
  }

  const values = [[
    postData.timestamp || new Date().toISOString(),
    'LinkedIn',
    postData.author || '',
    postData.company || '',
    (postData.emails && postData.emails.join(', ')) || '',
    postData.location || '',
    postData.jobTitle || '',
    postData.postUrl || '',
    postData.followSent ? 'Yes' : 'No',
    postData.postText || ''
  ]];

  const sheetName = 'HiringPosts';
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${googleSheets.spreadsheetId}/values/${sheetName}!A1:J:append?valueInputOption=RAW&majorDimension=ROWS`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenResponse.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ values })
    }
  );

  if (!response.ok) {
    throw new Error(`Google Sheets API error: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

// Sync to Google Sheets
async function syncToGoogleSheets(appData) {
  const { googleSheets } = await chrome.storage.local.get(['googleSheets']);
  if (!googleSheets?.spreadsheetId) {
    throw new Error('Google Sheets not configured');
  }

  const tokenResponse = await getGoogleAuthToken();
  if (!tokenResponse.success) {
    throw new Error('Failed to get auth token');
  }

  const values = [[
    appData.date,
    appData.platform,
    appData.title,
    appData.company,
    appData.location || '',
    appData.jobUrl,
    appData.matchScore || '',
    appData.status,
    appData.resumeUsed || '',
    appData.notes || '',
    appData.followUpDate || ''
  ]];

  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${googleSheets.spreadsheetId}/values/Sheet1:append?valueInputOption=RAW`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenResponse.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ values })
    }
  );

  if (!response.ok) {
    throw new Error(`Google Sheets API error: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

// Inactivity timer
function resetInactivityTimer() {
  if (inactivityTimer) {
    clearTimeout(inactivityTimer);
  }
  inactivityTimer = setTimeout(async () => {
    const { settings } = await chrome.storage.local.get(['settings']);
    if (settings?.autoLockEnabled) {
      await chrome.storage.session.set({ locked: true });
    }
  }, INACTIVITY_TIMEOUT);
}

// Check follow-ups alarm
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'checkFollowUps') {
    const { applications = [] } = await chrome.storage.local.get(['applications']);
    const today = new Date().toISOString().split('T')[0];

    const dueFollowUps = applications.filter(app =>
      app.followUpDate && app.followUpDate === today && app.status !== 'Rejected'
    );

    if (dueFollowUps.length > 0) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'assets/icons/icon128.png',
        title: 'Follow-ups Due',
        message: `You have ${dueFollowUps.length} follow-up(s) due today`,
        priority: 2
      });
    }
  }

  // Auto-discovery alarm
  if (alarm.name === 'autoDiscovery') {
    await startDiscovery();
  }
});

// Start job discovery
async function startDiscovery() {
  try {
    const { profile } = await chrome.storage.local.get(['profile']);
    if (!profile) {
      console.log('Discovery skipped: no profile');
      return { success: false, error: 'Profile not set up' };
    }

    // Import discovery service dynamically
    const { discoverJobs, checkForNewJobs, notifyNewJobs } = await import('src/services/discovery.js');
    const result = await discoverJobs(profile);
    const allJobs = result.platforms.flatMap(p => p.jobs);
    const newJobs = await checkForNewJobs(allJobs);

    if (newJobs.length > 0) {
      notifyNewJobs(newJobs, result.totalFound);
    }

    // Store discovery results
    await chrome.storage.session.set({
      discoveryResults: allJobs,
      discoveryTimestamp: result.timestamp
    });

    return { success: true, totalFound: result.totalFound, newJobs: newJobs.length };
  } catch (error) {
    console.error('Discovery error:', error);
    return { success: false, error: error.message };
  }
}
