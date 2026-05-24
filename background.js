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

  chrome.alarms.create('checkFollowUps', { periodInMinutes: 60 });
});

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'jobDetected') {
    handleJobDetected(request.data);
    return false; // Don't keep channel open
  } else if (request.action === 'checkDuplicate') {
    checkDuplicate(request.data).then(sendResponse);
    return true;
  } else if (request.action === 'saveApplication') {
    saveApplication(request.data).then(sendResponse);
    return true;
  } else if (request.action === 'getAuthToken') {
    getGoogleAuthToken().then(sendResponse);
    return true;
  } else if (request.action === 'revokeAuthToken') {
    revokeGoogleAuthToken().then(sendResponse);
    return true;
  } else if (request.action === 'resetInactivityTimer') {
    resetInactivityTimer();
    return false;
  }
});

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
});
