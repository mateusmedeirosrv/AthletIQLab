import { boolean, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

import { personals } from './personals'

export const mpSubscriptionStatusEnum = pgEnum('mp_subscription_status', [
  'pending',
  'authorized',
  'paused',
  'cancelled',
])

export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  personalId: uuid('personal_id')
    .notNull()
    .references(() => personals.userId, { onDelete: 'cascade' }),
  plan: text('plan').notNull(),
  status: mpSubscriptionStatusEnum('status').notNull().default('pending'),
  startedAt: timestamp('started_at', { withTimezone: true }),
  currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }),
  mpSubscriptionId: text('mp_subscription_id').unique(),
  mpPreapprovalPlanId: text('mp_preapproval_plan_id'),
  cancelAtPeriodEnd: boolean('cancel_at_period_end').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})
