import {
  bigserial,
  date,
  jsonb,
  numeric,
  pgTable,
  smallint,
  timestamp,
  timestamptz,
  uuid,
} from 'drizzle-orm/pg-core'

import { students } from './students'
import { workoutSessions } from './sessions'

export const progressEntries = pgTable('progress_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  studentId: uuid('student_id')
    .notNull()
    .references(() => students.userId, { onDelete: 'cascade' }),
  date: date('date').notNull(),
  weightKg: numeric('weight_kg', { precision: 5, scale: 2 }),
  bodyMeasurements: jsonb('body_measurements'),
  photos: jsonb('photos'),
  bodyFatPct: numeric('body_fat_pct', { precision: 4, scale: 2 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const heartRateSamples = pgTable('heart_rate_samples', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  sessionId: uuid('session_id')
    .notNull()
    .references(() => workoutSessions.id, { onDelete: 'cascade' }),
  timestamp: timestamptz('timestamp').notNull(),
  bpm: smallint('bpm').notNull(),
})
