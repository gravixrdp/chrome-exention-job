// Scraping API Service — Multi-provider with automatic fallback

import PROVIDERS from './providers.js';

// Default provider list shown in settings
const DEFAULT_PROVIDERS = [
  { id: 'firecrawl', name: 'Firecrawl', apiKey: '', enabled: false, priority: 1, lastError: null, lastErrorAt: null },
  { id: 'scrapingbee', name: 'ScrapingBee', apiKey: '', enabled: false, priority: 2, lastError: null, lastErrorAt: null },
  { id: 'scrapedo', name: 'Scrape.do', apiKey: '', enabled: false, priority: 3, lastError: null, lastErrorAt: null },
  { id: 'apify', name: 'Apify', apiKey: '', enabled: false, priority: 4, lastError: null, lastErrorAt: null },
  { id: 'scrapingdog', name: 'ScrapingDog', apiKey: '', enabled: false, priority: 5, lastError: null, lastErrorAt: null },
];

// Get configured providers
export async function getProviders() {
  const { scrapingProviders } = await chrome.storage.local.get(['scrapingProviders']);
  return scrapingProviders || [];
}

// Save providers
export async function saveProviders(providers) {
  await chrome.storage.local.set({ scrapingProviders: providers });
  return providers;
}

// Initialize default providers if none exist
export async function initProviders() {
  const existing = await getProviders();
  if (existing.length === 0) {
    await saveProviders(DEFAULT_PROVIDERS);
  }
  return await getProviders();
}

// Test connection to a specific provider
export async function testConnection(providerId) {
  const config = PROVIDERS[providerId];
  if (!config) {
    return { success: false, error: 'Unknown provider' };
  }

  const providers = await getProviders();
  const provider = providers.find(p => p.id === providerId);
  if (!provider || !provider.apiKey) {
    return { success: false, error: 'No API key configured' };
  }

  try {
    const url = `${config.baseUrl}/health`;
    const headers = buildHeaders(config, provider.apiKey);

    const response = await fetch(url, {
      method: 'GET',
      headers
    });

    if (response.ok) {
      await updateProviderStatus(providerId, null);
      return { success: true, status: response.status };
    } else {
      const error = `HTTP ${response.status}`;
      await updateProviderStatus(providerId, error);
      return { success: false, error };
    }
  } catch (error) {
    await updateProviderStatus(providerId, error.message);
    return { success: false, error: error.message };
  }
}

