import type { Plan } from '@athletiqlab/shared'
import { aiChatWorkoutProposalSchema, aiRefusalSchema } from '@athletiqlab/shared'
import type { AiChatWorkoutProposal } from '@athletiqlab/shared'
import type { QuickReply } from '@athletiqlab/shared'
import { z } from 'zod'
import type OpenAI from 'openai'

import { buildChatSystemPrompt } from '../prompts/system'
import { callChatTurn } from '../guardrails/call-chat-turn'
import { callWithValidation } from '../guardrails/validate-output'
import type { ExerciseLibraryItem } from './generate-workout'

// ── Sentinel constants ────────────────────────────────────────────────────────

const READY_SENTINEL = '[READY_TO_PROPOSE]'
const QR_PREFIX = '<!--QR:'
const QR_SUFFIX = '-->'

// ── Helpers ───────────────────────────────────────────────────────────────────

export function extractQuickReplies(content: string): {
  cleanContent: string
  quickReplies: QuickReply[]
} {
  const idx = content.lastIndexOf(QR_PREFIX)
  if (idx === -1) return { cleanContent: content.trim(), quickReplies: [] }

  const end = content.indexOf(QR_SUFFIX, idx)
  if (end === -1) return { cleanContent: content.trim(), quickReplies: [] }

  const jsonStr = content.slice(idx + QR_PREFIX.length, end)
  let quickReplies: QuickReply[] = []
  try {
    const parsed: unknown = JSON.parse(jsonStr)
    if (Array.isArray(parsed)) {
      quickReplies = parsed.filter(
        (item): item is QuickReply =>
          typeof item === 'object' &&
          item !== null &&
          typeof (item as Record<string, unknown>)['label'] === 'string' &&
          typeof (item as Record<string, unknown>)['value'] === 'string',
      )
    }
  } catch {
    // malformed QR block — ignore
  }

  const cleanContent = (content.slice(0, idx) + content.slice(end + QR_SUFFIX.length)).trim()
  return { cleanContent, quickReplies }
}

export function extractReadyToPropose(content: string): {
  cleanContent: string
  readyToPropose: boolean
} {
  const idx = content.indexOf(READY_SENTINEL)
  if (idx === -1) return { cleanContent: content.trim(), readyToPropose: false }
  const cleanContent = (content.slice(0, idx) + content.slice(idx + READY_SENTINEL.length)).trim()
  return { cleanContent, readyToPropose: true }
}

export function buildMessagesArray(params: {
  systemContent: string
  history: Array<{ role: 'user' | 'assistant'; content: string }>
  newUserMessage?: string
}): OpenAI.Chat.ChatCompletionMessageParam[] {
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: params.systemContent },
    ...params.history.map((m) => ({ role: m.role, content: m.content })),
  ]
  if (params.newUserMessage !== undefined) {
    messages.push({ role: 'user', content: params.newUserMessage })
  }
  return messages
}

function formatExerciseLibrary(library: ExerciseLibraryItem[]): string {
  return library
    .map(
      (e) =>
        `• ID: ${e.id} | Nome: ${e.name} | Músculos: ${e.muscleGroup.join(', ')} | Nível: ${e.level} | Equipamento: ${e.equipment.join(', ')}`,
    )
    .join('\n')
}

// ── Exported workflow functions ───────────────────────────────────────────────

export interface RecentClient {
  id: string
  name: string
  daysSinceLastWorkout: number | null
}

export interface StartConversationParams {
  personalId: string
  conversationId: string
  plan: Plan
  professionalType: string
  clientId?: string
  contextHint?: string
  recentClients: RecentClient[]
  exerciseLibrary: ExerciseLibraryItem[]
  usePremium?: boolean
}

export interface ChatTurnOutput {
  content: string
  quickReplies: QuickReply[]
  readyToPropose: boolean
  inputTokens: number
  outputTokens: number
}

