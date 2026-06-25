import {
  boolean,
  jsonb,
  pgEnum,
  pgTable,
  smallint,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'

import { exercises } from './exercises'
import { personals } from './personals'
import { students } from './students'

export const workoutStatusEnum = pgEnum('workout_status', ['draft', 'published', 'archived'])

export const workouts = pgTable('workouts', {
  id: uuid('id').primaryKey().defaultRandom(),
  personalId: uuid('personal_id')
    .notNull()
    .references(() => personals.userId, { onDelete: 'cascade' }),
  studentId: uuid('student_id').references(() => students.userId, { onDelete: 'set null' }),
  title: text('title').notNull(),
  modality: text('modality').notNull(),
  estimatedDurationMin: smallint('estimated_duration_min'),
  aiGenerated: boolean('ai_generated').notNull().default(false),
  isTemplate: boolean('is_template').notNull().default(false),
  aiPromptSnapshot: jsonb('ai_prompt_snapshot'),
  status: workoutStatusEnum('status').notNull().default('draft'),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const workoutExercises = pgTable('workout_exercises', {
  id: uuid('id').primaryKey().defaultRandom(),
  workoutId: uuid('workout_id')
    .notNull()
    .references(() => workouts.id, { onDelete: 'cascade' }),
  exerciseId: uuid('exercise_id')
    .notNull()
    .references(() => exercises.id, { onDelete: 'restrict' }),
  order: smallint('order').notNull(),
  sets: smallint('sets').notNull(),
  reps: text('reps').notNull(),
  load: text('load'),
  restSeconds: smallint('rest_seconds'),
  notes: text('notes'),
  tempo: text('tempo'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
