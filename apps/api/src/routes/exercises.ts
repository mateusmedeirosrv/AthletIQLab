import { and, eq, ilike, or, sql } from 'drizzle-orm'
import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { db, exercises } from '@athletiqlab/db'

const listQuerySchema = z.object({
  search: z.string().optional(),
  level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  modality: z.string().optional(),
  muscleGroup: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
})

export const exerciseRoutes: FastifyPluginAsync = async (fastify) => {
  // List exercises from the public library + personal's own exercises
  fastify.get('/', { preHandler: [fastify.authenticate] }, async (request, _reply) => {
    const parsed = listQuerySchema.safeParse(request.query)
    if (!parsed.success) {
      return _reply.badRequest(parsed.error.issues[0]?.message ?? 'Query inválida')
    }

    const { search, level, modality, muscleGroup, page, limit } = parsed.data
    const offset = (page - 1) * limit

    const conditions = [or(eq(exercises.isPublic, true), eq(exercises.ownerId, request.userId))]

    if (level) conditions.push(eq(exercises.level, level))
    if (search) conditions.push(ilike(exercises.name, `%${search}%`))
    // JSON text array filters via LIKE (simple, avoids casting overhead for MVP)
    if (modality)
      conditions.push(sql`${exercises.modality}::jsonb @> ${JSON.stringify([modality])}::jsonb`)
    if (muscleGroup)
      conditions.push(
        sql`${exercises.muscleGroup}::jsonb @> ${JSON.stringify([muscleGroup])}::jsonb`,
      )

    const rows = await db
      .select()
      .from(exercises)
      .where(and(...(conditions as [ReturnType<typeof eq>])))
      .orderBy(exercises.name)
      .limit(limit)
      .offset(offset)

    return { data: rows, page, limit }
  })

  // Get single exercise
  fastify.get('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string }

    const [exercise] = await db
      .select()
      .from(exercises)
      .where(
        and(
          eq(exercises.id, id),
          or(eq(exercises.isPublic, true), eq(exercises.ownerId, request.userId)),
        ),
      )
      .limit(1)

    if (!exercise) return reply.notFound('Exercício não encontrado')
    return exercise
  })
}
