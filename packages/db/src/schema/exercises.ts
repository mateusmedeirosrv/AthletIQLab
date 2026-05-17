import { boolean, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

import { personals } from './personals'

export const videoProviderEnum = pgEnum('video_provider', ['cloudflare', 'youtube', 'vimeo'])
export const exerciseSourceEnum = pgEnum('exercise_source', [
  'curated',
  'personal',
  'external_link',
])
export const exerciseLevelEnum = pgEnum('exercise_level', ['beginner', 'intermediate', 'advanced'])

export const exercises = pgTable('exercises', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  // Stored as JSON arrays for Postgres text[]
  muscleGroup: text('muscle_group').notNull().default('[]'),
  modality: text('modality').notNull().default('[]'),
  equipment: text('equipment').notNull().default('[]'),
  level: exerciseLevelEnum('level').notNull().default('beginner'),
  description: text('description'),
  techniqueTips: text('technique_tips'),
  contraindications: text('contraindications').notNull().default('[]'),
  videoUrl: text('video_url'),
  videoProvider: videoProviderEnum('video_provider'),
  streamUid: text('stream_uid'),
  thumbnailUrl: text('thumbnail_url'),
  source: exerciseSourceEnum('source').notNull().default('curated'),
  ownerId: uuid('owner_id').references(() => personals.userId, { onDelete: 'set null' }),
  isPublic: boolean('is_public').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})