// Scrape a URL using a specific provider
export async function scrapeUrl(providerId, url) {
  const config = PROVIDERS[providerId];
  const providers = await getProviders();
  const provider = providers.find(p => p.id === providerId);

  if (!provider || !provider.apiKey) {
    throw new Error(`${provider?.name || providerId} not configured`);
  }

  try {
    const headers = buildHeaders(config, provider.apiKey);
    let apiUrl;

    if (providerId === 'scrapingbee') {
      apiUrl = `${config.baseUrl}${config.endpoints.fetch}?url=${encodeURIComponent(url)}&render_all_images=false&timeout=30000&apikey=${provider.apiKey}`;
    } else if (providerId === 'firecrawl') {
      apiUrl = `${config.baseUrl}${config.endpoints.scrape}`;
    } else if (providerId === 'scrapedo') {
      apiUrl = `${config.baseUrl}${config.endpoints.scrape}`;
    } else if (providerId === 'apify') {
      apiUrl = `${config.baseUrl}/acts/${provider.apiKey}/call-sync`;
    } else if (providerId === 'scrapingdog') {
      apiUrl = `${config.baseUrl}${config.endpoints.scrape}?url=${encodeURIComponent(url)}&render_type=all`;
    } else {
      apiUrl = provider.baseUrl || url;
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        url,
        waitFor: 3000,
        onlyMainContent: providerId === 'firecrawl'
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    await updateProviderStatus(providerId, null);

    // Normalize response based on provider
    return normalizeResponse(data, providerId);
  } catch (error) {
    await updateProviderStatus(providerId, error.message);
    throw error;
  }
}

// Search for jobs using a specific provider
export async function searchJobs(providerId, platform, query, profile) {
  const searchUrl = buildSearchUrl(platform, query, profile);
  const html = await scrapeUrl(providerId, searchUrl);
  return parseSearchResults(html, platform);
}

// Search with automatic fallback to next provider
export async function searchWithFallback(platform, query, profile) {
  const providers = await getProviders();
  const enabled = providers
    .filter(p => p.enabled && p.apiKey)
    .sort((a, b) => a.priority - b.priority);

  if (enabled.length === 0) {
    return {
      success: false,
      error: 'No scraping providers configured. Go to Settings to add one.',
      jobs: []
    };
  }

  for (const provider of enabled) {
    try {
      const jobs = await searchJobs(provider.id, platform, query, profile);
      return { success: true, jobs, usedProvider: provider.name };
    } catch (error) {
      console.error(`Scraping failed for ${provider.name}:`, error.message);
      // Continue to next provider
    }
  }

  return {
    success: false,
    error: 'All scraping providers failed. Please check your API keys.',
    jobs: []
  };
}

// Build search URL based on platform and profile
function buildSearchUrl(platform, query, profile) {
  const keywords = query || profile?.skills?.join(' ') || 'developer';
  const location = profile?.preferredLocations?.[0] || '';
  const locParam = location ? `&location=${encodeURIComponent(location)}` : '';

  switch (platform) {
    case 'LinkedIn':
      return `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(keywords)}${locParam}`;
    case 'Indeed':
      return `https://www.indeed.com/jobs?q=${encodeURIComponent(keywords)}${location ? `&l=${encodeURIComponent(location)}` : ''}`;
    case 'Naukri':
      return `https://www.naukri.com/jobs${location ? `-${encodeURIComponent(location).replace(/%/g, '-')}-jobs` : ''}`;
    default:
      return `https://www.google.com/search?q=${encodeURIComponent(`site:linkedin.com/jobs ${keywords}`)}`;
  }
}

// Parse search results from HTML string
function parseSearchResults(html, platform) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  let jobs = [];

  switch (platform) {
    case 'LinkedIn':
      doc.querySelectorAll('.job-card-container').forEach(card => {
        const title = card.querySelector('.job-card-container__title')?.textContent?.trim();
        const company = card.querySelector('.job-card-container__company-name')?.textContent?.trim();
        const location = card.querySelector('.job-card-container__listitem')?.textContent?.trim();
        const link = card.querySelector('a[data-tracking-id]')?.href;
        if (title) {
          jobs.push({
            title,
            company: company || 'Unknown',
            location: location || '',
            jobUrl: link || '',
            platform: 'LinkedIn'
          });
        }
      });
      break;

    case 'Indeed':
      doc.querySelectorAll('.jobcard').forEach(card => {
        const title = card.querySelector('.jobcard-title')?.textContent?.trim();
        const company = card.querySelector('.jc-company-name')?.textContent?.trim();
        const location = card.querySelector('.joblocation-wrapper')?.textContent?.trim();
        const link = card.querySelector('a[jobcard]')?.href;
        if (title) {
          jobs.push({
            title,
            company: company || 'Unknown',
            location: location || '',
            jobUrl: link || '',
            platform: 'Indeed'
          });
        }
      });
      break;

    case 'Naukri':
      doc.querySelectorAll('.srp-job-card').forEach(card => {
        const title = card.querySelector('.srp-job-title')?.textContent?.trim();
        const company = card.querySelector('.srp-comp-name')?.textContent?.trim();
        const location = card.querySelector('.srp-location')?.textContent?.trim();
        const link = card.querySelector('.srp-job-title a')?.href;
        if (title) {
          jobs.push({
            title,
            company: company || 'Unknown',
            location: location || '',
            jobUrl: link || '',
            platform: 'Naukri'
          });
        }
      });
      break;
  }

  return jobs;
}

// Normalize response based on provider
function normalizeResponse(data, providerId) {
  if (providerId === 'firecrawl') {
    return data.markdown || data.html || data.content || '';
  }
  if (providerId === 'scrapingbee') {
    return data.content || '';
  }
  if (providerId === 'scrapedo') {
    return data.data?.html || data.data?.text || data.html || '';
  }
  if (providerId === 'apify') {
    return data.body?.body || data.body || '';
  }
  if (providerId === 'scrapingdog') {
    return data.body || data.content || '';
  }
  return data?.content || data?.html || JSON.stringify(data);
}

// Build HTTP headers for provider
function buildHeaders(config, apiKey) {
  const headers = { 'Content-Type': 'application/json' };
  if (config.headerPrefix) {
    headers[config.headerName] = `${config.headerPrefix} ${apiKey}`;
  } else {
    headers[config.headerName] = apiKey;
  }
  return headers;
}

// Update provider error status
async function updateProviderStatus(providerId, error) {
  const providers = await getProviders();
  const index = providers.findIndex(p => p.id === providerId);
  if (index !== -1) {
    providers[index].lastError = error;
    providers[index].lastErrorAt = new Date().toISOString();
    await saveProviders(providers);
  }
}
