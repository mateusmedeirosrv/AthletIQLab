import { pgTable, smallint, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { users } from './users'

export const npsResponses = pgTable('nps_responses', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  score: smallint('score').notNull(), // 0–10
  comment: text('comment'),
  trigger: text('trigger'), // 'post_session_3' | 'day_7' | 'day_14' | 'manual'
  appVersion: text('app_version'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
