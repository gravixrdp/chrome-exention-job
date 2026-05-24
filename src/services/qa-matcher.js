// Q&A Similarity Matcher — Keyword Overlap + AI Fallback

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been',
  'do', 'does', 'did', 'will', 'would', 'can', 'could', 'may', 'might',
  'i', 'you', 'we', 'they', 'it', 'this', 'that', 'these', 'those',
  'my', 'your', 'our', 'their', 'its', 'not', 'but', 'or', 'and',
  'if', 'so', 'to', 'in', 'on', 'at', 'for', 'of', 'with', 'by',
  'from', 'up', 'about', 'into', 'through', 'during', 'before',
  'after', 'please', 'briefly', 'kindly'
]);

/**
 * Tokenize text into meaningful words
 */
function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w));
}

/**
 * Jaccard similarity between two sets of words.
 * Returns 0-1 score.
 */
function jaccardSimilarity(setA, setB) {
  if (!setA.size && !setB.size) return 1;
  if (!setA.size || !setB.size) return 0;
  const intersection = new Set([...setA].filter(w => setB.has(w)));
  const union = new Set([...setA, ...setB]);
  return intersection.size / union.size;
}

/**
 * Calculate keyword overlap score between a form question and a saved Q&A question.
 * Returns { score, match }: 0-1 similarity score + boolean for quick threshold
 */
function keywordSimilarity(questionA, questionB) {
  const tokensA = tokenize(questionA);
  const tokensB = tokenize(questionB);
  const setA = new Set(tokensA);
  const setB = new Set(tokensB);
  return jaccardSimilarity(setA, setB);
}

/**
 * Find the best matching Q&A from the bank for a given question text.
 * Returns { qa, score } or null if no match above threshold.
 */
export function findSimilarQA(qaBank, questionText, minScore = 0.4) {
  if (!qaBank || !questionText) return null;

  let bestMatch = null;
  let bestScore = 0;

  for (const qa of qaBank) {
    // Exact match — priority
    if (questionText.toLowerCase() === qa.question.toLowerCase()) {
      return { qa, score: 1.0 };
    }

    // Substring match — high priority
    const qaLower = qa.question.toLowerCase();
    const questionLower = questionText.toLowerCase();
    if (qaLower.includes(questionLower) || questionLower.includes(qaLower)) {
      return { qa, score: 0.9 };
    }

    // Keyword overlap
    const score = keywordSimilarity(questionText, qa.question);
    if (score > bestScore) {
      bestScore = score;
      bestMatch = qa;
    }
  }

  if (bestScore >= minScore && bestMatch?.answer) {
    return { qa: bestMatch, score: bestScore };
  }
  return null;
}

/**
 * AI semantic similarity fallback.
 * Asks AI provider to compare two questions and return similarity 0-100.
 * Tries excloud first if configured, falls back to OpenRouter, then null.
 * Returns similarity score or null on error.
 */
export async function getSemanticSimilarity(questionA, questionB, aiConfig) {
  // Try providers in order: excloud → openrouter
  const providers = [];
  if (aiConfig?.excloudApiKey) providers.push('excloud');
  if (aiConfig?.apiKey) providers.push('openrouter');
  if (!providers.length) return null;

  for (const providerId of providers) {
    try {
      const score = await getProviderSimilarity(providerId, questionA, questionB, aiConfig);
      if (score !== null) return score;
    } catch (error) {
      console.warn(`AI similarity ${providerId} failed:`, error);
      // Try next provider
    }
  }
  return null;
}

function getProviderSimilarity(providerId, questionA, questionB, aiConfig) {
  const isExcloud = providerId === 'excloud';
  const apiKey = isExcloud ? aiConfig.excloudApiKey : aiConfig.apiKey;

  if (isExcloud) {
    return getExcloudSimilarity(questionA, questionB, apiKey);
  }
  return getOpenRouterSimilarity(questionA, questionB, apiKey);
}

function getOpenRouterSimilarity(questionA, questionB, apiKey) {
  return new Promise((resolve, reject) => {
    fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': chrome.runtime.getURL('popup/popup.html')
      },
      body: JSON.stringify({
        model: 'mistralai/mistral-7b-instruct:free',
        messages: [
          {
            role: 'system',
            content: 'You are a semantic similarity checker. Given two job application questions, output only a number between 0 and 100 representing how similar they are in meaning. Output only the number, nothing else.'
          },
          {
            role: 'user',
            content: `Question A: "${questionA}"\nQuestion B: "${questionB}"\nSimilarity score (0-100):`
          }
        ],
        max_tokens: 5
      })
    })
      .then(res => res.json())
      .then(data => {
        const text = data?.choices?.[0]?.message?.content || '';
        const parsed = parseFloat(text);
        resolve(isNaN(parsed) ? null : parsed);
      })
      .catch(reject);
  });
}

function getExcloudSimilarity(questionA, questionB, apiKey) {
  return new Promise((resolve, reject) => {
    fetch('https://llm.excloud.dev/v1/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'Qwen/Qwen3.6-27B:excloud',
        messages: [
          {
            role: 'system',
            content: 'You are a semantic similarity checker. Given two job application questions, output only a number between 0 and 100 representing how similar they are in meaning. Output only the number, nothing else.'
          },
          {
            role: 'user',
            content: `Question A: "${questionA}"\nQuestion B: "${questionB}"\nSimilarity score (0-100):`
          }
        ],
        max_tokens: 5
      })
    })
      .then(res => res.json())
      .then(data => {
        const text = extractAnthropicText(data);
        const parsed = parseFloat(text);
        resolve(isNaN(parsed) ? null : parsed);
      })
      .catch(reject);
  });
}

function extractAnthropicText(data) {
  for (const content of (data.content || [])) {
    if (content.type === 'text') return content.text;
  }
  return '';
}

/**
 * Smart Q&A lookup — keyword first, AI fallback if needed.
 * Returns { qa, source: 'keyword' | 'ai' } or null
 */
export async function smartQAMatch(qaBank, questionText, aiConfig) {
  if (!questionText || !qaBank) return null;

  // Step 1: Keyword overlap (fast, offline)
  const keywordMatch = findSimilarQA(qaBank, questionText, 0.4);
  if (keywordMatch && keywordMatch.score >= 0.5) {
    return { qa: keywordMatch.qa, source: 'keyword', score: keywordMatch.score };
  }

  // Step 2: AI semantic fallback for close misses
  if (aiConfig?.apiKey && keywordMatch && keywordMatch.score >= 0.2) {
    const aiScore = await getSemanticSimilarity(questionText, keywordMatch.qa.question, aiConfig);
    if (aiScore >= 75) {
      return { qa: keywordMatch.qa, source: 'ai', score: aiScore / 100 };
    }
  }

  // Step 3: Brute-force AI check against top-3 closest keyword matches
  if (aiConfig?.apiKey) {
    const scored = qaBank
      .filter(qa => qa.answer)
      .map(qa => ({ qa, score: keywordSimilarity(questionText, qa.question) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    for (const item of scored) {
      const aiScore = await getSemanticSimilarity(questionText, item.qa.question, aiConfig);
      if (aiScore >= 75) {
        return { qa: item.qa, source: 'ai', score: aiScore / 100 };
      }
    }
  }

  return null;
}
