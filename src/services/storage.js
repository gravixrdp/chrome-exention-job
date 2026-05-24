// Chrome Storage Service Wrapper

export async function saveProfile(profile) {
  await chrome.storage.local.set({ profile });
  return profile;
}

export async function getProfile() {
  const { profile } = await chrome.storage.local.get(['profile']);
  return profile || null;
}

export async function saveResumes(resumes) {
  await chrome.storage.local.set({ resumes });
  return resumes;
}

export async function getResumes() {
  const { resumes } = await chrome.storage.local.get(['resumes']);
  return resumes || [];
}

export async function saveQABank(qaBank) {
  await chrome.storage.local.set({ qaBank });
  return qaBank;
}

export async function getQABank() {
  const { qaBank } = await chrome.storage.local.get(['qaBank']);
  return qaBank || getDefaultQABank();
}

function getDefaultQABank() {
  return [
    { question: 'Tell me about yourself', answer: '' },
    { question: 'Why should we hire you?', answer: '' },
    { question: 'Current CTC', answer: '' },
    { question: 'Expected CTC', answer: '' },
    { question: 'Notice period', answer: '' },
    { question: 'Are you willing to relocate?', answer: '' },
    { question: 'Work authorization', answer: '' },
    { question: 'Years of experience', answer: '' },
    { question: 'Relevant skills', answer: '' },
    { question: 'Current company', answer: '' },
    { question: 'Availability', answer: '' },
    { question: 'Preferred location', answer: '' },
    { question: 'Remote/hybrid/onsite preference', answer: '' },
    { question: 'Reason for job change', answer: '' }
  ];
}

export async function saveFilters(filters) {
  await chrome.storage.local.set({ filters });
  return filters;
}

export async function getFilters() {
  const { filters } = await chrome.storage.local.get(['filters']);
  return filters || {
    keywords: [],
    excludedKeywords: [],
    minSalary: null,
    experienceRange: { min: null, max: null },
    locations: [],
    workMode: [],
    companyBlacklist: [],
    companyWhitelist: [],
    minMatchScore: 60
  };
}

export async function getApplications() {
  const { applications } = await chrome.storage.local.get(['applications']);
  return applications || [];
}

export async function updateApplication(id, updates) {
  const applications = await getApplications();
  const index = applications.findIndex(app => app.id === id);
  if (index !== -1) {
    applications[index] = { ...applications[index], ...updates };
    await chrome.storage.local.set({ applications });
    return applications[index];
  }
  throw new Error('Application not found');
}

export async function deleteApplication(id) {
  const applications = await getApplications();
  const filtered = applications.filter(app => app.id !== id);
  await chrome.storage.local.set({ applications: filtered });
  return true;
}

export async function saveSettings(settings) {
  await chrome.storage.local.set({ settings });
  return settings;
}

export async function getSettings() {
  const { settings } = await chrome.storage.local.get(['settings']);
  return settings || {
    autoLockEnabled: true,
    inactivityTimeout: 15,
    notifications: true,
    minMatchScore: 60
  };
}

export async function saveGoogleSheetsConfig(config) {
  await chrome.storage.local.set({ googleSheets: config });
  return config;
}

export async function getGoogleSheetsConfig() {
  const { googleSheets } = await chrome.storage.local.get(['googleSheets']);
  return googleSheets || null;
}

export async function saveSheetsConfig(config) {
  await chrome.storage.local.set({ sheetsConfig: config });
  return config;
}

export async function getSheetsConfig() {
  const { sheetsConfig } = await chrome.storage.local.get(['sheetsConfig']);
  return sheetsConfig || {
    authMethod: 'oauth', // 'oauth' | 'service-account'
    serviceAccountJson: null,
    spreadsheetId: '',
    qaTabName: 'Q&A Bank',
    hiringPostsTabName: 'HiringPosts',
    applicationsTabName: 'Sheet1',
    lastSyncAt: null
  };
}

export async function saveAIConfig(config) {
  await chrome.storage.local.set({ aiConfig: config });
  return config;
}

export async function getAIConfig() {
  const { aiConfig } = await chrome.storage.local.get(['aiConfig']);
  return aiConfig || { enabled: false, apiKey: '', excloudApiKey: '' };
}

// --- Discovery Config ---

export async function saveDiscoveryConfig(config) {
  await chrome.storage.local.set({ discoveryConfig: config });
  return config;
}

export async function getDiscoveryConfig() {
  const { discoveryConfig } = await chrome.storage.local.get(['discoveryConfig']);
  return discoveryConfig || {
    enabled: false,
    intervalMinutes: 0, // 0 = on-demand only
    platforms: ['LinkedIn', 'Indeed', 'Naukri']
  };
}

// --- Auto Apply Pipeline Config ---

export async function saveAutoApplyConfig(config) {
  await chrome.storage.local.set({ autoApplyConfig: config });
  return config;
}

export async function getAutoApplyConfig() {
  const { autoApplyConfig } = await chrome.storage.local.get(['autoApplyConfig']);
  return autoApplyConfig || {
    enabled: false,
    platform: 'LinkedIn', // 'LinkedIn' | 'Indeed' | 'Naukri'
    jobsPerSession: 10,
    minMatchScore: 60,
    delayBetweenJobs: 10, // seconds
    autoOpenTab: true,
    closeTabAfterApply: false
  };
}

// --- Scroll Detected Jobs ---

export async function getScrollDetectedJobs() {
  const { scrollDetectedJobs } = await chrome.storage.session.get(['scrollDetectedJobs']);
  return scrollDetectedJobs || [];
}

export async function saveScrollDetectedJobs(jobs) {
  await chrome.storage.session.set({ scrollDetectedJobs: jobs });
  return jobs;
}
