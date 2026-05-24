import { and, count, eq, gte } from 'drizzle-orm'
import type { ZodSchema } from 'zod'
import type OpenAI from 'openai'
import type { Plan } from '@athletiqlab/shared'
import { PLAN_LIMITS } from '@athletiqlab/shared'
import { db, aiUsageLog } from '@athletiqlab/db'

import { getOpenAIClient, AI_MODELS } from '../client'

type AiFeature = 'generate_workout' | 'suggest_exercises' | 'substitute' | 'validate'

export class AiOutputInvalidError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AiOutputInvalidError'
  }
}

export class AiRateLimitError extends Error {
  readonly limit: number
  readonly used: number
  constructor(limit: number, used: number) {
    super(`Limite de ${limit} chamadas IA/mês atingido (${used}/${limit})`)
    this.name = 'AiRateLimitError'
    this.limit = limit
    this.used = used
  }
}

interface CallWithValidationOptions<T> {
  messages: OpenAI.Chat.ChatCompletionMessageParam[]
  schema: ZodSchema<T>
  personalId: string
  feature: AiFeature
  plan: Plan
  usePremium?: boolean
}

const MODEL_COSTS: Record<string, [number, number]> = {
  'gpt-4o-mini': [0.15, 0.6],
  'gpt-4o': [2.5, 10.0],
}

function computeCostUsd(model: string, inputTokens: number, outputTokens: number): string {
  const [inRate, outRate] = MODEL_COSTS[model] ?? [0, 0]
  const cost = (inputTokens * inRate + outputTokens * outRate) / 1_000_000
  return cost.toFixed(5)
}

export async function callWithValidation<T>({
  messages,
  schema,
  personalId,
  feature,
  plan,
  usePremium = false,
}: CallWithValidationOptions<T>): Promise<T> {
  // Rate limit check: count successful calls this calendar month
  const startOfMonth = new Date()
  startOfMonth.setUTCDate(1)
  startOfMonth.setUTCHours(0, 0, 0, 0)

  const [row] = await db
    .select({ value: count() })
    .from(aiUsageLog)
    .where(
      and(
        eq(aiUsageLog.personalId, personalId),
        gte(aiUsageLog.createdAt, startOfMonth),
        eq(aiUsageLog.success, true),
      ),
    )

  const usedThisMonth = row?.value ?? 0
  const monthlyLimit = PLAN_LIMITS[plan].aiCallsPerMonth
  if (usedThisMonth >= monthlyLimit) {
    throw new AiRateLimitError(monthlyLimit, usedThisMonth)
  }

  const model = usePremium ? AI_MODELS.premium : AI_MODELS.default
  const startedAt = Date.now()

  async function attempt(msgs: OpenAI.Chat.ChatCompletionMessageParam[]) {
    const response = await getOpenAIClient().chat.completions.create({
      model,
      messages: msgs,
      response_format: { type: 'json_object' },
    })
    return {
      raw: response.choices[0]?.message.content ?? '',
      inputTokens: response.usage?.prompt_tokens ?? 0,
      outputTokens: response.usage?.completion_tokens ?? 0,
    }
  }

  let raw: string
  let inputTokens = 0
  let outputTokens = 0

  try {
    ;({ raw, inputTokens, outputTokens } = await attempt(messages))
  } catch {
    await logUsage({
      personalId,
      feature,
      model,
      inputTokens: 0,
      outputTokens: 0,
      latencyMs: Date.now() - startedAt,
      success: false,
    })
    throw new AiOutputInvalidError('OpenAI request failed')
  }

  const parsed = safeParse(schema, raw)
  if (parsed.success) {
    await logUsage({
      personalId,
      feature,
      model,
      inputTokens,
      outputTokens,
      latencyMs: Date.now() - startedAt,
      success: true,
    })
    return parsed.data
  }

  // 1 retry with schema correction hint
  const retryMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    ...messages,
    { role: 'assistant', content: raw },
    {
      role: 'user',
      content: `Sua resposta não seguiu o schema JSON esperado. Corrija e responda novamente com JSON válido. Erros: ${JSON.stringify(parsed.error.issues)}`,
    },
  ]

  let retryInputTokens = 0
  let retryOutputTokens = 0

  try {
    ;({
      raw,
      inputTokens: retryInputTokens,
      outputTokens: retryOutputTokens,
    } = await attempt(retryMessages))
  } catch {
    await logUsage({
      personalId,
      feature,
      model,
      inputTokens,
      outputTokens,
      latencyMs: Date.now() - startedAt,
      success: false,
    })
    throw new AiOutputInvalidError('OpenAI retry request failed')
  }

  const totalIn = inputTokens + retryInputTokens
  const totalOut = outputTokens + retryOutputTokens

  const retryParsed = safeParse(schema, raw)
  if (retryParsed.success) {
    await logUsage({
      personalId,
      feature,
      model,
      inputTokens: totalIn,
      outputTokens: totalOut,
      latencyMs: Date.now() - startedAt,
      success: true,
    })
    return retryParsed.data
  }

  await logUsage({
    personalId,
    feature,
    model,
    inputTokens: totalIn,
    outputTokens: totalOut,
    latencyMs: Date.now() - startedAt,
    success: false,
  })
  throw new AiOutputInvalidError(`AI_OUTPUT_INVALID: ${JSON.stringify(retryParsed.error.issues)}`)
}

async function logUsage(params: {
  personalId: string
  feature: AiFeature
  model: string
  inputTokens: number
  outputTokens: number
  latencyMs: number
  success: boolean
}) {
  try {
    await db.insert(aiUsageLog).values({
      personalId: params.personalId,
      feature: params.feature,
      model: params.model,
      tokensInput: params.inputTokens,
      tokensOutput: params.outputTokens,
      tokensCached: 0,
      costUsd: computeCostUsd(params.model, params.inputTokens, params.outputTokens),
      latencyMs: params.latencyMs,
      success: params.success,
    })
  } catch {
    // swallow — logging failure must not break the AI call
  }
}

function safeParse<T>(schema: ZodSchema<T>, raw: string) {
  try {
    const json: unknown = JSON.parse(raw)
    return schema.safeParse(json)
  } catch {
    return { success: false as const, error: { issues: [{ message: 'Invalid JSON' }] } }
  }
}
