import { and, desc, eq, or, sql } from 'drizzle-orm'
import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { chatMessages, conversations, db, students } from '@athletiqlab/db'
import { sendPushToUser } from '../lib/push'

const sendMessageSchema = z.object({
  content: z.string().min(1).max(4000),
  type: z.enum(['text', 'image', 'audio', 'workout_ref']).default('text'),
  attachmentUrl: z.string().url().optional(),
})

export const conversationRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /conversations — list conversations for the current user
  fastify.get('/', { preHandler: [fastify.authenticate] }, async (request) => {
    const userId = request.userId

    const rows = await db
      .select({
        id: conversations.id,
        personalId: conversations.personalId,
        studentId: conversations.studentId,
        lastMessageAt: conversations.lastMessageAt,
        createdAt: conversations.createdAt,
      })
      .from(conversations)
      .where(or(eq(conversations.personalId, userId), eq(conversations.studentId, userId)))
      .orderBy(desc(conversations.lastMessageAt))

    return { data: rows }
  })

  // POST /conversations — create or get conversation between personal and student
  fastify.post('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const body = request.body as { studentId?: string }
    if (!body?.studentId) return reply.badRequest('studentId é obrigatório')

    const personalId = request.userId
    const { studentId } = body

    // Verify the student belongs to this professional
    const [student] = await db
      .select()
      .from(students)
      .where(and(eq(students.userId, studentId), eq(students.personalId, personalId)))
      .limit(1)

    if (!student) return reply.forbidden('Aluno não encontrado neste perfil')

    const [existing] = await db
      .select()
      .from(conversations)
      .where(and(eq(conversations.personalId, personalId), eq(conversations.studentId, studentId)))
      .limit(1)

    if (existing) return { data: existing }

    const [created] = await db.insert(conversations).values({ personalId, studentId }).returning()

    return reply.code(201).send({ data: created })
  })

  // GET /conversations/:id — conversation with last 50 messages
  fastify.get('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const userId = request.userId

    const [conv] = await db
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.id, id),
          or(eq(conversations.personalId, userId), eq(conversations.studentId, userId)),
        ),
      )
      .limit(1)

    if (!conv) return reply.notFound()

    const messages = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.conversationId, id))
      .orderBy(desc(chatMessages.createdAt))
      .limit(50)

    return { data: { ...conv, messages: messages.reverse() } }
  })

  // POST /conversations/:id/messages — send a message
  fastify.post('/:id/messages', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const userId = request.userId

    const [conv] = await db
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.id, id),
          or(eq(conversations.personalId, userId), eq(conversations.studentId, userId)),
        ),
      )
      .limit(1)

    if (!conv) return reply.notFound()

    const parsed = sendMessageSchema.safeParse(request.body)
    if (!parsed.success)
      return reply.badRequest(parsed.error.issues[0]?.message ?? 'Dados inválidos')

    const { content, type, attachmentUrl } = parsed.data

    const msgValues = {
      conversationId: id,
      senderId: userId,
      content,
      type,
      ...(attachmentUrl !== undefined ? { attachmentUrl } : {}),
    }

    const [message] = await db.insert(chatMessages).values(msgValues).returning()

    // Update lastMessageAt on the conversation
    await db
      .update(conversations)
      .set({ lastMessageAt: sql`now()` })
      .where(eq(conversations.id, id))

    // Push notification to the other participant (fire-and-forget)
    const recipientId = conv.personalId === userId ? conv.studentId : conv.personalId
    void sendPushToUser(recipientId, {
      title: 'Nova mensagem',
      body: content.slice(0, 100),
      data: { conversationId: id, type: 'chat_message' },
    })

    return reply.code(201).send({ data: message })
  })

  // PATCH /conversations/:id/messages/:msgId/read — mark a message as read
  fastify.patch(
    '/:id/messages/:msgId/read',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const { id, msgId } = request.params as { id: string; msgId: string }
      const userId = request.userId

      // Ensure the user is in this conversation
      const [conv] = await db
        .select()
        .from(conversations)
        .where(
          and(
            eq(conversations.id, id),
            or(eq(conversations.personalId, userId), eq(conversations.studentId, userId)),
          ),
        )
        .limit(1)

      if (!conv) return reply.notFound()

      await db
        .update(chatMessages)
        .set({ readAt: sql`now()` })
        .where(and(eq(chatMessages.id, msgId), eq(chatMessages.conversationId, id)))

      return reply.code(204).send()
    },
  )
}
