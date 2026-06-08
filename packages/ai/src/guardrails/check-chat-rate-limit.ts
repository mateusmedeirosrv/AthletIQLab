import { and, count, eq, gte, inArray } from 'drizzle-orm'
import type { Plan } from '@athletiqlab/shared'
import { PLAN_LIMITS } from '@athletiqlab/shared'
import { db, workoutCreationConversations } from '@athletiqlab/db'

import { AiRateLimitError } from './validate-output'

export async function checkChatRateLimit(personalId: string, plan: Plan): Promise<void> {
  const startOfMonth = new Date()
  startOfMonth.setUTCDate(1)
  startOfMonth.setUTCHours(0, 0, 0, 0)

  const [row] = await db
    .select({ value: count() })
    .from(workoutCreationConversations)
    .where(
      and(
        eq(workoutCreationConversations.personalId, personalId),
        gte(workoutCreationConversations.createdAt, startOfMonth),
        inArray(workoutCreationConversations.status, ['authorized', 'discarded']),
      ),
    )

  const usedThisMonth = row?.value ?? 0
  const monthlyLimit = PLAN_LIMITS[plan].aiCallsPerMonth
  if (usedThisMonth >= monthlyLimit) {
    throw new AiRateLimitError(monthlyLimit, usedThisMonth)
  }
}
