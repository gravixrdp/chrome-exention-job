// LinkedIn Hiring Post Detector — Smart & Advanced
// Auto-detects hiring posts on ANY LinkedIn page, extracts emails, highlights posts, saves to storage

const HIRING_KEYWORDS = [
  'hiring', 'we are hiring', 'were hiring', 'we\'re hiring', 'hiring!',
  'looking for', 'join our team', 'join us', 'we\'re looking',
  'recruiting', 'open position', 'career opportunity',
  'send resume', 'apply now', 'interested candidates',
  'walk-in', 'freshers welcome', 'we need', 'we are seeking'
];

const SKIPPED_KEYWORDS = [
  'job alert', 'career page', 'view all jobs', 'apply on linkedin',
  'tap to apply', 'hiring manager', 'hiring process'
];

let processedPosts = new Set();
let foundPosts = [];
let statusBadge = null;
let observer = null;

function init() {
  if (!isLinkedInPage(window.location.href)) return;
  injectBadge();
  scanFeed();
  startObserver();
}

function isLinkedInPage(url) {
  return url.includes('linkedin.com');
}

function injectBadge() {
  if (statusBadge) statusBadge.remove();

  statusBadge = document.createElement('div');
  statusBadge.id = 'hiring-detector-badge';
  statusBadge.style.cssText = `
    position: fixed; bottom: 20px; left: 20px; z-index: 100000;
    background: #000;
    color: white; padding: 14px 20px; border-radius: 12px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.25);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px; font-weight: 600;
    display: flex; flex-direction: column; gap: 6px;
    max-width: 320px;
  `;
  statusBadge.innerHTML = `
    <div style="display:flex; align-items:center; gap:8px;">
      <span style="font-size:16px;">📌</span>
      <span>Hiring Post Detector</span>
    </div>
    <div id="hiring-badge-status" style="font-size:12px; opacity:0.85;">
      🔍 Scanning for hiring posts...
    </div>
  `;
  document.body.appendChild(statusBadge);
}

function updateBadge(text) {
  const el = document.getElementById('hiring-badge-status');
  if (el) el.textContent = text;
}

function isHiringPost(text) {
  const lower = text.toLowerCase();
  const hasHiring = HIRING_KEYWORDS.some(kw => lower.includes(kw.toLowerCase()));
  const hasSkipped = SKIPPED_KEYWORDS.some(kw => lower.includes(kw.toLowerCase()));
  return hasHiring && !hasSkipped;
}

function extractEmails(text) {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  return [...new Set((text.match(emailRegex) || []))];
}

function extractPhone(text) {
  const phonePatterns = [
    /(?:whatsapp|phone|contact|call)[:\s]*(\+?\d[\d\s-]{7,14})/gi,
    /(\+?[\d]{10,15})/g,
    /(\d{3}[-\s]?\d{3}[-\s]?\d{4})/g
  ];
  for (const pattern of phonePatterns) {
    const match = text.match(pattern);
    if (match) return match[0].replace(/[:\s]/g, '').trim();
  }
  return '';
}

function extractLocation(text) {
  const patterns = [
    /(?:location[:\s]+|based in\s+|in\s+|at\s+)([A-Za-z\s&,.-]{2,40})(?:\s*[,\.]|$)/i,
    /(?:city)[:\s]+([A-Za-z\s&]{2,30})/i
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1].trim();
  }
  return '';
}

