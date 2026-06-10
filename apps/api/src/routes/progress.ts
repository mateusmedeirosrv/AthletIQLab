import { and, eq, gte, isNotNull, sql } from 'drizzle-orm'
import type { FastifyPluginAsync } from 'fastify'
import { db, workoutSessions } from '@athletiqlab/db'

export const progressRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /progress/summary — last 8 weeks of session data for the authenticated student
  fastify.get('/summary', { preHandler: [fastify.authenticate] }, async (request) => {
    const studentId = request.userId
    const eightWeeksAgo = new Date()
    eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56)

    const [weeklySessions, recentSessions, totals] = await Promise.all([
      // Weekly aggregates: session count + volume
      db
        .select({
          week: sql<string>`date_trunc('week', ${workoutSessions.startedAt})::text`.as('week'),
          sessionCount: sql<number>`count(*)::int`.as('session_count'),
          totalVolumeKg:
            sql<number>`coalesce(sum(${workoutSessions.totalVolumeKg}::numeric), 0)::float`.as(
              'total_volume_kg',
            ),
        })
        .from(workoutSessions)
        .where(
          and(
            eq(workoutSessions.studentId, studentId),
            isNotNull(workoutSessions.endedAt),
            gte(workoutSessions.startedAt, eightWeeksAgo),
          ),
        )
        .groupBy(sql`date_trunc('week', ${workoutSessions.startedAt})`)
        .orderBy(sql`date_trunc('week', ${workoutSessions.startedAt})`),

      // 10 most recent completed sessions
      db
        .select({
          id: workoutSessions.id,
          workoutId: workoutSessions.workoutId,
          startedAt: workoutSessions.startedAt,
          endedAt: workoutSessions.endedAt,
          totalVolumeKg: workoutSessions.totalVolumeKg,
          avgHrBpm: workoutSessions.avgHrBpm,
          rpe: workoutSessions.rpe,
        })
        .from(workoutSessions)
        .where(and(eq(workoutSessions.studentId, studentId), isNotNull(workoutSessions.endedAt)))
        .orderBy(sql`${workoutSessions.startedAt} desc`)
        .limit(10),

      // All-time totals
      db
        .select({
          totalSessions: sql<number>`count(*)::int`.as('total_sessions'),
          totalVolumeKg:
            sql<number>`coalesce(sum(${workoutSessions.totalVolumeKg}::numeric), 0)::float`.as(
              'total_volume_kg',
            ),
        })
        .from(workoutSessions)
        .where(and(eq(workoutSessions.studentId, studentId), isNotNull(workoutSessions.endedAt))),
    ])

    // Compute current streak (consecutive weeks with at least 1 session)
    const weekSet = new Set(weeklySessions.map((w) => w.week))
    let streak = 0
    const now = new Date()
    const currentWeekStart = new Date(now)
    currentWeekStart.setDate(now.getDate() - now.getDay())
    currentWeekStart.setHours(0, 0, 0, 0)
    for (let i = 0; i < 8; i++) {
      const weekDate = new Date(currentWeekStart)
      weekDate.setDate(weekDate.getDate() - i * 7)
      const key = weekDate.toISOString().slice(0, 10)
      const matched = [...weekSet].find((w) => w.startsWith(key.slice(0, 7)))
      if (matched) streak++
      else if (i > 0) break
    }

    return {
      data: {
        weeklySessions,
        recentSessions,
        totals: totals[0] ?? { totalSessions: 0, totalVolumeKg: 0 },
        weekStreak: streak,
      },
    }
  })

  // GET /progress/sessions/:id — single session detail (student can see their own)
  fastify.get('/sessions/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const [session] = await db
      .select()
      .from(workoutSessions)
      .where(and(eq(workoutSessions.id, id), eq(workoutSessions.studentId, request.userId)))
      .limit(1)
    if (!session) return reply.notFound()
    return { data: session }
  })
}
