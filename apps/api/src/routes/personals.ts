import { eq } from 'drizzle-orm'
import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { db, personals } from '@athletiqlab/db'

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
}