function extractJobTitle(text) {
  const patterns = [
    /(?:hiring|looking for|need|we are hiring|we're hiring)\s+(?:a\s+|an\s+)?['"]?([A-Za-z\s&.#|'-]{3,60})?['"]?\s*(?:\s*(?:position|role|for|in|to|as|job|engineer|developer))/i,
    /(?:hiring|we are hiring|we're hiring)\s+(?:a\s+|an\s+)?(['"—–-]*[A-Za-z\s&.#'-]{3,60}['"—–-]*)/i
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      let title = match[1] || match[0].replace(/(?:hiring|we are hiring|we're hiring|looking for|need)/gi, '').trim();
      title = title.replace(/^['"–—-]+|['"–—-]+$/g, '').trim();
      if (title.length > 2) return title;
    }
  }
  return '';
}

function extractSalary(text) {
  const salaryPatterns = [
    /(?:salary|pay|compensation|ctc|package)[:\s]+(?:up to\s+)?([\d\s,.]+(?:\s*(?:lpa|LPA|per annum|pa|PA|month|monthly))?\s*)(?:[-—–]\s*([\d\s,.]+(?:\s*(?:lpa|LPA|per annum|pa|PA|month|monthly))?\s*))/gi,
    /([\d.,]+)\s*(?:-|to)\s*([\d.,]+)\s*(?:lpa|LPA|k|K|thousand|thou)/gi,
    /(?:₹|inr|Rs\.?)[\s:]*([\d,.]+)\s*(?:-|to)\s*([\d,.]+)\s*(?:k|K|lakh|L|lpa|LPA|per\s+month|pm|per\s+annum|pa)/gi
  ];
  for (const pattern of salaryPatterns) {
    const match = text.match(pattern);
    if (match) {
      const min = match[1]?.trim() || '';
      const max = match[2]?.trim() || '';
      return min + (max ? ` - ${max}` : '');
    }
  }
  return '';
}

function extractPostData(article) {
  try {
    // Find the main text element — try multiple selectors for reliability
    const textEl = article.querySelector('div[dir="auto"]') ||
                   article.querySelector('[data-artdeco-entity]') ||
                   article.querySelector('.update-components-content-container') ||
                   article.querySelector('div.update-components-text');
    if (!textEl) return null;

    const fullText = textEl.textContent;
    if (!fullText || fullText.trim().length < 20) return null;
    if (!isHiringPost(fullText)) return null;

    // Extract author info
    const authorEl = article.querySelector('a[data-view-name="profile-identity-url"]');
    const authorName = authorEl?.textContent?.trim() ||
                       article.querySelector('.actor-name a span')?.textContent?.trim() || '';
    const authorUrl = authorEl?.href || '';

    // Extract company
    const company = extractCompany(article);

    // Extract all details
    const emails = extractEmails(fullText);
    const phone = extractPhone(fullText);
    const location = extractLocation(fullText);
    const jobTitle = extractJobTitle(fullText);
    const salary = extractSalary(fullText);

    // Post URL
    const postLink = article.querySelector('a[data-linkedin-post-id]') ||
                     article.querySelector('a[data-artdeco-link]');
    const postUrl = postLink?.href || '';

    return {
      author: authorName,
      authorUrl,
      company: company || 'Unknown',
      emails,
      phone: phone || '',
      location: location || '',
      jobTitle: jobTitle || '',
      salary: salary || '',
      postUrl,
      postText: fullText.substring(0, 1000),
      timestamp: new Date().toISOString()
    };
  } catch (e) {
    return null;
  }
}

function extractCompany(article) {
  const companyLink = article.querySelector('a[data-view-name="profile-identity-url"] img')?.parentElement;
  return companyLink?.querySelector('span')?.textContent?.trim() ||
         article.querySelector('a[class*="actor-author__company"]')?.textContent?.trim() ||
         article.querySelector('a[href*="company"]')?.textContent?.trim() ||
         '';
}

function highlightPost(article, data) {
  const container = findPostContainer(article);
  if (!container || container.querySelector('[data-hiring-highlighted]')) return;

  container.setAttribute('data-hiring-highlighted', 'true');

  // Add highlight border
  container.style.border = '2px solid #000';
  container.style.backgroundColor = '#f5f5f5';
  container.style.borderRadius = '12px';
  container.style.transition = 'all 0.3s ease';

  // Insert hiring badge
  const badge = document.createElement('div');
  badge.style.cssText = `
    background: #000; color: white; padding: 8px 14px;
    border-radius: 8px; font-size: 12px; font-weight: 600;
    margin-top: 10px; display: inline-block;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;

  const details = [];
  if (data.jobTitle) details.push(`🔹 ${data.jobTitle}`);
  if (data.company !== 'Unknown') details.push(`🏢 ${data.company}`);
  if (data.emails.length > 0) details.push(`📧 ${data.emails.join(', ')}`);
  if (data.phone) details.push(`📞 ${data.phone}`);
  if (data.location) details.push(`📍 ${data.location}`);
  if (data.salary) details.push(`💰 ${data.salary}`);

  badge.textContent = `✅ Hiring Post${details.length > 0 ? ' — ' + details.join(' | ') : ''}`;

  const textArea = container.querySelector('div[dir="auto"]') ||
                   container.querySelector('.update-components-text') ||
                   container;
  textArea.appendChild(badge);
}

function findPostContainer(article) {
  return article.closest('[data-urn]') ||
         article.closest('[data-update-id]') ||
         article.closest('article') ||
         article;
}

async function processPost(article) {
  // Get unique post ID
  const urn = article.querySelector('[data-urn]')?.getAttribute('data-urn');
  const postId = urn || article.querySelector('a[data-linkedin-post-id]')?.getAttribute('data-linkedin-post-id') ||
                 article.querySelector('[data-update-id]')?.getAttribute('data-update-id') ||
                 article.querySelector('a[data-artdeco-link]')?.getAttribute('data-linkedin-post-id');

  if (!postId || processedPosts.has(postId)) return;

  const data = extractPostData(article);
  if (!data) return;

  processedPosts.add(postId);
  foundPosts.push(data);

  // Highlight the post
  highlightPost(article, data);

  // Auto-save to extension storage
  await saveToStorage(data);

  // Update badge with all found posts summary
  const totalEmails = foundPosts.reduce((sum, p) => sum + p.emails.length, 0);
  updateBadge(`📌 ${foundPosts.length} hiring post(s) found · ${totalEmails} email(s)`);

  // Show Chrome notification
  chrome.runtime.sendMessage({
    action: 'hiringPostFound',
    data: {
      ...data,
      totalFound: foundPosts.length,
      totalEmails
    }
  });
}

async function saveToStorage(data) {
  try {
    await chrome.runtime.sendMessage({
      action: 'saveHiringPost',
      data: {
        ...data,
        status: 'Found',
        followSent: false
      }
    });
  } catch (error) {
    // Service worker might be inactive — store in session instead
    try {
      const existing = await chrome.storage.session.get(['hiringPosts']);
      const posts = existing.hiringPosts || [];
      posts.push(data);
      await chrome.storage.session.set({ hiringPosts: posts });
    } catch (e) {
      // Silent fail
    }
  }
}

function scanFeed() {
  // Try multiple selectors for different LinkedIn page layouts
  const selectors = [
    'div[data-urn]',
    'article',
    'div.update-components-content-container',
    '[data-update-id]',
    '[data-viewname="identity-detail"]',
    '.feed-unit-member-entity'
  ];

  let allArticles = [];
  const seen = new Set();

  for (const selector of selectors) {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => {
      const id = el.getAttribute('data-urn') || el.getAttribute('data-update-id') || el.outerHTML.substring(0, 50);
      if (!seen.has(id)) {
        seen.add(id);
        allArticles.push(el);
      }
    });
  }

  let found = false;
  allArticles.forEach(article => {
    processPost(article);
    found = true;
  });

  if (!found) {
    updateBadge('🔍 Scanning...');
  }
}

function startObserver() {
  if (observer) observer.disconnect();

  observer = new MutationObserver((mutations) => {
    let hasChanges = false;
    for (const mutation of mutations) {
      if (mutation.addedNodes.length > 0) {
        hasChanges = true;
        break;
      }
    }
    if (hasChanges) {
      scanFeed();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Periodic scan for new posts (infinite scroll)
  setInterval(() => {
    scanFeed();
  }, 5000);
}

// Listen for messages from background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'scanForHiring') {
    scanFeed();
    sendResponse({
      success: true,
      posts: foundPosts.length,
      emails: foundPosts.reduce((s, p) => s + p.emails.length, 0)
    });
  }
  return false;
});

// Initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
