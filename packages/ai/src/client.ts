import OpenAI from 'openai'

const apiKey = process.env['OPENAI_API_KEY']
if (!apiKey) throw new Error('OPENAI_API_KEY environment variable is required')

export const openai = new OpenAI({
  apiKey,
  maxRetries: 0, // manual retry handled in guardrails/validate-output.ts
  timeout: 30_000,
})

export const AI_MODELS = {
  default: process.env['OPENAI_MODEL_DEFAULT'] ?? 'gpt-4o-mini',
  premium: process.env['OPENAI_MODEL_PREMIUM'] ?? 'gpt-4o',
} as const
