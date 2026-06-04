// MIMO answers in ~4-8s and occasionally spikes past 6s; with the model name
// fixed it is the primary, so give it room before falling through to OpenAI.
// Only /optimize hits the LLM now (user-initiated, spinner-covered), so the
// generous timeout never blocks the live "reflex" loop.
const DEFAULT_TIMEOUT_MS = 10000

export async function explainOptimization({ suggestion, reasons, toasts }) {
  const fallbackText = reasons.length
    ? reasons.slice(0, 3).join(' ')
    : suggestion

  const prompt = [
    'Bạn là Vinpearl Journey Concierge.',
    'Tóm tắt kết quả optimize live thành 1-2 câu tiếng Việt tự nhiên.',
    'Chỉ giải thích từ reasons/toasts đã cho. Không thay đổi timeline, không thêm số liệu.',
    '',
    `Suggestion: ${suggestion}`,
    `Reasons: ${JSON.stringify(reasons)}`,
    `Toasts: ${JSON.stringify(toasts)}`,
  ].join('\n')

  const result = await callFirstAvailableProvider(prompt, {
    fallbackText,
    maxTokens: 180,
  })

  return {
    text: result.text || fallbackText,
    provider: result.provider,
  }
}

async function callFirstAvailableProvider(prompt, { fallbackText, maxTokens }) {
  const providers = [
    createMimoProvider(),
    createOpenAiProvider(),
    createOpenRouterProvider(),
  ].filter(Boolean)

  for (const provider of providers) {
    try {
      const text = await callOpenAiCompatible(provider, prompt, maxTokens)
      if (text) return { provider: provider.name, text }
    } catch (error) {
      console.warn(`[live-agent] ${provider.name} failed: ${error.message}`)
    }
  }

  return { provider: 'fallback', text: fallbackText }
}

function createMimoProvider() {
  if (!process.env.MIMO_API_KEY) return null
  const baseUrl = process.env.MIMO_BASE_URL || 'https://api.mimo.run/v1'
  return {
    name: 'mimo',
    apiKey: process.env.MIMO_API_KEY,
    url: `${trimSlash(baseUrl)}/chat/completions`,
    model: process.env.MIMO_MODEL || 'mimo-v2.5-pro',
  }
}

function createOpenAiProvider() {
  if (!process.env.OPENAI_API_KEY) return null
  return {
    name: 'openai',
    apiKey: process.env.OPENAI_API_KEY,
    url: 'https://api.openai.com/v1/chat/completions',
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  }
}

function createOpenRouterProvider() {
  if (!process.env.OPENROUTER_API_KEY) return null
  return {
    name: 'openrouter',
    apiKey: process.env.OPENROUTER_API_KEY,
    url: 'https://openrouter.ai/api/v1/chat/completions',
    model: process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini',
    extraHeaders: {
      'HTTP-Referer': 'http://localhost:5173',
      'X-Title': 'Vinpearl Journey Concierge',
    },
  }
}

async function callOpenAiCompatible(provider, prompt, maxTokens) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS)

  try {
    const response = await fetch(provider.url, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${provider.apiKey}`,
        ...(provider.extraHeaders || {}),
      },
      body: JSON.stringify({
        model: provider.model,
        temperature: 0.2,
        max_tokens: maxTokens,
        messages: [
          {
            role: 'system',
            content: 'You only rewrite natural language. You never compute or modify itinerary decisions.',
          },
          { role: 'user', content: prompt },
        ],
      }),
    })

    if (!response.ok) {
      const body = await response.text()
      throw new Error(`HTTP ${response.status}: ${body.slice(0, 200)}`)
    }

    const payload = await response.json()
    return payload.choices?.[0]?.message?.content?.trim() || ''
  } finally {
    clearTimeout(timeout)
  }
}

function trimSlash(value) {
  return value.replace(/\/+$/, '')
}
