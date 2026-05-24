// LinkedIn Hiring Post Detector
// Detects hiring posts, extracts emails, follows authors, saves to Google Sheets

import { extractEmails } from '../src/services/hiring-post.js';

const HIRING_KEYWORDS = [
  'hiring', 'we are hiring', 'were hiring', 'we\'re hiring',
  'looking for', 'join our team', 'join us', 'we\'re looking',
  'recruiting', 'open position', 'career opportunity',
  'send resume', 'apply now', 'interested candidates',
  'walk-in', 'freshers welcome', 'experienced'
];

const SKIPPED_KEYWORDS = [
  'job alert', 'career page', 'view all jobs', 'apply on linkedin',
  'tap to apply'
];

let processedPosts = new Set();
let statusBadge = null;

function init() {
  const url = window.location.href;
  if (!isFeedPage(url) && !isPostPage(url)) return;

  injectBadge();
  scanFeed();
  observePage();
}

function isFeedPage(url) {
  return url.includes('linkedin.com/feed') ||
         url.includes('linkedin.com/feed/update') ||
         url.includes('linkedin.com/posts-');
}

function isPostPage(url) {
  return url.includes('linkedin.com/feed/update') ||
         url.includes('linkedin.com/posts-');
}

function injectBadge() {
  if (statusBadge) statusBadge.remove();

  statusBadge = document.createElement('div');
  statusBadge.id = 'hiring-detector-badge';
  statusBadge.style.cssText = `
    position: fixed; bottom: 20px; left: 20px; z-index: 10000;
    background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
    color: white; padding: 12px 18px; border-radius: 10px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 13px; font-weight: 600;
  `;
  statusBadge.textContent = '🔍 Scanning for hiring posts...';
  document.body.appendChild(statusBadge);
}

function updateBadge(text) {
  if (statusBadge) statusBadge.textContent = text;
}

function isHiringPost(text) {
  const lower = text.toLowerCase();
  const hasHiring = HIRING_KEYWORDS.some(kw => lower.includes(kw));
  const hasSkipped = SKIPPED_KEYWORDS.some(kw => lower.includes(kw));
  return hasHiring && !hasSkipped;
}

function extractPostData(article) {
  try {
    const textEl = article.querySelector('div[dir="auto"], div[data-artdeco-entity], [data-hovercard] ~ div');
    if (!textEl) return null;

    const fullText = textEl.textContent;
    if (!isHiringPost(fullText)) return null;

    // Extract author
    const authorLink = article.querySelector('a[data-view-name="profile-identity-url"]');
    const authorName = article.querySelector('a[data-view-name="profile-identity-url"] span')?.textContent?.trim() || '';
    const authorUrl = authorLink?.href || '';

    // Extract company
    const companyLink = article.querySelector('a[data-view-name="profile-identity-url"] img')?.parentElement;
    const company = companyLink?.querySelector('span')?.textContent?.trim() ||
                    article.querySelector('a[class*="actor-author__company"]')?.textContent?.trim() || '';

    // Extract emails
    const emails = extractEmails(fullText);

    // Extract location hints
    const location = extractLocation(fullText);

    // Extract job title
    const jobTitle = extractJobTitle(fullText);

    // Post URL
    const postUrl = article.querySelector('a[data-linkedin-post-id]')?.href ||
                    article.querySelector('a[data-artdeco-link]')?.href || '';

    return {
      author: authorName,
      authorUrl,
      company: company || 'Unknown',
      emails,
      location: location || '',
      jobTitle: jobTitle || '',
      postUrl,
      postText: fullText.substring(0, 500),
      timestamp: new Date().toISOString()
    };
  } catch (e) {
    console.error('Error extracting post data:', e);
    return null;
  }
}

function extractLocation(text) {
  const cityRegex = /(?:in |at |location[:\s]+|based in )([a-zA-Z\s,]{2,30})/gi;
  const match = text.match(cityRegex);
  return match ? match[0].replace(/^(in |at |location[:\s]+|based in )/, '').trim() : '';
}

