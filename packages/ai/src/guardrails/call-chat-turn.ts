import type OpenAI from 'openai'
import { db, aiUsageLog } from '@athletiqlab/db'

import { getOpenAIClient, AI_MODELS } from '../client'

export interface CallChatTurnOptions {
  messages: OpenAI.Chat.ChatCompletionMessageParam[]
  personalId: string
  conversationId: string
  usePremium?: boolean
}

export interface ChatTurnResult {
  content: string
  inputTokens: number
  outputTokens: number
  latencyMs: number
  model: string
}

const MODEL_COSTS: Record<string, [number, number]> = {
  'gpt-4o-mini': [0.15, 0.6],
  'gpt-4o': [2.5, 10.0],
}

function computeCostUsd(model: string, inputTokens: number, outputTokens: number): string {
  const [inRate, outRate] = MODEL_COSTS[model] ?? [0, 0]
  return ((inputTokens * inRate + outputTokens * outRate) / 1_000_000).toFixed(5)
}

export async function callChatTurn(opts: CallChatTurnOptions): Promise<ChatTurnResult> {
  const model = opts.usePremium ? AI_MODELS.premium : AI_MODELS.default
  const startedAt = Date.now()

  let content = ''
  let inputTokens = 0
  let outputTokens = 0
  let success = false

  try {
    const response = await getOpenAIClient().chat.completions.create({
      model,
      messages: opts.messages,
    })
    content = response.choices[0]?.message.content ?? ''
    inputTokens = response.usage?.prompt_tokens ?? 0
    outputTokens = response.usage?.completion_tokens ?? 0
    success = true
  } finally {
    const latencyMs = Date.now() - startedAt
    try {
      await db.insert(aiUsageLog).values({
        personalId: opts.personalId,
        feature: 'chat_workout_creation',
        model,
        tokensInput: inputTokens,
        tokensOutput: outputTokens,
        tokensCached: 0,
        costUsd: computeCostUsd(model, inputTokens, outputTokens),
        latencyMs,
        success,
      })
    } catch {
      // swallow — logging failure must not break the AI call
    }

    if (!success) {
      throw new Error('OpenAI chat turn request failed')
    }

    return { content, inputTokens, outputTokens, latencyMs, model }
  }
}
