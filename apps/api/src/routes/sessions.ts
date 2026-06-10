import { and, eq } from 'drizzle-orm'
import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import {
  db,
  sessionExerciseLogs,
  workoutExercises,
  workouts,
  workoutSessions,
} from '@athletiqlab/db'

const startSessionSchema = z.object({
  workoutId: z.string().uuid(),
  startPhotoUrl: z.string().url().optional(),
})

const endSessionSchema = z.object({
  endPhotoUrl: z.string().url().optional(),
  rpe: z.number().int().min(1).max(10).optional(),
  clientNotes: z.string().max(500).optional(),
})

const logExerciseSchema = z.object({
  completedSets: z.number().int().min(0),
  repsPerSet: z.array(z.number()).default([]),
  loadPerSet: z.array(z.number()).default([]),
  skipped: z.boolean().default(false),
})

export const sessionRoutes: FastifyPluginAsync = async (fastify) => {
  // POST /workout-sessions — check-in (start session)
  fastify.post('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const parsed = startSessionSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.badRequest(parsed.error.issues[0]?.message ?? 'Dados inválidos')
    }

    const { workoutId, startPhotoUrl } = parsed.data

    // Verify workout is published and belongs to this student
    const [workout] = await db
      .select({ id: workouts.id, studentId: workouts.studentId })
      .from(workouts)
      .where(and(eq(workouts.id, workoutId), eq(workouts.status, 'published')))
      .limit(1)

    if (!workout) return reply.notFound('Treino não encontrado ou não publicado')
    if (workout.studentId !== request.userId) {
      return reply.forbidden('Este treino não está atribuído a você')
    }

    const [session] = await db
      .insert(workoutSessions)
      .values({
        workoutId,
        studentId: request.userId,
        startedAt: new Date(),
        startPhotoUrl,
      })
      .returning()

    return reply.code(201).send({ data: session })
  })

  // GET /workout-sessions/:id — session detail with exercise logs
  fastify.get('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string }

    const [session] = await db
      .select()
      .from(workoutSessions)
      .where(and(eq(workoutSessions.id, id), eq(workoutSessions.studentId, request.userId)))
      .limit(1)

    if (!session) return reply.notFound('Sessão não encontrada')

    const logs = await db
      .select()
      .from(sessionExerciseLogs)
      .where(eq(sessionExerciseLogs.sessionId, id))

    return { data: { ...session, exerciseLogs: logs } }
  })

  // POST /workout-sessions/:id/end — check-out
  fastify.post('/:id/end', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const parsed = endSessionSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.badRequest(parsed.error.issues[0]?.message ?? 'Dados inválidos')
    }

    const [session] = await db
      .select({ id: workoutSessions.id, studentId: workoutSessions.studentId })
      .from(workoutSessions)
      .where(and(eq(workoutSessions.id, id), eq(workoutSessions.studentId, request.userId)))
      .limit(1)

    if (!session) return reply.notFound('Sessão não encontrada')

    // Calculate total volume from logs
    const logs = await db
      .select({
        completedSets: sessionExerciseLogs.completedSets,
        loadPerSet: sessionExerciseLogs.loadPerSet,
        repsPerSet: sessionExerciseLogs.repsPerSet,
      })
      .from(sessionExerciseLogs)
      .where(eq(sessionExerciseLogs.sessionId, id))

    let totalVolumeKg = 0
    for (const log of logs) {
      const reps = (log.repsPerSet as number[]) ?? []
      const loads = (log.loadPerSet as number[]) ?? []
      for (let i = 0; i < log.completedSets; i++) {
        totalVolumeKg += (reps[i] ?? 0) * (loads[i] ?? 0)
      }
    }

    const { rpe, clientNotes, endPhotoUrl } = parsed.data
    const [updated] = await db
      .update(workoutSessions)
      .set({
        endedAt: new Date(),
        endPhotoUrl,
        rpe,
        studentNotes: clientNotes,
        totalVolumeKg: totalVolumeKg > 0 ? String(totalVolumeKg) : undefined,
        updatedAt: new Date(),
      })
      .where(eq(workoutSessions.id, id))
      .returning()

    return { data: updated }
  })

  // POST /workout-sessions/:id/exercises/:we_id/log — upsert exercise log
  fastify.post(
    '/:id/exercises/:weId/log',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const { id, weId } = request.params as { id: string; weId: string }
      const parsed = logExerciseSchema.safeParse(request.body)
      if (!parsed.success) {
        return reply.badRequest(parsed.error.issues[0]?.message ?? 'Dados inválidos')
      }

      // Verify session belongs to student
      const [session] = await db
        .select({ id: workoutSessions.id, workoutId: workoutSessions.workoutId })
        .from(workoutSessions)
        .where(and(eq(workoutSessions.id, id), eq(workoutSessions.studentId, request.userId)))
        .limit(1)

      if (!session) return reply.notFound('Sessão não encontrada')

      // Verify workoutExercise belongs to this session's workout
      const [we] = await db
        .select({ id: workoutExercises.id })
        .from(workoutExercises)
        .where(
          and(eq(workoutExercises.id, weId), eq(workoutExercises.workoutId, session.workoutId)),
        )
        .limit(1)

      if (!we) return reply.notFound('Exercício não encontrado no treino')

      // Upsert log
      const [existing] = await db
        .select({ id: sessionExerciseLogs.id })
        .from(sessionExerciseLogs)
        .where(
          and(
            eq(sessionExerciseLogs.sessionId, id),
            eq(sessionExerciseLogs.workoutExerciseId, weId),
          ),
        )
        .limit(1)

      if (existing) {
        const [updated] = await db
          .update(sessionExerciseLogs)
          .set(parsed.data)
          .where(eq(sessionExerciseLogs.id, existing.id))
          .returning()
        return { data: updated }
      }

      const [created] = await db
        .insert(sessionExerciseLogs)
        .values({ sessionId: id, workoutExerciseId: weId, ...parsed.data })
        .returning()

      return reply.code(201).send({ data: created })
    },
  )
}
