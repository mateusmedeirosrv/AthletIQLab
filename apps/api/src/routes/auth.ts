import { eq } from 'drizzle-orm'
import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { db, personals, users } from '@athletiqlab/db'
import { supabaseAdmin } from '../plugins/supabase'

const onboardSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
  cref: z.string().regex(/^\d{6}-[A-Z]\/[A-Z]{2}$/, 'CREF inválido (formato: 123456-G/SP)'),
  bio: z.string().max(500).optional(),
  consentLgpd: z.literal(true, {
    errorMap: () => ({ message: 'Consentimento LGPD é obrigatório' }),
  }),
})

export const authRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post(
    '/personals/onboard',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const parsed = onboardSchema.safeParse(request.body)
      if (!parsed.success) {
        return reply.badRequest(parsed.error.issues[0]?.message ?? 'Dados inválidos')
      }
      const { name, cref, bio } = parsed.data

      const existing = await db
        .select({ userId: personals.userId })
        .from(personals)
        .where(eq(personals.userId, request.userId))
        .limit(1)

      if (existing.length > 0) {
        return reply.conflict('Personal já cadastrado')
      }

      const { data: authData } = await supabaseAdmin.auth.admin.getUserById(request.userId)
      const email = authData.user?.email ?? ''
      const provider = authData.user?.app_metadata?.['provider'] ?? 'email'

      await db
        .insert(users)
        .values({
          id: request.userId,
          email,
          role: 'personal',
          oauthProvider: provider === 'google' ? 'google' : 'email',
          consentLgpdAt: new Date(),
        })
        .onConflictDoUpdate({
          target: users.id,
          set: { role: 'personal', consentLgpdAt: new Date(), updatedAt: new Date() },
        })

      await supabaseAdmin.auth.admin.updateUserById(request.userId, {
        user_metadata: { role: 'personal', name, onboarded: true },
      })

      const trialEndsAt = new Date()
      trialEndsAt.setDate(trialEndsAt.getDate() + 14)

      const [personal] = await db
        .insert(personals)
        .values({ userId: request.userId, name, cref, bio: bio ?? null, trialEndsAt })
        .returning()

      return reply.code(201).send(personal)
    },
  )
}
