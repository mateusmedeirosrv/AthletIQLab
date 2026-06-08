import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm'
import type { FastifyPluginAsync, FastifyReply } from 'fastify'
import {
  db,
  exercises,
  personals,
  students,
  workouts,
  workoutExercises,
  workoutCreationConversations,
  aiChatMessages,
  aiUsageLog,
} from '@athletiqlab/db'
import {
  AiRateLimitError,
  AiOutputInvalidError,
  checkChatRateLimit,
  startConversation,
  continueConversation,
  proposeWorkout,
} from '@athletiqlab/ai'
import type { ExerciseLibraryItem } from '@athletiqlab/ai'
import {
  startChatSchema,
  sendMessageSchema,
  authorizeChatSchema,
  aiChatWorkoutProposalSchema,
} from '@athletiqlab/shared'
import type { AiChatWorkoutProposal, ConversationMessage } from '@athletiqlab/shared'

// ── Helpers ───────────────────────────────────────────────────────────────────

async function getPersonalPlanAndType(personalId: string) {
  const [p] = await db
    .select({ plan: personals.plan, cref: personals.cref })
    .from(personals)
    .where(eq(personals.userId, personalId))
    .limit(1)
  const plan = p?.plan ?? ('starter' as const)
  const cref = p?.cref ?? ''
  const professionalType = cref.toUpperCase().startsWith('CREFITO') ? 'CREFITO' : 'CREF'
  return { plan, professionalType }
}

async function getExerciseLibrary(modalityHint?: string): Promise<ExerciseLibraryItem[]> {
  const rows = await db
    .select({
      id: exercises.id,
      name: exercises.name,
      muscleGroup: exercises.muscleGroup,
      modality: exercises.modality,
      equipment: exercises.equipment,
      level: exercises.level,
    })
    .from(exercises)
    .where(eq(exercises.isPublic, true))

  const all = rows.map((r) => ({
    id: r.id,
    name: r.name,
    muscleGroup: tryParseJson<string[]>(r.muscleGroup),
    modality: tryParseJson<string[]>(r.modality),
    equipment: tryParseJson<string[]>(r.equipment),
    level: r.level,
  }))

  if (modalityHint) {
    const filtered = all.filter((e) =>
      e.modality.some((m) => m === modalityHint || m.includes(modalityHint)),
    )
    return filtered.length >= 10 ? filtered : all
  }
  return all
}

function tryParseJson<T>(raw: string): T {
  try {
    return JSON.parse(raw) as T
  } catch {
    return [] as unknown as T
  }
}

function handleAiError(reply: FastifyReply, err: unknown): void {
  if (err instanceof AiRateLimitError) {
    void reply.code(429).send({
      error: { code: 'AI_RATE_LIMIT', message: err.message },
    })
    return
  }
  if (err instanceof AiOutputInvalidError) {
    void reply.internalServerError(err.message)
    return
  }
  throw err
}

function formatMessage(row: {
  id: string
  role: string
  content: string
  quickReplies: unknown
  selectedQuickReply: string | null
  createdAt: Date
}): ConversationMessage {
  let quickReplies = null
  if (row.quickReplies && typeof row.quickReplies === 'string') {
    try {
      quickReplies = JSON.parse(row.quickReplies) as ConversationMessage['quickReplies']
    } catch {
      quickReplies = null
    }
  } else if (Array.isArray(row.quickReplies)) {
    quickReplies = row.quickReplies as ConversationMessage['quickReplies']
  }
  return {
    id: row.id,
    role: row.role as ConversationMessage['role'],
    content: row.content,
    quickReplies,
    selectedQuickReply: row.selectedQuickReply,
    createdAt: row.createdAt.toISOString(),
  }
}

// ── Routes ────────────────────────────────────────────────────────────────────

