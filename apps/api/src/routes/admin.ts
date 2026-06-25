import { eq } from 'drizzle-orm'
import type { FastifyPluginAsync } from 'fastify'
import { db, personals } from '@athletiqlab/db'

export const adminRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('onRequest', async (request, reply) => {
    const secret = request.headers['x-admin-secret']
    if (!process.env['ADMIN_SECRET'] || secret !== process.env['ADMIN_SECRET']) {
      return reply.code(401).send({ error: 'Unauthorized' })
    }
  })

  // POST /admin/personals/:userId/verify-council
  fastify.post('/:userId/verify-council', async (request, reply) => {
    const { userId } = request.params as { userId: string }

    const [updated] = await db
      .update(personals)
      .set({ crefVerifiedAt: new Date(), updatedAt: new Date() })
      .where(eq(personals.userId, userId))
      .returning({
        userId: personals.userId,
        cref: personals.cref,
        crefVerifiedAt: personals.crefVerifiedAt,
      })

    if (!updated) return reply.notFound('Profissional não encontrado')
    return { data: updated }
  })

  // DELETE /admin/personals/:userId/verify-council  (revoga verificação)
  fastify.delete('/:userId/verify-council', async (request, reply) => {
    const { userId } = request.params as { userId: string }

    const [updated] = await db
      .update(personals)
      .set({ crefVerifiedAt: null, updatedAt: new Date() })
      .where(eq(personals.userId, userId))
      .returning({ userId: personals.userId, cref: personals.cref })

    if (!updated) return reply.notFound('Profissional não encontrado')
    return { data: updated }
  })
}
