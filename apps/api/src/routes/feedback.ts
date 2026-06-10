import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { db, npsResponses } from '@athletiqlab/db'

const submitNpsBody = z.object({
  score: z.number().int().min(0).max(10),
  comment: z.string().max(1000).optional(),
  trigger: z.string().optional(),
  appVersion: z.string().optional(),
})

export async function feedbackRoutes(app: FastifyInstance) {
  app.post('/nps', { preHandler: [app.authenticate] }, async (request, reply) => {
    const body = submitNpsBody.safeParse(request.body)
    if (!body.success) return reply.badRequest(body.error.message)

    const { score, comment, trigger, appVersion } = body.data

    const rows = await db
      .insert(npsResponses)
      .values({
        userId: request.userId,
        score,
        comment,
        trigger,
        appVersion,
      })
      .returning()

    const row = rows[0]
    if (!row) return reply.internalServerError('Failed to save NPS response')

    return reply.status(201).send({ data: { id: row.id } })
  })
}