function extractJobTitle(text) {
  const patterns = [
    /(?:looking for|need|hiring|role[:\s]+)([a-zA-Z\s&]{3,50})(?:\b(?:position|role|member|join))/i,
    /(?:hiring|looking for|need)\s+([a-zA-Z\s&]{3,50}?)(?:\s+(?:for|in|to))/i
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1].trim();
  }
  return '';
}

function highlightPost(article, data) {
  // Add green border to hiring post
  const container = article.closest('[data-urn]') || article;
  if (container) {
    container.style.border = '2px solid #28a745';
    container.style.backgroundColor = '#f0fff4';
    container.style.borderRadius = '8px';
    container.style.transition = 'all 0.3s ease';

    // Insert a hiring badge
    const badge = document.createElement('div');
    badge.id = 'hiring-badge';
    badge.style.cssText = `
      background: #28a745; color: white; padding: 6px 12px;
      border-radius: 6px; font-size: 12px; font-weight: 600;
      margin-top: 8px; display: inline-block;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
    badge.textContent = `📧 Hiring Post — Emails: ${data.emails.join(', ') || 'N/A'}`;

    const textArea = container.querySelector('div[dir="auto"]');
    if (textArea) {
      textArea.appendChild(badge);
    }
  }
}

async function followAuthor(authorUrl) {
  // Find the "Follow" or "Connect" button and click it
  const followBtn = document.querySelector(`a[href="${authorUrl.split('?')[0]}"] ~ div a`) ||
                    document.querySelector('[aria-label*="Follow"], [aria-label*="Connect"]');

  if (followBtn) {
    followBtn.click();
    return true;
  }

  // Fallback: navigate to author page and follow
  const followLink = document.querySelector(`a[href*="${authorUrl}"]`);
  if (followLink) {
    // Try to find follow button near the author link
    const parent = followLink.closest('div');
    if (parent) {
      const btn = parent.querySelector('a[href*="follow"], a[href*="connect"]');
      if (btn) btn.click();
    }
  }
  return false;
}

async function saveToSheets(data) {
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'saveHiringPost',
      data: {
        ...data,
        status: 'Found',
        followSent: false
      }
    });
    return response;
  } catch (error) {
    console.error('Error saving hiring post:', error);
    return { success: false };
  }
}

async function processPost(article) {
  const postId = article.querySelector('[data-urn]')?.getAttribute('data-urn') ||
                 article.querySelector('a[data-linkedin-post-id]')?.getAttribute('data-linkedin-post-id');
  if (!postId || processedPosts.has(postId)) return;

  const data = extractPostData(article);
  if (!data) return;

  processedPosts.add(postId);

  // Highlight the post
  highlightPost(article, data);

  // Try to follow author
  if (data.authorUrl) {
    await followAuthor(data.authorUrl);
    data.followSent = true;
  }

  // Save to Google Sheets
  await saveToSheets(data);

  // Update badge
  const count = processedPosts.size;
  updateBadge(`📌 ${count} hiring post(s) found · ${data.emails.length} email(s)`);

  // Show notification
  chrome.runtime.sendMessage({
    action: 'hiringPostFound',
    data
  });
}

function scanFeed() {
  const articles = document.querySelectorAll('div[data-urn], article, div.update-components-content-container');
  let count = 0;

  articles.forEach(article => {
    processPost(article).then(() => {
      count++;
    });
  });

  if (count === 0) {
    // Try alternative selector
    const posts = document.querySelectorAll('[data-update-id]');
    posts.forEach(article => processPost(article));

    if (posts.length === 0) {
      updateBadge('🔍 Scanning...');
    }
  }
}

function observePage() {
  const observer = new MutationObserver(() => {
    scanFeed();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Periodic scan for infinite scroll
  setInterval(() => {
    scanFeed();
  }, 5000);
}

// Listen for messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'scanForHiring') {
    scanFeed();
    sendResponse({ success: true });
  }
  return false;
});

// Initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
