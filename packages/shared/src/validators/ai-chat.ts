import { z } from 'zod'

import type { AiChatWorkoutProposal } from './ai'

// ── Request body schemas ─────────────────────────────────────────────────────

export const startChatSchema = z.object({
  clientId: z.string().uuid().optional(),
  contextHint: z.string().max(200).optional(),
  usePremium: z.boolean().default(false),
})

export const sendMessageSchema = z.object({
  content: z.string().min(1).max(2000),
  selectedQuickReply: z.string().max(200).optional(),
  usePremium: z.boolean().default(false),
})

export const authorizeChatSchema = z.object({
  studentId: z.string().uuid().optional(),
})

// ── Response shapes (TypeScript interfaces) ──────────────────────────────────

export interface QuickReply {
  label: string
  value: string
}

export interface ConversationMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  quickReplies: QuickReply[] | null
  selectedQuickReply: string | null
  createdAt: string
}

export type ConversationStatus =
  | 'in_progress'
  | 'awaiting_authorization'
  | 'authorized'
  | 'discarded'

export interface ConversationState {
  id: string
  status: ConversationStatus
  modality: string | null
  goal: string | null
  detectedRestrictions: string[]
  proposedWorkout: AiChatWorkoutProposal | null
  resultingWorkoutId: string | null
  totalTurns: number
  createdAt: string
  authorizedAt: string | null
}
