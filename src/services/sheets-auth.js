// Google Sheets Authentication — OAuth & Service Account JWT

const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const SHEETS_SCOPE = 'https://www.googleapis.com/auth/spreadsheets';

/**
 * Strip PEM header/footer and newlines, return raw base64 content
 */
export function cleanPemKey(pem) {
  return pem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s/g, '');
}

/**
 * Build a JWT signed with the service account private key
 */
export async function createJwt(clientEmail, privateKey) {
  const now = Math.floor(Date.now() / 1000);
  const raw = cleanPemKey(privateKey);
  const binary = Uint8Array.from(atob(raw), c => c.charCodeAt(0));
  const key = await crypto.subtle.importKey(
    'pkcs8',
    binary,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({
    iss: clientEmail,
    scope: SHEETS_SCOPE,
    aud: TOKEN_ENDPOINT,
    exp: now + 3600,
    iat: now
  }));

  const toSign = header + '.' + payload.replace(/=+$/, '');
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(toSign));
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  return toSign + '.' + sigB64;
}

/**
 * Exchange JWT for a Google access token
 */
export async function exchangeJwtForToken(jwt) {
  const res = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=' + encodeURIComponent(jwt)
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token exchange failed: ${res.status} ${text}`);
  }
  const data = await res.json();
  return data.access_token;
}

/**
 * Get an access token for a service account JSON string or object
 */
export async function getServiceAccountToken(serviceAccountInput) {
  const sa = typeof serviceAccountInput === 'string'
    ? JSON.parse(serviceAccountInput)
    : serviceAccountInput;
  const jwt = await createJwt(sa.client_email, sa.private_key);
  return await exchangeJwtForToken(jwt);
}

/**
 * Get token based on configured auth method.
 * Used from popup scripts (chrome.runtime.sendMessage is available).
 * Returns { token, method: 'oauth' | 'service-account' }
 */
export async function getSheetsToken(authMethod, serviceAccountJson) {
  if (authMethod === 'service-account' && serviceAccountJson) {
    const token = await getServiceAccountToken(serviceAccountJson);
    return { token, method: 'service-account' };
  }
  // Default: Chrome OAuth — message to background
  const response = await chrome.runtime.sendMessage({ action: 'getAuthToken' });
  if (!response.success) throw new Error(response.error || 'OAuth token failed');
  return { token: response.token, method: 'oauth' };
}
