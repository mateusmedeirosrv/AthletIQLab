import { pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

export const userRoleEnum = pgEnum('user_role', ['personal', 'student'])
export const oauthProviderEnum = pgEnum('oauth_provider', ['google', 'apple', 'email'])

export const users = pgTable('users', {
  id: uuid('id').primaryKey(),
  email: text('email').notNull().unique(),
  role: userRoleEnum('role').notNull(),
  oauthProvider: oauthProviderEnum('oauth_provider').notNull().default('email'),
  locale: text('locale').notNull().default('pt-BR'),
  consentLgpdAt: timestamp('consent_lgpd_at', { withTimezone: true }),
  consentHealthDataAt: timestamp('consent_health_data_at', { withTimezone: true }),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})