export const aiChatRoutes: FastifyPluginAsync = async (fastify) => {
  // ── POST /start ─────────────────────────────────────────────────────────────
  fastify.post('/start', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const parsed = startChatSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.badRequest(parsed.error.issues[0]?.message ?? 'Dados inválidos')
    }

    const { plan, professionalType } = await getPersonalPlanAndType(request.userId)

    try {
      await checkChatRateLimit(request.userId, plan)
    } catch (err) {
      handleAiError(reply, err)
      return
    }

    const recentClients = await db
      .select({
        id: students.userId,
        name: students.name,
        lastWorkoutAt: sql<Date | null>`(
          SELECT MAX(w.created_at) FROM workouts w WHERE w.student_id = ${students.userId}
        )`,
      })
      .from(students)
      .where(eq(students.personalId, request.userId))
      .orderBy(desc(students.createdAt))
      .limit(5)

    const recentClientsFormatted = recentClients.map((c) => ({
      id: c.id,
      name: c.name,
      daysSinceLastWorkout: c.lastWorkoutAt
        ? Math.floor((Date.now() - new Date(c.lastWorkoutAt).getTime()) / 86_400_000)
        : null,
    }))

    const exerciseLibrary = await getExerciseLibrary(parsed.data.contextHint)

    // Create conversation row first so we have the ID for the AI call log
    const [conv] = await db
      .insert(workoutCreationConversations)
      .values({
        personalId: request.userId,
        clientId: parsed.data.clientId,
        status: 'in_progress',
      })
      .returning()

    if (!conv) return reply.internalServerError('Erro ao criar conversa')

    let aiResult: Awaited<ReturnType<typeof startConversation>>
    try {
      aiResult = await startConversation({
        personalId: request.userId,
        conversationId: conv.id,
        plan,
        professionalType,
        ...(parsed.data.clientId !== undefined ? { clientId: parsed.data.clientId } : {}),
        ...(parsed.data.contextHint !== undefined ? { contextHint: parsed.data.contextHint } : {}),
        recentClients: recentClientsFormatted,
        exerciseLibrary,
        usePremium: parsed.data.usePremium,
      })
    } catch (err) {
      // Roll back the conversation row on AI failure
      await db
        .delete(workoutCreationConversations)
        .where(eq(workoutCreationConversations.id, conv.id))
      handleAiError(reply, err)
      return
    }

    const [msg] = await db
      .insert(aiChatMessages)
      .values({
        conversationId: conv.id,
        role: 'assistant',
        content: aiResult.content,
        quickReplies: aiResult.quickReplies.length > 0 ? aiResult.quickReplies : null,
      })
      .returning()

    await db
      .update(workoutCreationConversations)
      .set({
        totalTurns: 1,
        tokensInput: aiResult.inputTokens,
        tokensOutput: aiResult.outputTokens,
      })
      .where(eq(workoutCreationConversations.id, conv.id))

    return reply.code(201).send({
      data: {
        conversationId: conv.id,
        message: msg ? formatMessage(msg) : null,
      },
    })
  })

  // ── POST /:id/message ────────────────────────────────────────────────────────
  fastify.post('/:id/message', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const parsed = sendMessageSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.badRequest(parsed.error.issues[0]?.message ?? 'Dados inválidos')
    }

    const [conv] = await db
      .select()
      .from(workoutCreationConversations)
      .where(
        and(
          eq(workoutCreationConversations.id, id),
          eq(workoutCreationConversations.personalId, request.userId),
        ),
      )
      .limit(1)

    if (!conv) return reply.notFound('Conversa não encontrada')

    if (conv.status !== 'in_progress' && conv.status !== 'awaiting_authorization') {
      return reply.badRequest('Conversa não está ativa')
    }

    if (conv.totalTurns >= 30) {
      return reply.code(422).send({
        error: {
          code: 'CONVERSATION_LIMIT',
          message: 'Conversa atingiu o limite de 30 mensagens.',
        },
      })
    }

    // Persist user message
    await db.insert(aiChatMessages).values({
      conversationId: id,
      role: 'user',
      content: parsed.data.content,
      selectedQuickReply: parsed.data.selectedQuickReply,
    })

    // Fetch full history (user + assistant turns only; system is rebuilt)
    const history = await db
      .select({ role: aiChatMessages.role, content: aiChatMessages.content })
      .from(aiChatMessages)
      .where(
        and(
          eq(aiChatMessages.conversationId, id),
          inArray(aiChatMessages.role, ['user', 'assistant']),
        ),
      )
      .orderBy(asc(aiChatMessages.createdAt))

    const { plan, professionalType } = await getPersonalPlanAndType(request.userId)
    const exerciseLibrary = await getExerciseLibrary(conv.modality ?? undefined)

    // Fetch anamnese if client is linked
    let clientAnamnese: { restrictions: string[]; goal: string } | null = null
    if (conv.clientId) {
      const [anamnese] = await db
        .select({ restrictions: sql<string>`restrictions`, goal: sql<string>`goal` })
        .from(sql`anamneses`)
        .where(sql`student_id = ${conv.clientId}`)
        .limit(1)
      if (anamnese) {
        clientAnamnese = {
          restrictions: tryParseJson<string[]>(anamnese.restrictions),
          goal: anamnese.goal,
        }
      }
    }

    let aiResult: Awaited<ReturnType<typeof continueConversation>>
    try {
      aiResult = await continueConversation({
        personalId: request.userId,
        conversationId: id,
        plan,
        professionalType,
        conversationHistory: history.map((h) => ({
          role: h.role as 'user' | 'assistant',
          content: h.content,
        })),
        newUserMessage: parsed.data.content,
        exerciseLibrary,
        clientAnamnese,
        usePremium: parsed.data.usePremium,
      })
    } catch (err) {
      handleAiError(reply, err)
      return
    }

    let proposedWorkout: AiChatWorkoutProposal | null = null
    let nextStatus = conv.status

    if (aiResult.readyToPropose) {
      try {
        const proposal = await proposeWorkout({
          personalId: request.userId,
          plan,
          professionalType,
          conversationHistory: [
            ...history.map((h) => ({ role: h.role as 'user' | 'assistant', content: h.content })),
            { role: 'assistant', content: aiResult.content },
          ],
          exerciseLibrary,
          usePremium: parsed.data.usePremium,
        })

        if (!('refusal' in proposal)) {
          proposedWorkout = proposal
          nextStatus = 'awaiting_authorization'
        }
      } catch (err) {
        // If proposal fails, stay in_progress and let the professional continue
        fastify.log.warn(err, 'proposeWorkout failed — staying in_progress')
      }
    }

    const [assistantMsg] = await db
      .insert(aiChatMessages)
      .values({
        conversationId: id,
        role: 'assistant',
        content: aiResult.content,
        quickReplies: aiResult.quickReplies.length > 0 ? aiResult.quickReplies : null,
      })
      .returning()

    const newTurns = conv.totalTurns + 2 // user + assistant
    await db
      .update(workoutCreationConversations)
      .set({
        status: nextStatus,
        totalTurns: newTurns,
        tokensInput: (conv.tokensInput ?? 0) + aiResult.inputTokens,
        tokensOutput: (conv.tokensOutput ?? 0) + aiResult.outputTokens,
        costUsd: String(
          parseFloat(conv.costUsd ?? '0') +
            (aiResult.inputTokens * 0.15 + aiResult.outputTokens * 0.6) / 1_000_000,
        ),
        ...(proposedWorkout ? { proposedWorkout } : {}),
        ...(conv.modality == null && aiResult.content.length > 0 ? {} : {}),
      })
      .where(eq(workoutCreationConversations.id, id))

    return {
      data: {
        message: assistantMsg ? formatMessage(assistantMsg) : null,
        readyToPropose: aiResult.readyToPropose,
        proposedWorkout,
        conversationStatus: nextStatus,
      },
    }
  })

  // ── GET /:id ─────────────────────────────────────────────────────────────────
  fastify.get('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string }

    const [conv] = await db
      .select()
      .from(workoutCreationConversations)
      .where(
        and(
          eq(workoutCreationConversations.id, id),
          eq(workoutCreationConversations.personalId, request.userId),
        ),
      )
      .limit(1)

    if (!conv) return reply.notFound('Conversa não encontrada')

    const messages = await db
      .select()
      .from(aiChatMessages)
      .where(eq(aiChatMessages.conversationId, id))
      .orderBy(asc(aiChatMessages.createdAt))

    return {
      data: {
        id: conv.id,
        status: conv.status,
        modality: conv.modality,
        goal: conv.goal,
        detectedRestrictions: tryParseJson<string[]>(conv.detectedRestrictions),
        proposedWorkout: conv.proposedWorkout,
        resultingWorkoutId: conv.resultingWorkoutId,
        totalTurns: conv.totalTurns,
        createdAt: conv.createdAt.toISOString(),
        authorizedAt: conv.authorizedAt?.toISOString() ?? null,
        messages: messages.map(formatMessage),
      },
    }
  })

  // ── POST /:id/authorize ──────────────────────────────────────────────────────
  fastify.post('/:id/authorize', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const parsed = authorizeChatSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.badRequest(parsed.error.issues[0]?.message ?? 'Dados inválidos')
    }

    const [conv] = await db
      .select()
      .from(workoutCreationConversations)
      .where(
        and(
          eq(workoutCreationConversations.id, id),
          eq(workoutCreationConversations.personalId, request.userId),
        ),
      )
      .limit(1)

    if (!conv) return reply.notFound('Conversa não encontrada')
    if (conv.status !== 'awaiting_authorization') {
      return reply.badRequest('Conversa não está aguardando autorização')
    }

    // Re-validate proposed workout (defense in depth)
    const proposalResult = aiChatWorkoutProposalSchema.safeParse(conv.proposedWorkout)
    if (!proposalResult.success) {
      return reply.code(422).send({
        error: {
          code: 'AI_OUTPUT_INVALID',
          message: 'Proposta de treino inválida — tente gerar novamente.',
        },
      })
    }

    const proposal = proposalResult.data
    const studentId = parsed.data.studentId ?? conv.clientId ?? undefined

    // Resolve exercises: lookup by id or create stub for novel exercises
    const validIds = new Set<string>()
    const exercisesToResolve = [
      ...(proposal.exercises ?? []),
      ...(proposal.warmUp ?? []),
      ...(proposal.coolDown ?? []),
    ]

    const existingIds = exercisesToResolve
      .map((e) => e.exerciseId)
      .filter((id): id is string => id !== undefined)

    if (existingIds.length > 0) {
      const found = await db
        .select({ id: exercises.id })
        .from(exercises)
        .where(inArray(exercises.id, existingIds))
      found.forEach((r) => validIds.add(r.id))
    }

    // Create stub exercises for novel ones
    const stubMap = new Map<string, string>() // proposed name → new uuid
    for (const ex of exercisesToResolve) {
      if (ex.exerciseId && !validIds.has(ex.exerciseId)) {
        // AI hallucinated an id — treat as novel
        ex.exerciseId = undefined
      }
      if (!ex.exerciseId && !stubMap.has(ex.name)) {
        const [stub] = await db
          .insert(exercises)
          .values({
            name: ex.name,
            muscleGroup: '[]',
            modality: JSON.stringify([proposal.modality]),
            equipment: '[]',
            source: 'personal',
            ownerId: request.userId,
            isPublic: false,
          })
          .returning({ id: exercises.id })
        if (stub) stubMap.set(ex.name, stub.id)
      }
    }

    function resolveExerciseId(name: string, exerciseId?: string): string {
      if (exerciseId && validIds.has(exerciseId)) return exerciseId
      return stubMap.get(name) ?? ''
    }

    // Create the workout
    const [workout] = await db
      .insert(workouts)
      .values({
        personalId: request.userId,
        studentId,
        title: proposal.title,
        modality: proposal.modality,
        estimatedDurationMin: proposal.estimatedDurationMin,
        aiGenerated: true,
        aiPromptSnapshot: { conversationId: id },
        status: 'draft',
      })
      .returning()

    if (!workout) return reply.internalServerError('Erro ao criar treino')

    const allExercises = [
      ...(proposal.warmUp ?? []).map((e, i) => ({
        workoutId: workout.id,
        exerciseId: resolveExerciseId(e.name, e.exerciseId),
        order: -(proposal.exercises.length + i + 1),
        sets: e.sets,
        reps: e.reps,
        ...(e.load ? { load: e.load } : {}),
        ...(e.restSeconds != null ? { restSeconds: e.restSeconds } : {}),
        notes: `[aquecimento]${e.notes ? ` ${e.notes}` : ''}`,
      })),
      ...proposal.exercises.map((e) => ({
        workoutId: workout.id,
        exerciseId: resolveExerciseId(e.name, e.exerciseId),
        order: e.order,
        sets: e.sets,
        reps: e.reps,
        ...(e.load ? { load: e.load } : {}),
        ...(e.restSeconds != null ? { restSeconds: e.restSeconds } : {}),
        ...(e.notes ? { notes: e.notes } : {}),
      })),
    ].filter((e) => e.exerciseId !== '')

    if (allExercises.length > 0) {
      await db.insert(workoutExercises).values(allExercises)
    }

    const now = new Date()

    await db
      .update(workoutCreationConversations)
      .set({
        status: 'authorized',
        resultingWorkoutId: workout.id,
        authorizedAt: now,
      })
      .where(eq(workoutCreationConversations.id, id))

    // Single aiUsageLog entry for the whole conversation
    await db.insert(aiUsageLog).values({
      personalId: request.userId,
      feature: 'chat_workout_creation',
      model: 'gpt-4o-mini',
      tokensInput: conv.tokensInput ?? 0,
      tokensOutput: conv.tokensOutput ?? 0,
      tokensCached: 0,
      costUsd: conv.costUsd ?? '0',
      latencyMs: null,
      success: true,
    })

    return reply.code(201).send({
      data: {
        workoutId: workout.id,
        conversationId: id,
      },
    })
  })

  // ── POST /:id/discard ────────────────────────────────────────────────────────
  fastify.post('/:id/discard', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string }

    const [conv] = await db
      .select()
      .from(workoutCreationConversations)
      .where(
        and(
          eq(workoutCreationConversations.id, id),
          eq(workoutCreationConversations.personalId, request.userId),
        ),
      )
      .limit(1)

    if (!conv) return reply.notFound('Conversa não encontrada')

    if (conv.status !== 'in_progress' && conv.status !== 'awaiting_authorization') {
      return reply.badRequest('Conversa não pode ser descartada neste estado')
    }

    await db
      .update(workoutCreationConversations)
      .set({ status: 'discarded' })
      .where(eq(workoutCreationConversations.id, id))

    await db.insert(aiUsageLog).values({
      personalId: request.userId,
      feature: 'chat_workout_creation',
      model: 'gpt-4o-mini',
      tokensInput: conv.tokensInput ?? 0,
      tokensOutput: conv.tokensOutput ?? 0,
      tokensCached: 0,
      costUsd: conv.costUsd ?? '0',
      latencyMs: null,
      success: false,
    })

    return reply.code(204).send()
  })

  // ── POST /:id/refine ─────────────────────────────────────────────────────────
  fastify.post('/:id/refine', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string }

    const [conv] = await db
      .select({ status: workoutCreationConversations.status })
      .from(workoutCreationConversations)
      .where(
        and(
          eq(workoutCreationConversations.id, id),
          eq(workoutCreationConversations.personalId, request.userId),
        ),
      )
      .limit(1)

    if (!conv) return reply.notFound('Conversa não encontrada')
    if (conv.status !== 'authorized') {
      return reply.badRequest('Só é possível refinar conversas já autorizadas')
    }

    await db
      .update(workoutCreationConversations)
      .set({ status: 'in_progress', proposedWorkout: null })
      .where(eq(workoutCreationConversations.id, id))

    return { data: { conversationId: id, status: 'in_progress' } }
  })
}
