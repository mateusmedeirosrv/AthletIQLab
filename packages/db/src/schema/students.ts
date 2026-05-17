import { date, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

import { personals } from './personals'
import { users } from './users'

export const genderEnum = pgEnum('gender', ['male', 'female', 'other', 'prefer_not_to_say'])
export const studentStatusEnum = pgEnum('student_status', [
  'invited',
  'active',
  'paused',
  'removed',
])

export const students = pgTable('students', {
  userId: uuid('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  personalId: uuid('personal_id')
    .notNull()
    .references(() => personals.userId, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  birthDate: date('birth_date'),
  gender: genderEnum('gender'),
  photoUrl: text('photo_url'),
  inviteCode: text('invite_code').unique(),
  inviteAcceptedAt: timestamp('invite_accepted_at', { withTimezone: true }),
  status: studentStatusEnum('status').notNull().default('invited'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})
