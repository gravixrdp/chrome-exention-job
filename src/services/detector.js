// Job Detection Service

export function detectPlatform(url) {
  if (url.includes('linkedin.com')) return 'LinkedIn';
  if (url.includes('indeed.com')) return 'Indeed';
  if (url.includes('naukri.com')) return 'Naukri';
  return null;
}

export function isJobPage(url, platform) {
  switch (platform) {
    case 'LinkedIn':
      return url.includes('/jobs/view/') || url.includes('/jobs/collections/');
    case 'Indeed':
      return url.includes('/viewjob') || url.includes('/rc/clk');
    case 'Naukri':
      return url.includes('/job-listings-') || url.includes('/jobs-in-');
    default:
      return false;
  }
}

export function isSearchPage(url) {
  if (url.includes('linkedin.com/jobs/search')) return 'LinkedIn';
  if (url.includes('indeed.com/jobs')) return 'Indeed';
  if (url.includes('naukri.com/jobs')) return 'Naukri';
  return null;
}

// LinkedIn job detail extraction
export function extractLinkedInJobData() {
  try {
    const title = document.querySelector('.job-details-jobs-unified-top-card__job-title')?.textContent?.trim() ||
                  document.querySelector('.jobs-unified-top-card__job-title')?.textContent?.trim() ||
                  document.querySelector('h1.t-24')?.textContent?.trim();

    const company = document.querySelector('.job-details-jobs-unified-top-card__company-name')?.textContent?.trim() ||
                    document.querySelector('.jobs-unified-top-card__company-name')?.textContent?.trim() ||
                    document.querySelector('.jobs-unified-top-card__subtitle-primary-grouping a')?.textContent?.trim();

    const location = document.querySelector('.job-details-jobs-unified-top-card__bullet')?.textContent?.trim() ||
                     document.querySelector('.jobs-unified-top-card__bullet')?.textContent?.trim();

    const description = document.querySelector('.jobs-description')?.textContent?.trim() ||
                        document.querySelector('.jobs-description__content')?.textContent?.trim();

    const salary = document.querySelector('.job-details-jobs-unified-top-card__job-insight--highlight')?.textContent?.trim();

    let experience = null;
    const expMatch = description?.match(/(\d+)\+?\s*years?/i);
    if (expMatch) {
      experience = expMatch[0];
    }

    return {
      title: title || 'Unknown',
      company: company || 'Unknown',
      location: location || '',
      salary: salary || '',
      experience: experience || '',
      description: description || '',
      jobUrl: window.location.href,
      platform: 'LinkedIn',
      postedDate: ''
    };
  } catch (error) {
    console.error('Error extracting LinkedIn job data:', error);
    return null;
  }
}

// Indeed job detail extraction
export function extractIndeedJobData() {
  try {
    const title = document.querySelector('.jobsearch-JobInfoHeader-title')?.textContent?.trim() ||
                  document.querySelector('h1[class*="jobTitle"]')?.textContent?.trim();

    const company = document.querySelector('[data-testid="inlineHeader-companyName"]')?.textContent?.trim() ||
                    document.querySelector('.jobsearch-InlineCompanyRating-companyHeader')?.textContent?.trim();

    const location = document.querySelector('[data-testid="inlineHeader-companyLocation"]')?.textContent?.trim() ||
                     document.querySelector('.jobsearch-JobInfoHeader-subtitle div')?.textContent?.trim();

    const description = document.querySelector('#jobDescriptionText')?.textContent?.trim() ||
                        document.querySelector('.jobsearch-JobComponent-description')?.textContent?.trim();

    const salary = document.querySelector('.jobsearch-JobMetadataHeader-item')?.textContent?.trim();

    let experience = null;
    const expMatch = description?.match(/(\d+)\+?\s*years?/i);
    if (expMatch) {
      experience = expMatch[0];
    }

    return {
      title: title || 'Unknown',
      company: company || 'Unknown',
      location: location || '',
      salary: salary || '',
      experience: experience || '',
      description: description || '',
      jobUrl: window.location.href,
      platform: 'Indeed',
      postedDate: ''
    };
  } catch (error) {
    console.error('Error extracting Indeed job data:', error);
    return null;
  }
}

// Naukri job detail extraction
export function extractNaukriJobData() {
  try {
    const title = document.querySelector('.jd-header-title')?.textContent?.trim() ||
                  document.querySelector('h1.title')?.textContent?.trim();

    const company = document.querySelector('.jd-header-comp-name')?.textContent?.trim() ||
                    document.querySelector('.comp-name a')?.textContent?.trim();

    const location = document.querySelector('.location')?.textContent?.trim() ||
                     document.querySelector('.jd-location')?.textContent?.trim();

    const description = document.querySelector('.dang-inner-html')?.textContent?.trim() ||
                        document.querySelector('.job-desc')?.textContent?.trim();

    const salary = document.querySelector('.salary')?.textContent?.trim() ||
                   document.querySelector('.jd-salary')?.textContent?.trim();

    const experience = document.querySelector('.exp')?.textContent?.trim() ||
                       document.querySelector('.jd-exp')?.textContent?.trim();

    return {
      title: title || 'Unknown',
      company: company || 'Unknown',
      location: location || '',
      salary: salary || '',
      experience: experience || '',
      description: description || '',
      jobUrl: window.location.href,
      platform: 'Naukri',
      postedDate: ''
    };
  } catch (error) {
    console.error('Error extracting Naukri job data:', error);
    return null;
  }
}

// --- Search Result Card Extraction ---
// These extract mini-job-data from search result cards (not detail pages)

export function extractJobCardFromLinkedIn(card) {
  try {
    const title = card.querySelector('.job-card-container__title')?.textContent?.trim();
    const company = card.querySelector('.job-card-container__company-name')?.textContent?.trim();
    const location = card.querySelector('.job-card-container__listitem')?.textContent?.trim();
    const link = card.querySelector('a[data-tracking-id]')?.href;
    if (!title) return null;
    return {
      title, company: company || 'Unknown', location: location || '',
      jobUrl: link || '', platform: 'LinkedIn'
    };
  } catch (e) { return null; }
}

export function extractJobCardFromIndeed(card) {
  try {
    const title = card.querySelector('.jobcard-title')?.textContent?.trim();
    const company = card.querySelector('.jc-company-name')?.textContent?.trim();
    const location = card.querySelector('.joblocation-wrapper')?.textContent?.trim();
    const link = card.querySelector('a[jobcard]')?.href;
    if (!title) return null;
    return {
      title, company: company || 'Unknown', location: location || '',
      jobUrl: link || '', platform: 'Indeed'
    };
  } catch (e) { return null; }
}

export function extractJobCardFromNaukri(card) {
  try {
    const title = card.querySelector('.srp-job-title')?.textContent?.trim();
    const company = card.querySelector('.srp-comp-name')?.textContent?.trim();
    const location = card.querySelector('.srp-location')?.textContent?.trim();
    const link = card.querySelector('.srp-job-title a')?.href;
    if (!title) return null;
    return {
      title, company: company || 'Unknown', location: location || '',
      jobUrl: link || '', platform: 'Naukri'
    };
  } catch (e) { return null; }
}
