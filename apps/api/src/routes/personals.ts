import { and, eq, gte, isNotNull, ne, sql } from 'drizzle-orm'
import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { db, npsResponses, personals, students, workoutSessions, workouts } from '@athletiqlab/db'

const updatePersonalSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  bio: z.string().max(500).nullable().optional(),
  photoUrl: z.string().url().nullable().optional(),
  brandColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Cor inválida (hex #RRGGBB)')
    .nullable()
    .optional(),
  brandLogoUrl: z.string().url().nullable().optional(),
})

export const personalRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/me', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const [personal] = await db
      .select()
      .from(personals)
      .where(eq(personals.userId, request.userId))
      .limit(1)

    if (!personal) return reply.notFound('Personal não encontrado')
    return personal
  })

  fastify.patch('/me', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const parsed = updatePersonalSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.badRequest(parsed.error.issues[0]?.message ?? 'Dados inválidos')
    }

    const [updated] = await db
      .update(personals)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(personals.userId, request.userId))
      .returning()

    if (!updated) return reply.notFound('Personal não encontrado')
    return updated
  })

  fastify.get('/dashboard', { preHandler: [fastify.authenticate] }, async (request) => {
    const personalId = request.userId

    const now = new Date()

    const weekStart = new Date(now)
    weekStart.setHours(0, 0, 0, 0)
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())

    const sevenDaysAgo = new Date(now)
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
    sevenDaysAgo.setHours(0, 0, 0, 0)

    const myStudentsSubquery = sql`(SELECT user_id FROM students WHERE personal_id = ${personalId}::uuid)`

    const [
      studentRows,
      workoutRows,
      sessionsWeekRows,
      chartRows,
      npsRows,
      recentRows,
      noWorkoutRows,
    ] = await Promise.all([
      db
        .select({
          total: sql<number>`count(*)::int`,
          active: sql<number>`count(*) filter (where ${students.status} = 'active')::int`,
        })
        .from(students)
        .where(and(eq(students.personalId, personalId), ne(students.status, 'removed'))),

      db
        .select({ status: workouts.status, count: sql<number>`count(*)::int` })
        .from(workouts)
        .where(and(eq(workouts.personalId, personalId), eq(workouts.isTemplate, false)))
        .groupBy(workouts.status),

      db
        .select({ count: sql<number>`count(*)::int` })
        .from(workoutSessions)
        .where(
          and(
            sql`${workoutSessions.studentId} IN ${myStudentsSubquery}`,
            isNotNull(workoutSessions.endedAt),
            gte(workoutSessions.startedAt, weekStart),
          ),
        ),

      db
        .select({
          date: sql<string>`date(${workoutSessions.startedAt} AT TIME ZONE 'UTC')::text`,
          count: sql<number>`count(*)::int`,
        })
        .from(workoutSessions)
        .where(
          and(
            sql`${workoutSessions.studentId} IN ${myStudentsSubquery}`,
            isNotNull(workoutSessions.endedAt),
            gte(workoutSessions.startedAt, sevenDaysAgo),
          ),
        )
        .groupBy(sql`date(${workoutSessions.startedAt} AT TIME ZONE 'UTC')`)
        .orderBy(sql`date(${workoutSessions.startedAt} AT TIME ZONE 'UTC')`),

      db
        .select({
          avg: sql<number | null>`round(avg(${npsResponses.score})::numeric, 1)`,
          count: sql<number>`count(*)::int`,
        })
        .from(npsResponses)
        .where(sql`${npsResponses.userId} IN ${myStudentsSubquery}`),

      db
        .select({
          sessionId: workoutSessions.id,
          startedAt: workoutSessions.startedAt,
          rpe: workoutSessions.rpe,
          totalVolumeKg: workoutSessions.totalVolumeKg,
          studentName: students.name,
          workoutTitle: workouts.title,
        })
        .from(workoutSessions)
        .innerJoin(students, eq(students.userId, workoutSessions.studentId))
        .innerJoin(workouts, eq(workouts.id, workoutSessions.workoutId))
        .where(and(eq(students.personalId, personalId), isNotNull(workoutSessions.endedAt)))
        .orderBy(sql`${workoutSessions.startedAt} desc`)
        .limit(8),

      db
        .select({ count: sql<number>`count(*)::int` })
        .from(students)
        .where(
          and(
            eq(students.personalId, personalId),
            eq(students.status, 'active'),
            sql`NOT EXISTS (
              SELECT 1 FROM workouts w
              WHERE w.student_id = ${students.userId}
              AND w.status = 'published'
              AND w.is_template = false
            )`,
          ),
        ),
    ])

    const workoutStats = { total: 0, published: 0, draft: 0 }
    for (const row of workoutRows) {
      workoutStats.total += row.count
      if (row.status === 'published') workoutStats.published = row.count
      else if (row.status === 'draft') workoutStats.draft = row.count
    }

    return {
      data: {
        students: studentRows[0] ?? { total: 0, active: 0 },
        workouts: workoutStats,
        sessionsThisWeek: sessionsWeekRows[0]?.count ?? 0,
        sessionsLast7Days: chartRows,
        nps: npsRows[0] ?? { avg: null, count: 0 },
        recentSessions: recentRows,
        studentsWithoutWorkout: noWorkoutRows[0]?.count ?? 0,
      },
    }
  })
}
