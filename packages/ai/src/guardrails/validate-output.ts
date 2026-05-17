import type { ZodSchema } from 'zod'
import type OpenAI from 'openai'

import { openai, AI_MODELS } from '../client'

export class AiOutputInvalidError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AiOutputInvalidError'
  }
}

interface CallWithValidationOptions<T> {
  messages: OpenAI.Chat.ChatCompletionMessageParam[]
  schema: ZodSchema<T>
  usePremium?: boolean
}

export async function callWithValidation<T>({
  messages,
  schema,
  usePremium = false,
}: CallWithValidationOptions<T>): Promise<T> {
  const model = usePremium ? AI_MODELS.premium : AI_MODELS.default
  const startedAt = Date.now()

  async function attempt(
    msgs: OpenAI.Chat.ChatCompletionMessageParam[],
  ): Promise<{ raw: string; latencyMs: number }> {
    const response = await openai.chat.completions.create({
      model,
      messages: msgs,
      response_format: { type: 'json_object' },
    })
    const raw = response.choices[0]?.message.content ?? ''
    return { raw, latencyMs: Date.now() - startedAt }
  }

  let raw: string

  try {
    ;({ raw } = await attempt(messages))
  } catch {
    throw new AiOutputInvalidError('OpenAI request failed')
  }

  const parsed = safeParse(schema, raw)
  if (parsed.success) return parsed.data

  // 1 retry with correction instruction
  const retryMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    ...messages,
    { role: 'assistant', content: raw },
    {
      role: 'user',
      content: `Sua resposta não seguiu o schema JSON esperado. Corrija e responda novamente com JSON válido. Erros: ${JSON.stringify(parsed.error.issues)}`,
    },
  ]

  try {
    ;({ raw } = await attempt(retryMessages))
  } catch {
    throw new AiOutputInvalidError('OpenAI retry request failed')
  }

  const retryParsed = safeParse(schema, raw)
  if (retryParsed.success) return retryParsed.data

  throw new AiOutputInvalidError(`AI_OUTPUT_INVALID: ${JSON.stringify(retryParsed.error.issues)}`)
}

function safeParse<T>(schema: ZodSchema<T>, raw: string) {
  try {
    const json: unknown = JSON.parse(raw)
    return schema.safeParse(json)
  } catch {
    return { success: false as const, error: { issues: [{ message: 'Invalid JSON' }] } }
  }
}
