// Google Sheets Integration Service

export async function connectGoogleSheets(spreadsheetId) {
  try {
    // Get auth token
    const response = await chrome.runtime.sendMessage({ action: 'getAuthToken' });
    if (!response.success) {
      throw new Error(response.error || 'Failed to get auth token');
    }
    
    // Verify spreadsheet access
    const sheetResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`,
      {
        headers: {
          'Authorization': `Bearer ${response.token}`
        }
      }
    );
    
    if (!sheetResponse.ok) {
      throw new Error('Cannot access spreadsheet. Check spreadsheet ID and sharing permissions.');
    }
    
    const sheetData = await sheetResponse.json();
    
    // Save config
    await chrome.storage.local.set({
      googleSheets: {
        connected: true,
        spreadsheetId,
        spreadsheetName: sheetData.properties.title,
        connectedAt: new Date().toISOString()
      }
    });
    
    // Initialize sheet headers if needed
    await initializeSheetHeaders(spreadsheetId, response.token);
    
    return { success: true, spreadsheetName: sheetData.properties.title };
  } catch (error) {
    console.error('Error connecting to Google Sheets:', error);
    throw error;
  }
}

async function initializeSheetHeaders(spreadsheetId, token) {
  try {
    // Check if headers exist
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A1:K1`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    const data = await response.json();
    
    // If no headers, add them
    if (!data.values || data.values.length === 0) {
      const headers = [[
        'Date',
        'Platform',
        'Job Title',
        'Company',
        'Location',
        'Job URL',
        'Match Score',
        'Status',
        'Resume Used',
        'Notes',
        'Follow-up Date'
      ]];
      
      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A1:K1?valueInputOption=RAW`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ values: headers })
        }
      );
    }
  } catch (error) {
    console.error('Error initializing sheet headers:', error);
  }
}

export async function disconnectGoogleSheets() {
  try {
    await chrome.runtime.sendMessage({ action: 'revokeAuthToken' });
    await chrome.storage.local.remove('googleSheets');
    return { success: true };
  } catch (error) {
    console.error('Error disconnecting Google Sheets:', error);
    throw error;
  }
}

export async function checkDuplicateInSheets(jobData) {
  try {
    const { googleSheets } = await chrome.storage.local.get(['googleSheets']);
    if (!googleSheets?.connected) {
      return { isDuplicate: false, error: 'Google Sheets not connected' };
    }
    
    const response = await chrome.runtime.sendMessage({ action: 'getAuthToken' });
    if (!response.success) {
      throw new Error('Failed to get auth token');
    }
    
    // Get all data from sheet
    const sheetResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${googleSheets.spreadsheetId}/values/Sheet1`,
      {
        headers: {
          'Authorization': `Bearer ${response.token}`
        }
      }
    );
    
    const sheetData = await sheetResponse.json();
    if (!sheetData.values || sheetData.values.length <= 1) {
      return { isDuplicate: false };
    }
    
    // Skip header row
    const rows = sheetData.values.slice(1);
    
    // Check for duplicates
    for (const row of rows) {
      const [date, platform, title, company, location, jobUrl] = row;
      
      // Check by URL
      if (jobUrl === jobData.jobUrl) {
        return {
          isDuplicate: true,
          reason: 'Already applied to this job (same URL)',
          date
        };
      }
      
      // Check by company + title + location
      if (company?.toLowerCase() === jobData.company?.toLowerCase() &&
          title?.toLowerCase() === jobData.title?.toLowerCase() &&
          location?.toLowerCase() === jobData.location?.toLowerCase()) {
        return {
          isDuplicate: true,
          reason: 'Similar job already applied',
          date
        };
      }
    }
    
    return { isDuplicate: false };
  } catch (error) {
    console.error('Error checking duplicate in sheets:', error);
    return { isDuplicate: false, error: error.message };
  }
}

export async function getGoogleSheetsStatus() {
  const { googleSheets } = await chrome.storage.local.get(['googleSheets']);
  return googleSheets || { connected: false };
}
