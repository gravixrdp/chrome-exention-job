// AI Providers — OpenRouter & Excloud

export const AI_PROVIDERS = {
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    endpoint: '/chat/completions',
    format: 'openai',
    defaultModel: 'mistralai/mistral-7b-instruct:free'
  },
  excloud: {
    id: 'excloud',
    name: 'Excloud',
    baseUrl: 'https://llm.excloud.dev',
    endpoint: '/v1/messages',
    format: 'anthropic',
    defaultModel: 'Qwen/Qwen3.6-27B:excloud'
  }
};

/**
 * Send a chat completion request to the specified AI provider.
 * Returns the response text or null on error.
 */
export async function sendToProvider(providerId, messages, maxTokens, apiKey) {
  const provider = AI_PROVIDERS[providerId];
  if (!provider) throw new Error(`Unknown AI provider: ${providerId}`);

  const headers = { 'Content-Type': 'application/json' };
  if (provider.format === 'openai') {
    headers['Authorization'] = `Bearer ${apiKey}`;
    headers['HTTP-Referer'] = chrome.runtime.getURL('popup/popup.html');
  } else {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  const body = provider.format === 'openai'
    ? { model: provider.defaultModel, messages, max_tokens: maxTokens || 1024 }
    : { model: provider.defaultModel, messages, max_tokens: maxTokens || 1024 };

  const res = await fetch(`${provider.baseUrl}${provider.endpoint}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${provider.name} API error: ${res.status} ${text}`);
  }

  const data = await res.json();

  if (provider.format === 'openai') {
    return data?.choices?.[0]?.message?.content || '';
  }
  // Anthropic format
  return extractAnthropicText(data);
}

function extractAnthropicText(data) {
  for (const content of (data.content || [])) {
    if (content.type === 'text') return content.text;
  }
  return '';
}
