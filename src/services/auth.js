// Authentication and Password Management Service

// Simple hash function for password (using SubtleCrypto)
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function setupPassword(password) {
  const hashedPassword = await hashPassword(password);
  await chrome.storage.local.set({
    passwordHash: hashedPassword,
    isSetup: true
  });
  await chrome.storage.session.set({ locked: false });
  return true;
}

export async function verifyPassword(password) {
  const { passwordHash } = await chrome.storage.local.get(['passwordHash']);
  const hashedInput = await hashPassword(password);
  
  if (hashedInput === passwordHash) {
    await chrome.storage.session.set({ locked: false });
    // Reset inactivity timer
    chrome.runtime.sendMessage({ action: 'resetInactivityTimer' });
    return true;
  }
  return false;
}

export async function changePassword(currentPassword, newPassword) {
  const isValid = await verifyPassword(currentPassword);
  if (!isValid) {
    throw new Error('Current password is incorrect');
  }
  
  const hashedPassword = await hashPassword(newPassword);
  await chrome.storage.local.set({ passwordHash: hashedPassword });
  return true;
}

export async function isPasswordSetup() {
  const { isSetup } = await chrome.storage.local.get(['isSetup']);
  return !!isSetup;
}

export async function isLocked() {
  const { locked } = await chrome.storage.session.get(['locked']);
  return locked !== false; // Default to locked
}

export async function lockApp() {
  await chrome.storage.session.set({ locked: true });
}

export function resetInactivityTimer() {
  chrome.runtime.sendMessage({ action: 'resetInactivityTimer' });
}
