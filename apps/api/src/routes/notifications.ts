import { and, eq } from 'drizzle-orm'
import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { db, notificationTokens } from '@athletiqlab/db'

const registerSchema = z.object({
  expoToken: z
    .string()
    .min(1)
    .refine((v) => v.startsWith('ExponentPushToken[') || v.startsWith('ExpoPushToken['), {
      message: 'Token Expo inválido',
    }),
  platform: z.enum(['ios', 'android']),
})

export const notificationRoutes: FastifyPluginAsync = async (fastify) => {
  // POST /notifications/push-token — register or refresh an Expo push token
  fastify.post('/push-token', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const parsed = registerSchema.safeParse(request.body)
    if (!parsed.success)
      return reply.badRequest(parsed.error.issues[0]?.message ?? 'Token inválido')

    const { expoToken, platform } = parsed.data
    const userId = request.userId

    await db
      .insert(notificationTokens)
      .values({ userId, expoToken, platform, lastUsedAt: new Date() })
      .onConflictDoUpdate({
        target: [notificationTokens.userId, notificationTokens.expoToken],
        set: { lastUsedAt: new Date() },
      })

    return reply.code(204).send()
  })

  // DELETE /notifications/push-token — unregister a token (on logout)
  fastify.delete('/push-token', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const body = request.body as { expoToken?: string }
    if (!body?.expoToken) return reply.badRequest('expoToken é obrigatório')

    await db
      .delete(notificationTokens)
      .where(
        and(
          eq(notificationTokens.userId, request.userId),
          eq(notificationTokens.expoToken, body.expoToken),
        ),
      )

    return reply.code(204).send()
  })
}
