import OpenAI from 'openai'

export const AI_MODELS = {
  default: process.env['OPENAI_MODEL_DEFAULT'] ?? 'gpt-4o-mini',
  premium: process.env['OPENAI_MODEL_PREMIUM'] ?? 'gpt-4o',
} as const

let _client: OpenAI | null = null

// Lazily initialized so dotenv can load before OPENAI_API_KEY is read
export function getOpenAIClient(): OpenAI {
  if (!_client) {
    const apiKey = process.env['OPENAI_API_KEY']
    if (!apiKey) throw new Error('OPENAI_API_KEY environment variable is required')
    _client = new OpenAI({ apiKey, maxRetries: 0, timeout: 30_000 })
  }
  return _client
}
