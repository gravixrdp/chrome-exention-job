// Auto Job Discovery Service
// Periodically searches configured platforms and notifies user of new jobs

import { searchWithFallback } from './scraping.js';

// Discover jobs across all enabled platforms
export async function discoverJobs(profile) {
  const platforms = ['LinkedIn', 'Indeed', 'Naukri'];
  const allJobs = [];

  for (const platform of platforms) {
    try {
      const keywords = profile?.skills?.join(' ') || profile?.preferredRoles?.join(' ') || 'developer';
      const result = await searchWithFallback(platform, keywords, profile);
      if (result.success && result.jobs.length > 0) {
        allJobs.push({
          platform,
          provider: result.usedProvider,
          jobs: result.jobs
        });
      }
    } catch (error) {
      console.error(`Discovery failed for ${platform}:`, error);
    }
  }

  return {
    totalFound: allJobs.reduce((sum, p) => sum + p.jobs.length, 0),
    platforms: allJobs,
    timestamp: new Date().toISOString()
  };
}

// Check for new jobs against existing applications
export async function checkForNewJobs(detectedJobs) {
  const { applications = [] } = await chrome.storage.local.get(['applications']);
  const existingUrls = new Set(applications.map(app => app.jobUrl));

  const newJobs = detectedJobs.filter(job => !existingUrls.has(job.jobUrl));
  return newJobs;
}

// Notify user of new jobs found
export function notifyNewJobs(newJobs, total) {
  if (newJobs.length === 0) return;

  const platforms = [...new Set(newJobs.map(j => j.platform))];

  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'assets/icons/icon128.png',
    title: `🔍 ${newJobs.length} New Jobs Found!`,
    message: `${platforms.join(', ')} — ${total} total jobs discovered`,
    priority: 2
  });

  // Store discovery results
  chrome.storage.session.set({
    discoveryResults: newJobs,
    discoveryTimestamp: new Date().toISOString()
  });
}

// Get last discovery info
export async function getDiscoveryInfo() {
  const { discoveryResults, discoveryTimestamp } = await chrome.storage.session.get(['discoveryResults', 'discoveryTimestamp']);
  return {
    results: discoveryResults || [],
    timestamp: discoveryTimestamp || null,
    hasResults: !!discoveryTimestamp
  };
}
