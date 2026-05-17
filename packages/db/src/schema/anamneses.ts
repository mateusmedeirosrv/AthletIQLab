import { numeric, pgEnum, pgTable, smallint, text, timestamp, uuid } from 'drizzle-orm/pg-core'

import { students } from './students'

export const goalEnum = pgEnum('goal', [
  'hypertrophy',
  'weight_loss',
  'conditioning',
  'rehab',
  'general_health',
])

export const experienceLevelEnum = pgEnum('experience_level', [
  'beginner',
  'intermediate',
  'advanced',
])

export const anamneses = pgTable('anamneses', {
  id: uuid('id').primaryKey().defaultRandom(),
  studentId: uuid('student_id')
    .notNull()
    .references(() => students.userId, { onDelete: 'cascade' }),
  weightKg: numeric('weight_kg', { precision: 5, scale: 2 }),
  heightCm: numeric('height_cm', { precision: 5, scale: 2 }),
  bodyFatPct: numeric('body_fat_pct', { precision: 4, scale: 2 }),
  goal: goalEnum('goal').notNull(),
  experienceLevel: experienceLevelEnum('experience_level').notNull(),
  weeklyFrequency: smallint('weekly_frequency').notNull(),
  // Stored as JSON arrays; fields marked sensitive are encrypted via pgcrypto at DB layer
  restrictions: text('restrictions').notNull().default('[]'),
  medications: text('medications').notNull().default('[]'),
  medicalNotes: text('medical_notes'),
  signedAt: timestamp('signed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})
