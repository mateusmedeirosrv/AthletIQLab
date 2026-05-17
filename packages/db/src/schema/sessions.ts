import {
  boolean,
  jsonb,
  numeric,
  pgTable,
  smallint,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'

import { students } from './students'
import { workoutExercises } from './workouts'
import { workouts } from './workouts'

export const workoutSessions = pgTable('workout_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  workoutId: uuid('workout_id')
    .notNull()
    .references(() => workouts.id, { onDelete: 'cascade' }),
  studentId: uuid('student_id')
    .notNull()
    .references(() => students.userId, { onDelete: 'cascade' }),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull(),
  endedAt: timestamp('ended_at', { withTimezone: true }),
  startPhotoUrl: text('start_photo_url'),
  endPhotoUrl: text('end_photo_url'),
  avgHrBpm: smallint('avg_hr_bpm'),
  maxHrBpm: smallint('max_hr_bpm'),
  totalVolumeKg: numeric('total_volume_kg'),
  rpe: smallint('rpe'),
  studentNotes: text('student_notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const sessionExerciseLogs = pgTable('session_exercise_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id')
    .notNull()
    .references(() => workoutSessions.id, { onDelete: 'cascade' }),
  workoutExerciseId: uuid('workout_exercise_id')
    .notNull()
    .references(() => workoutExercises.id, { onDelete: 'cascade' }),
  completedSets: smallint('completed_sets').notNull().default(0),
  repsPerSet: jsonb('reps_per_set').notNull().default([]),
  loadPerSet: jsonb('load_per_set').notNull().default([]),
  skipped: boolean('skipped').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
