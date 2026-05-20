// Naukri Content Script

import { detectPlatform, isJobPage, extractNaukriJobData } from '../src/services/detector.js';

let currentJobData = null;
let detectorButton = null;

function init() {
  const url = window.location.href;
  const platform = detectPlatform(url);
  
  if (platform === 'Naukri' && isJobPage(url, platform)) {
    detectJob();
    observePageChanges();
  }
}

function detectJob() {
  currentJobData = extractNaukriJobData();
  
  if (currentJobData && currentJobData.title !== 'Unknown') {
    injectDetectorButton();
    notifyBackground();
  }
}

function injectDetectorButton() {
  if (detectorButton) {
    detectorButton.remove();
  }
  
  detectorButton = document.createElement('div');
  detectorButton.id = 'job-detector-button';
  detectorButton.innerHTML = `
    <div style="
      position: fixed;
      top: 100px;
      right: 20px;
      z-index: 10000;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 15px 20px;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      cursor: pointer;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      font-weight: 600;
      transition: all 0.3s ease;
    " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
      <div style="display: flex; align-items: center; gap: 8px;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 11l3 3L22 4"></path>
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
        </svg>
        <span>Job Detected</span>
      </div>
      <div style="font-size: 12px; margin-top: 4px; opacity: 0.9;">
        Click to analyze & apply
      </div>
    </div>
  `;
  
  detectorButton.addEventListener('click', openExtensionPopup);
  document.body.appendChild(detectorButton);
}

function openExtensionPopup() {
  chrome.storage.session.set({ currentJob: currentJobData });
  chrome.runtime.sendMessage({ 
    action: 'jobDetected',
    data: currentJobData 
  });
  showNotification('Job data captured! Open extension to continue.');
}

function showNotification(message) {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #4CAF50;
    color: white;
    padding: 15px 20px;
    border-radius: 8px;
    z-index: 10001;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    animation: slideIn 0.3s ease;
  `;
  notification.textContent = message;
  document.body.appendChild(notification);
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

function notifyBackground() {
  chrome.runtime.sendMessage({
    action: 'jobDetected',
    data: currentJobData
  });
}

function observePageChanges() {
  let lastUrl = window.location.href;
  const observer = new MutationObserver(() => {
    const currentUrl = window.location.href;
    if (currentUrl !== lastUrl) {
      lastUrl = currentUrl;
      if (isJobPage(currentUrl, 'Naukri')) {
        setTimeout(detectJob, 1000);
      } else {
        if (detectorButton) {
          detectorButton.remove();
          detectorButton = null;
        }
      }
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getCurrentJob') {
    sendResponse({ job: currentJobData });
  } else if (request.action === 'autofillForm') {
    import('../src/services/autofill.js').then(module => {
      const { AutofillEngine } = module;
      const engine = new AutofillEngine(
        request.profile,
        request.qaBank,
        request.selectedResume
      );
      const filled = engine.autofill();
      sendResponse({ success: true, filledFields: filled.length });
    });
    return true;
  }
});

const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(400px); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(400px); opacity: 0; }
  }
`;
document.head.appendChild(style);

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
