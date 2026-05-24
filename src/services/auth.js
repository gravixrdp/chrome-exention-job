// Authentication and Password Management Service

const SALT_KEY = 'SJAAS_SALT_V1';

async function getSalt() {
  const { salt } = await chrome.storage.local.get(['salt']);
  if (salt) return salt;
  // Generate a random salt and persist it
  const array = new Uint32Array(8);
  crypto.getRandomValues(array);
  const newSalt = Array.from(array, b => b.toString(36).padStart(8, '0')).join('');
  await chrome.storage.local.set({ salt: newSalt });
  return newSalt;
}

async function hashPassword(password) {
  const salt = await getSalt();
  const encoder = new TextEncoder();
  const data = encoder.encode(SALT_KEY + salt + password);
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
  return locked !== false;
}

export async function lockApp() {
  await chrome.storage.session.set({ locked: true });
}

export function resetInactivityTimer() {
  chrome.runtime.sendMessage({ action: 'resetInactivityTimer' });
}
