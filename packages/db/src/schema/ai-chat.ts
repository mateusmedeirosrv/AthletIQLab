import {
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  smallint,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'

import { personals } from './personals'
import { students } from './students'
import { workouts } from './workouts'

export const workoutCreationConversationStatusEnum = pgEnum(
  'workout_creation_conversation_status',
  ['in_progress', 'awaiting_authorization', 'authorized', 'discarded'],
)

export const aiChatMessageRoleEnum = pgEnum('ai_chat_message_role', ['user', 'assistant', 'system'])

export const workoutCreationConversations = pgTable('workout_creation_conversations', {
  id: uuid('id').primaryKey().defaultRandom(),
  personalId: uuid('personal_id')
    .notNull()
    .references(() => personals.userId, { onDelete: 'cascade' }),
  clientId: uuid('client_id').references(() => students.userId, { onDelete: 'set null' }),
  status: workoutCreationConversationStatusEnum('status').notNull().default('in_progress'),
  modality: text('modality'),
  goal: text('goal'),
  detectedRestrictions: text('detected_restrictions').notNull().default('[]'),
  proposedWorkout: jsonb('proposed_workout'),
  resultingWorkoutId: uuid('resulting_workout_id').references(() => workouts.id, {
    onDelete: 'set null',
  }),
  totalTurns: smallint('total_turns').notNull().default(0),
  tokensInput: integer('tokens_input').notNull().default(0),
  tokensOutput: integer('tokens_output').notNull().default(0),
  costUsd: numeric('cost_usd', { precision: 8, scale: 5 }).notNull().default('0'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  authorizedAt: timestamp('authorized_at', { withTimezone: true }),
})

export const aiChatMessages = pgTable('ai_chat_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  conversationId: uuid('conversation_id')
    .notNull()
    .references(() => workoutCreationConversations.id, { onDelete: 'cascade' }),
  role: aiChatMessageRoleEnum('role').notNull(),
  content: text('content').notNull(),
  quickReplies: jsonb('quick_replies'),
  selectedQuickReply: text('selected_quick_reply'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
