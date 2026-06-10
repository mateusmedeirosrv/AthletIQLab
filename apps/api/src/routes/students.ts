import { and, eq, gt, isNull, ne, sql } from 'drizzle-orm'
import { randomBytes } from 'node:crypto'
import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { db, personals, personalInvites, students } from '@athletiqlab/db'
import { PLAN_LIMITS } from '@athletiqlab/shared'

const acceptInviteSchema = z.object({
  inviteCode: z.string().min(1),
  name: z.string().min(2).max(100),
})

const updateStudentSchema = z.object({
  status: z.enum(['active', 'paused', 'removed']).optional(),
  name: z.string().min(2).max(100).optional(),
})

export const studentRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /students/me — returns the student profile for the authenticated client
  fastify.get('/me', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const [student] = await db
      .select()
      .from(students)
      .where(eq(students.userId, request.userId))
      .limit(1)

    if (!student) return reply.notFound('Perfil de aluno não encontrado')
    return { data: student }
  })

  // POST /students/invites/accept — client accepts a professional's invite code
  fastify.post(
    '/invites/accept',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const parsed = acceptInviteSchema.safeParse(request.body)
      if (!parsed.success) {
        return reply.badRequest(parsed.error.issues[0]?.message ?? 'Dados inválidos')
      }

      const { inviteCode, name } = parsed.data
      const now = new Date()

      const [invite] = await db
        .select()
        .from(personalInvites)
        .where(
          and(
            eq(personalInvites.code, inviteCode),
            eq(personalInvites.isActive, true),
            isNull(personalInvites.usedAt),
            gt(personalInvites.expiresAt, now),
          ),
        )
        .limit(1)

      if (!invite) return reply.notFound('Código de convite inválido ou expirado')

      // Check if this user already has a student profile (prevent duplicate)
      const [existing] = await db
        .select({ userId: students.userId })
        .from(students)
        .where(eq(students.userId, request.userId))
        .limit(1)

      if (existing) {
        return reply.conflict('Você já está vinculado a um profissional')
      }

      const [student] = await db
        .insert(students)
        .values({
          userId: request.userId,
          personalId: invite.personalId,
          name,
          status: 'active',
          inviteAcceptedAt: now,
        })
        .returning()

      await db.update(personalInvites).set({ usedAt: now }).where(eq(personalInvites.id, invite.id))

      return reply.code(201).send({ data: student })
    },
  )

  // List students for this personal
  fastify.get('/', { preHandler: [fastify.authenticate] }, async (request, _reply) => {
    const list = await db
      .select()
      .from(students)
      .where(and(eq(students.personalId, request.userId), ne(students.status, 'removed')))
    return list
  })

  // Get single student
  fastify.get('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const [student] = await db
      .select()
      .from(students)
      .where(and(eq(students.userId, id), eq(students.personalId, request.userId)))
      .limit(1)

    if (!student) return reply.notFound('Aluno não encontrado')
    return student
  })

  // Update student (status, name)
  fastify.patch('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const parsed = updateStudentSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.badRequest(parsed.error.issues[0]?.message ?? 'Dados inválidos')
    }

    const [updated] = await db
      .update(students)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(and(eq(students.userId, id), eq(students.personalId, request.userId)))
      .returning()

    if (!updated) return reply.notFound('Aluno não encontrado')
    return updated
  })

  // Create invite code
  fastify.post('/invites', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const [personal] = await db
      .select({ plan: personals.plan, subscriptionStatus: personals.subscriptionStatus })
      .from(personals)
      .where(eq(personals.userId, request.userId))
      .limit(1)

    if (!personal) return reply.notFound('Personal não encontrado')

    const limits = PLAN_LIMITS[personal.plan]
    if (limits.maxStudents !== Infinity) {
      const countRows = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(students)
        .where(and(eq(students.personalId, request.userId), ne(students.status, 'removed')))
      const studentCount = countRows[0]?.count ?? 0

      if (studentCount >= limits.maxStudents) {
        return reply.code(402).send({
          message: `Limite de ${limits.maxStudents} alunos atingido para o plano ${personal.plan}. Faça upgrade para continuar.`,
          code: 'PLAN_LIMIT_REACHED',
        })
      }
    }

    const code = randomBytes(4).toString('hex').toUpperCase()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    const [invite] = await db
      .insert(personalInvites)
      .values({ personalId: request.userId, code, expiresAt, isActive: true })
      .returning()

    return reply.code(201).send(invite)
  })

  // List invite codes
  fastify.get('/invites', { preHandler: [fastify.authenticate] }, async (request, _reply) => {
    const invites = await db
      .select()
      .from(personalInvites)
      .where(eq(personalInvites.personalId, request.userId))
    return invites
  })
}
