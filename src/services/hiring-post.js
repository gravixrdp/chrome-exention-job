// Hiring Post Service — Email extraction and post analysis

/**
 * Extract email addresses from text using regex.
 * Handles standard emails, names@domain patterns, and common typos.
 */
export function extractEmails(text) {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const matches = text.match(emailRegex);
  return matches ? [...new Set(matches)] : [];
}

/**
 * Classify a hiring post by source type.
 */
export function classifyPostSource(text) {
  const lower = text.toLowerCase();
  if (lower.includes('hr ') || lower.includes('human resources') || lower.includes('recruiter')) {
    return 'HR/Recruiter';
  }
  if (lower.includes('ceo') || lower.includes('cto') || lower.includes('founder') || lower.includes('head of')) {
    return 'Company Leader';
  }
  if (lower.includes('we are hiring') || lower.includes('we\'re hiring') || lower.includes('join our team')) {
    return 'Company Post';
  }
  return 'Individual Post';
}
