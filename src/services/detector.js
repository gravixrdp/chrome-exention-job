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
    
    // Try to extract experience from description
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
