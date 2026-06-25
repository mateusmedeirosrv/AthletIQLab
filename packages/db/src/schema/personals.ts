import { boolean, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

import { users } from './users'

export const planEnum = pgEnum('plan', ['starter', 'pro', 'elite'])
export const subscriptionStatusEnum = pgEnum('subscription_status', [
  'trialing',
  'active',
  'past_due',
  'canceled',
])
export const councilTypeEnum = pgEnum('council_type', ['cref', 'crefito', 'crm', 'crn', 'outro'])

export const personals = pgTable('personals', {
  userId: uuid('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  councilType: councilTypeEnum('council_type').notNull().default('cref'),
  cref: text('cref').notNull(),
  crefVerifiedAt: timestamp('cref_verified_at', { withTimezone: true }),
  bio: text('bio'),
  photoUrl: text('photo_url'),
  plan: planEnum('plan').notNull().default('starter'),
  subscriptionStatus: subscriptionStatusEnum('subscription_status').notNull().default('trialing'),
  trialEndsAt: timestamp('trial_ends_at', { withTimezone: true }),
  mpSubscriptionId: text('mp_subscription_id'),
  brandColor: text('brand_color'),
  brandLogoUrl: text('brand_logo_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const personalInvites = pgTable('personal_invites', {
  id: uuid('id').primaryKey().defaultRandom(),
  personalId: uuid('personal_id')
    .notNull()
    .references(() => personals.userId, { onDelete: 'cascade' }),
  code: text('code').notNull().unique(),
  usedAt: timestamp('used_at', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  maxUses: text('max_uses'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
