import {
  bigserial,
  boolean,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'

import { personals } from './personals'

export const aiFeatureEnum = pgEnum('ai_feature', [
  'generate_workout',
  'suggest_exercises',
  'substitute',
  'validate',
])

export const aiUsageLog = pgTable('ai_usage_log', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  personalId: uuid('personal_id')
    .notNull()
    .references(() => personals.userId, { onDelete: 'cascade' }),
  feature: aiFeatureEnum('feature').notNull(),
  model: text('model').notNull(),
  tokensInput: integer('tokens_input').notNull().default(0),
  tokensOutput: integer('tokens_output').notNull().default(0),
  tokensCached: integer('tokens_cached').notNull().default(0),
  costUsd: numeric('cost_usd', { precision: 8, scale: 5 }).notNull().default('0'),
  latencyMs: integer('latency_ms'),
  success: boolean('success').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
