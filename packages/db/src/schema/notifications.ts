import { pgEnum, pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core'

import { users } from './users'

export const pushPlatformEnum = pgEnum('push_platform', ['ios', 'android'])

export const notificationTokens = pgTable(
  'notification_tokens',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    expoToken: text('expo_token').notNull(),
    platform: pushPlatformEnum('platform').notNull(),
    lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique().on(t.userId, t.expoToken)],
)
