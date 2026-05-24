// Auto-Scroll Content Script for Search Result Pages
// Injected on LinkedIn / Indeed / Naukri search result pages

import { detectPlatform, isSearchPage, extractJobCardFromLinkedIn, extractJobCardFromIndeed, extractJobCardFromNaukri } from '../src/services/detector.js';

const SCROLL_STEP = 800;
const SCROLL_DELAY = 600;
const INITIAL_LOAD_DELAY = 1500;

let isScrolling = false;
let detectedJobs = [];
let scrollCounter = null;
let badgeElement = null;
let controlBar = null;

function init() {
  const url = window.location.href;
  if (!isSearchPage(url)) return;

  // Wait for page to load, then start scrolling
  setTimeout(() => {
    injectControlBar();
    startAutoScroll();
  }, INITIAL_LOAD_DELAY);
}

function getExtractFn(platform) {
  switch (platform) {
    case 'LinkedIn': return extractJobCardFromLinkedIn;
    case 'Indeed': return extractJobCardFromIndeed;
    case 'Naukri': return extractJobCardFromNaukri;
    default: return null;
  }
}

function injectControlBar() {
  if (controlBar) controlBar.remove();
  if (badgeElement) badgeElement.remove();

  controlBar = document.createElement('div');
  controlBar.id = 'auto-scroll-controls';
  controlBar.style.cssText = `
    position: fixed; bottom: 20px; right: 20px; z-index: 10000;
    display: flex; gap: 8px; align-items: center;
  `;

  const countBadge = document.createElement('span');
  countBadge.id = 'scroll-job-count';
  countBadge.style.cssText = `
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white; padding: 10px 16px; border-radius: 8px;
    font-size: 13px; font-weight: 600;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    display: flex; align-items: center; gap: 6px;
  `;
  countBadge.textContent = '🔍 0 jobs found';

  const statusBtn = document.createElement('button');
  statusBtn.id = 'scroll-status-btn';
  statusBtn.style.cssText = `
    background: #28a745; color: white; padding: 10px 14px;
    border: none; border-radius: 8px; font-size: 13px; font-weight: 600;
    cursor: pointer;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  `;
  statusBtn.textContent = '⏸ Pause';

  const stopBtn = document.createElement('button');
  stopBtn.id = 'scroll-stop-btn';
  stopBtn.style.cssText = `
    background: #dc3545; color: white; padding: 10px 14px;
    border: none; border-radius: 8px; font-size: 13px; font-weight: 600;
    cursor: pointer;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  `;
  stopBtn.textContent = '⏹ Stop';

  controlBar.appendChild(countBadge);
  controlBar.appendChild(statusBtn);
  controlBar.appendChild(stopBtn);
  document.body.appendChild(controlBar);

  statusBtn.addEventListener('click', toggleScroll);
  stopBtn.addEventListener('click', stopScroll);
}

function startAutoScroll() {
  const platform = detectPlatform(window.location.href);
  const extractFn = getExtractFn(platform);
  if (!extractFn) return;

  isScrolling = true;

  // Set scroll limit from settings
  const scrollLimit = 50;

  scrollCounter = setInterval(() => {
    if (!isScrolling) return;

    const currentScroll = window.scrollY;
    const maxScroll = document.body.scrollHeight - window.innerHeight;

    if (currentScroll < maxScroll) {
      window.scrollTo(0, currentScroll + SCROLL_STEP);
      // Check for new jobs after scrolling
      setTimeout(() => scanForJobs(extractFn, scrollLimit), SCROLL_DELAY);
    } else {
      // Reached bottom — wait a bit then check again (infinite scroll reload)
      if (detectedJobs.length >= scrollLimit) {
        stopScroll();
        notifyComplete();
      }
    }

    updateBadge();
  }, SCROLL_DELAY);
}

function scanForJobs(extractFn, scrollLimit) {
  if (detectedJobs.length >= scrollLimit) return;

  const allText = document.body.innerHTML;
  const cards = document.querySelectorAll('li[data-entity-id], .jobcard, .srp-job-card, [data-oc-click-title]');

  const seenUrls = new Set(detectedJobs.map(j => j.jobUrl));
  let newCount = 0;

  cards.forEach(card => {
    const jobData = extractFn(card);
    if (jobData && jobData.jobUrl && !seenUrls.has(jobData.jobUrl)) {
      detectedJobs.push(jobData);
      seenUrls.add(jobData.jobUrl);
      newCount++;
    }
  });

  if (newCount > 0) {
    saveToSession();
    notifyBackground(newCount);
  }
}

function toggleScroll() {
  isScrolling = !isScrolling;
  const btn = document.getElementById('scroll-status-btn');
  if (btn) {
    btn.textContent = isScrolling ? '⏸ Pause' : '▶ Resume';
    btn.style.background = isScrolling ? '#28a745' : '#ffc107';
  }
}

function stopScroll() {
  isScrolling = false;
  clearInterval(scrollCounter);
  notifyComplete();
  saveToSession();
}

function updateBadge() {
  const badge = document.getElementById('scroll-job-count');
  if (badge) {
    badge.textContent = `🔍 ${detectedJobs.length} jobs found`;
  }
}

function saveToSession() {
  chrome.storage.session.set({ scrollDetectedJobs: detectedJobs });
}

function notifyBackground(newCount) {
  chrome.runtime.sendMessage({
    action: 'scrollJobsFound',
    data: { count: detectedJobs.length, newCount, jobs: detectedJobs }
  });
}

function notifyComplete() {
  const btn = document.getElementById('scroll-status-btn');
  if (btn) {
    btn.textContent = '✅ Done';
    btn.style.background = '#17a2b8';
    btn.style.display = 'none';
  }
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'startScroll') {
    startAutoScroll();
    sendResponse({ success: true });
  } else if (request.action === 'getDetectedJobs') {
    sendResponse({ jobs: detectedJobs });
  } else if (request.action === 'stopScroll') {
    stopScroll();
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