export async function startConversation(params: StartConversationParams): Promise<ChatTurnOutput> {
  const systemContent = buildChatSystemPrompt({
    exerciseLibraryText: formatExerciseLibrary(params.exerciseLibrary),
    professionalType: params.professionalType,
  })

  const clientList =
    params.recentClients.length > 0
      ? params.recentClients
          .map(
            (c) =>
              `• ${c.name} (${c.daysSinceLastWorkout != null ? `último treino: ${c.daysSinceLastWorkout}d` : 'sem treinos'})`,
          )
          .join('\n')
      : 'Nenhum cliente cadastrado ainda.'

  const userMessage = params.contextHint
    ? `Quero criar um treino de ${params.contextHint}.`
    : `Olá! Vamos criar um novo treino.\n\nMeus clientes recentes:\n${clientList}`

  const messages = buildMessagesArray({
    systemContent,
    history: [],
    newUserMessage: userMessage,
  })

  const result = await callChatTurn({
    messages,
    personalId: params.personalId,
    conversationId: params.conversationId,
    usePremium: params.usePremium ?? false,
  })

  const { cleanContent: afterReady, readyToPropose } = extractReadyToPropose(result.content)
  const { cleanContent, quickReplies } = extractQuickReplies(afterReady)

  return {
    content: cleanContent,
    quickReplies,
    readyToPropose,
    inputTokens: result.inputTokens,
    outputTokens: result.outputTokens,
  }
}

export interface ContinueConversationParams {
  personalId: string
  conversationId: string
  plan: Plan
  professionalType: string
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
  newUserMessage: string
  exerciseLibrary: ExerciseLibraryItem[]
  clientAnamnese?: { restrictions: string[]; goal: string } | null
  usePremium?: boolean
}

export async function continueConversation(
  params: ContinueConversationParams,
): Promise<ChatTurnOutput> {
  const systemContent = buildChatSystemPrompt({
    exerciseLibraryText: formatExerciseLibrary(params.exerciseLibrary),
    professionalType: params.professionalType,
  })

  const anamneseNote = params.clientAnamnese
    ? `\n\n[Dados da anamnese do cliente — Objetivo: ${params.clientAnamnese.goal}; Restrições: ${params.clientAnamnese.restrictions.join(', ') || 'nenhuma'}]`
    : ''

  const userMessageWithContext = params.newUserMessage + anamneseNote

  const messages = buildMessagesArray({
    systemContent,
    history: params.conversationHistory,
    newUserMessage: userMessageWithContext,
  })

  const result = await callChatTurn({
    messages,
    personalId: params.personalId,
    conversationId: params.conversationId,
    usePremium: params.usePremium ?? false,
  })

  const { cleanContent: afterReady, readyToPropose } = extractReadyToPropose(result.content)
  const { cleanContent, quickReplies } = extractQuickReplies(afterReady)

  return {
    content: cleanContent,
    quickReplies,
    readyToPropose,
    inputTokens: result.inputTokens,
    outputTokens: result.outputTokens,
  }
}

export interface ProposeWorkoutParams {
  personalId: string
  plan: Plan
  professionalType: string
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
  exerciseLibrary: ExerciseLibraryItem[]
  usePremium?: boolean
}

const proposalResponseSchema = z.union([aiChatWorkoutProposalSchema, aiRefusalSchema])

export async function proposeWorkout(
  params: ProposeWorkoutParams,
): Promise<AiChatWorkoutProposal | { refusal: string }> {
  const systemContent = buildChatSystemPrompt({
    exerciseLibraryText: formatExerciseLibrary(params.exerciseLibrary),
    professionalType: params.professionalType,
  })

  const proposeInstruction = `Com base em tudo que conversamos, gere agora o treino completo em JSON válido. Use os exerciseIds da biblioteca fornecida. Para exercícios que não estão na biblioteca, omita o campo exerciseId e inclua apenas o nome.

Formato esperado:
{
  "title": "...",
  "modality": "...",
  "estimatedDurationMin": 60,
  "exercises": [{"exerciseId": "uuid-opcional", "name": "Nome", "order": 1, "sets": 3, "reps": "10-12", "load": "...", "restSeconds": 60, "notes": "...", "rationale": "..."}],
  "warmUp": [...],
  "coolDown": [...],
  "safetyNotes": ["..."]
}`

  const messages = buildMessagesArray({
    systemContent,
    history: params.conversationHistory,
    newUserMessage: proposeInstruction,
  })

  return callWithValidation({
    messages,
    schema: proposalResponseSchema,
    personalId: params.personalId,
    feature: 'generate_workout',
    plan: params.plan,
    usePremium: params.usePremium ?? false,
  })
}
