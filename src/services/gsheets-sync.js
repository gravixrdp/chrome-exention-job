// Google Sheets Bidirectional Sync — Q&A, Hiring Posts, Applications
import { getSheetsConfig, saveSheetsConfig, getQABank, saveQABank } from './storage.js';
import { getSheetsToken, getServiceAccountToken } from './sheets-auth.js';

const DEFAULT_QA_HEADERS = ['Question', 'Answer', 'Category'];
const DEFAULT_HIRING_HEADERS = ['Date', 'Platform', 'Author', 'Company', 'Emails', 'Location', 'Job Title', 'Post URL', 'Follow Status', 'Post Text'];
const DEFAULT_APPLICANTS_HEADERS = ['Date', 'Platform', 'Job Title', 'Company', 'Location', 'Job URL', 'Match Score', 'Status', 'Resume Used', 'Notes', 'Follow-up Date'];

/**
 * Fetch all rows from a sheet tab
 */
async function getSheetRows(spreadsheetId, tabName, token) {
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${tabName}!A:Z`,
    { headers: { 'Authorization': `Bearer ${token}` } }
  );
  if (!res.ok) throw new Error(`Sheets read failed: ${res.status}`);
  const data = await res.json();
  return data.values || [];
}

/**
 * Write rows to a sheet tab (overwrite from A1)
 */
async function setSheetRows(spreadsheetId, tabName, rows, token) {
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${tabName}!A:Z?valueInputOption=RAW`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ values: rows })
    }
  );
  if (!res.ok) throw new Error(`Sheets write failed: ${res.status}`);
  return await res.json();
}

/**
 * Ensure a tab exists with headers. Create it if missing.
 */
async function ensureTabExists(spreadsheetId, tabName, headers, token) {
  try {
    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${tabName}!A1`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    if (res.ok) return true; // Tab exists
  } catch (_) { /* Tab might not exist */ }

  // Create tab via batchUpdate
  const metadataRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`,
    { headers: { 'Authorization': `Bearer ${token}` } }
  );
  const metadata = await metadataRes.json();
  const existingIds = (metadata.sheets || []).map(s => s.properties?.sheetId);

  // Check if tab already exists by name
  const tabAlreadyExists = (metadata.sheets || []).some(s => s.properties?.title === tabName);
  if (tabAlreadyExists) return true;

  // Create the tab
  const createRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        requests: [
          {
            addSheet: {
              properties: { title: tabName }
            }
          },
          {
            updateValues: {
              range: `${tabName}!A1`,
              majorDimension: 'ROWS',
              values: [headers]
            }
          }
        ]
      })
    }
  );
  if (!createRes.ok) throw new Error(`Failed to create tab ${tabName}: ${createRes.status}`);
  return true;
}

/**
 * Get an access token from current config
 */
async function getToken() {
  const config = await getSheetsConfig();
  if (!config?.spreadsheetId) throw new Error('Spreadsheet not configured');
  return getSheetsToken(config.authMethod, config.serviceAccountJson);
}

// --- Q&A Sync ---

/**
 * Load Q&A from Google Sheets → replace local bank
 */
export async function loadQAFromSheets() {
  try {
    const config = await getSheetsConfig();
    const { spreadsheetId, qaTabName } = config;
    if (!spreadsheetId) throw new Error('Spreadsheet not configured');

    const { token } = await getToken();
    await ensureTabExists(spreadsheetId, qaTabName, DEFAULT_QA_HEADERS, token);

    const rows = await getSheetRows(spreadsheetId, qaTabName, token);
    if (rows.length <= 1) return []; // Only header or empty

    const headers = rows[0];
    const questionIdx = headers.indexOf('Question');
    const answerIdx = headers.indexOf('Answer');
    if (questionIdx === -1) throw new Error('No "Question" column in Q&A tab');

    const qaBank = rows.slice(1).filter(r => r[questionIdx]?.trim()).map(row => ({
      question: row[questionIdx] || '',
      answer: answerIdx !== -1 ? (row[answerIdx] || '') : ''
    }));

    await saveQABank(qaBank);
    await saveSheetsConfig({ ...config, lastSyncAt: new Date().toISOString() });
    return qaBank;
  } catch (error) {
    console.error('Load Q&A from Sheets failed:', error);
    throw error;
  }
}

/**
 * Push local Q&A bank to Google Sheets
 */
export async function saveQAToSheets() {
  try {
    const config = await getSheetsConfig();
    const { spreadsheetId, qaTabName } = config;
    if (!spreadsheetId) throw new Error('Spreadsheet not configured');

    const { token } = await getToken();
    await ensureTabExists(spreadsheetId, qaTabName, DEFAULT_QA_HEADERS, token);

    const qaBank = await getQABank();
    const rows = [
      DEFAULT_QA_HEADERS,
      ...qaBank.map(qa => [qa.question, qa.answer, ''])
    ];

    await setSheetRows(spreadsheetId, qaTabName, rows, token);
    await saveSheetsConfig({ ...config, lastSyncAt: new Date().toISOString() });
    return { success: true, count: qaBank.length };
  } catch (error) {
    console.error('Save Q&A to Sheets failed:', error);
    throw error;
  }
}

// --- Sheet Initialization ---

/**
 * Ensure all required tabs exist in the spreadsheet
 */
export async function initSheetsTabs() {
  try {
    const config = await getSheetsConfig();
    const { spreadsheetId } = config;
    if (!spreadsheetId) throw new Error('Spreadsheet not configured');

    const { token } = await getToken();
    await ensureTabExists(spreadsheetId, config.qaTabName || 'Q&A Bank', DEFAULT_QA_HEADERS, token);
    await ensureTabExists(spreadsheetId, config.hiringPostsTabName || 'HiringPosts', DEFAULT_HIRING_HEADERS, token);
    await ensureTabExists(spreadsheetId, config.applicationsTabName || 'Sheet1', DEFAULT_APPLICANTS_HEADERS, token);

    return { success: true };
  } catch (error) {
    console.error('Init sheet tabs failed:', error);
    throw error;
  }
}
