import { and, eq } from 'drizzle-orm'
import type { FastifyPluginAsync, FastifyReply } from 'fastify'
import { z } from 'zod'
import { db, exercises, personals, workouts, workoutExercises } from '@athletiqlab/db'
import {
  AiOutputInvalidError,
  AiRateLimitError,
  generateWorkout,
  suggestExercises,
  substituteExercise,
  validateWorkout,
} from '@athletiqlab/ai'
import type { ExerciseLibraryItem } from '@athletiqlab/ai'

// ─── Schemas ────────────────────────────────────────────────────────────────

const workoutExerciseInputSchema = z.object({
  exerciseId: z.string().uuid(),
  order: z.number().int().min(1),
  sets: z.number().int().min(1),
  reps: z.string().min(1),
  load: z.string().optional(),
  restSeconds: z.number().int().optional(),
  notes: z.string().optional(),
  tempo: z.string().optional(),
})

const createWorkoutSchema = z.object({
  title: z.string().min(2).max(100),
  modality: z.string().min(1),
  estimatedDurationMin: z.number().int().min(5).max(240).optional(),
  studentId: z.string().uuid().optional(),
  exercises: z.array(workoutExerciseInputSchema).optional(),
})

const updateWorkoutSchema = z.object({
  title: z.string().min(2).max(100).optional(),
  modality: z.string().min(1).optional(),
  estimatedDurationMin: z.number().int().min(5).max(240).optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  studentId: z.string().uuid().nullable().optional(),
})

const generateWorkoutSchema = z.object({
  studentId: z.string().uuid().optional(),
  student: z.object({
    age: z.number().int().optional(),
    gender: z.string().optional(),
    weightKg: z.number().optional(),
    heightCm: z.number().optional(),
    goal: z.string().min(2),
    experienceLevel: z.enum(['beginner', 'intermediate', 'advanced']),
    weeklyFrequency: z.number().int().min(1).max(7),
    sessionDurationMin: z.number().int().optional(),
    restrictions: z.array(z.string()).default([]),
  }),
  preferences: z.object({
    modality: z.string().min(1),
    equipmentAvailable: z.array(z.string()).default([]),
    focusMuscles: z.array(z.string()).optional(),
  }),
  saveDraft: z.boolean().default(true),
  usePremium: z.boolean().default(false),
})

const suggestExercisesSchema = z.object({
  muscleGroups: z.array(z.string()).min(1),
  modality: z.string().min(1),
  equipment: z.array(z.string()).default([]),
  experienceLevel: z.enum(['beginner', 'intermediate', 'advanced']),
  restrictions: z.array(z.string()).default([]),
  count: z.number().int().min(1).max(20).default(5),
})

const substituteExerciseSchema = z.object({
  reason: z.string().min(2),
  restrictions: z.array(z.string()).default([]),
  equipment: z.array(z.string()).default([]),
})

const validateWorkoutSchema = z.object({
  student: z.object({
    goal: z.string().min(2),
    experienceLevel: z.enum(['beginner', 'intermediate', 'advanced']),
    restrictions: z.array(z.string()).default([]),
  }),
  usePremium: z.boolean().default(false),
})

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function getPersonalPlan(personalId: string) {
  const [p] = await db
    .select({ plan: personals.plan })
    .from(personals)
    .where(eq(personals.userId, personalId))
    .limit(1)
  return p?.plan ?? ('starter' as const)
}

async function getPublicExerciseLibrary(): Promise<ExerciseLibraryItem[]> {
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

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    muscleGroup: tryParseJson<string[]>(r.muscleGroup),
    modality: tryParseJson<string[]>(r.modality),
    equipment: tryParseJson<string[]>(r.equipment),
    level: r.level,
  }))
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
    void reply.code(429).send({ error: { code: 'AI_RATE_LIMIT', message: err.message } })
    return
  }
  if (err instanceof AiOutputInvalidError) {
    void reply.internalServerError(err.message)
    return
  }
  throw err
}

// Strip undefined values so exactOptionalPropertyTypes is satisfied
function defined<T extends Record<string, unknown>>(obj: T): T {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as T
}

// ─── Routes ─────────────────────────────────────────────────────────────────

export const workoutRoutes: FastifyPluginAsync = async (fastify) => {
  // ── List workouts ──────────────────────────────────────────────────────────
  fastify.get('/', { preHandler: [fastify.authenticate] }, async (request) => {
    const list = await db
      .select()
      .from(workouts)
      .where(eq(workouts.personalId, request.userId))
      .orderBy(workouts.createdAt)

    return { data: list }
  })

  // ── Create workout (manual) ────────────────────────────────────────────────
  fastify.post('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const parsed = createWorkoutSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.badRequest(parsed.error.issues[0]?.message ?? 'Dados inválidos')
    }

    const { exercises: exList, ...workoutData } = parsed.data

    const [workout] = await db
      .insert(workouts)
      .values(defined({ ...workoutData, personalId: request.userId }))
      .returning()

    if (workout && exList?.length) {
      await db
        .insert(workoutExercises)
        .values(exList.map((e) => defined({ ...e, workoutId: workout.id })))
    }

    return reply.code(201).send({ data: workout })
  })

  // ── Get workout detail ─────────────────────────────────────────────────────
  fastify.get('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string }

    const [workout] = await db
      .select()
      .from(workouts)
      .where(and(eq(workouts.id, id), eq(workouts.personalId, request.userId)))
      .limit(1)

    if (!workout) return reply.notFound('Treino não encontrado')

    const items = await db
      .select({
        id: workoutExercises.id,
        exerciseId: workoutExercises.exerciseId,
        order: workoutExercises.order,
        sets: workoutExercises.sets,
        reps: workoutExercises.reps,
        load: workoutExercises.load,
        restSeconds: workoutExercises.restSeconds,
        notes: workoutExercises.notes,
        tempo: workoutExercises.tempo,
        exerciseName: exercises.name,
        muscleGroup: exercises.muscleGroup,
      })
      .from(workoutExercises)
      .innerJoin(exercises, eq(workoutExercises.exerciseId, exercises.id))
      .where(eq(workoutExercises.workoutId, id))
      .orderBy(workoutExercises.order)

    return { data: { ...workout, exercises: items } }
  })

  // ── Update workout ─────────────────────────────────────────────────────────
  fastify.patch('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const parsed = updateWorkoutSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.badRequest(parsed.error.issues[0]?.message ?? 'Dados inválidos')
    }

    const updates: Record<string, unknown> = { ...parsed.data, updatedAt: new Date() }
    if (parsed.data.status === 'published') {
      updates['publishedAt'] = new Date()
    }

    const [updated] = await db
      .update(workouts)
      .set(updates)
      .where(and(eq(workouts.id, id), eq(workouts.personalId, request.userId)))
      .returning()

    if (!updated) return reply.notFound('Treino não encontrado')
    return { data: updated }
  })

  // ── Delete workout ─────────────────────────────────────────────────────────
  fastify.delete('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string }

    const [deleted] = await db
      .delete(workouts)
      .where(and(eq(workouts.id, id), eq(workouts.personalId, request.userId)))
      .returning({ id: workouts.id })

    if (!deleted) return reply.notFound('Treino não encontrado')
    return reply.code(204).send()
  })

  // ── AI: Generate workout ───────────────────────────────────────────────────
  fastify.post('/generate', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const parsed = generateWorkoutSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.badRequest(parsed.error.issues[0]?.message ?? 'Dados inválidos')
    }

    const plan = await getPersonalPlan(request.userId)
    const exerciseLibrary = await getPublicExerciseLibrary()
    const { student, preferences } = parsed.data

    let result: Awaited<ReturnType<typeof generateWorkout>>
    try {
      result = await generateWorkout({
        personalId: request.userId,
        plan,
        student: defined({
          goal: student.goal,
          experienceLevel: student.experienceLevel,
          weeklyFrequency: student.weeklyFrequency,
          restrictions: student.restrictions,
          age: student.age,
          gender: student.gender,
          weightKg: student.weightKg,
          heightCm: student.heightCm,
          sessionDurationMin: student.sessionDurationMin,
        }),
        preferences: defined({
          modality: preferences.modality,
          equipmentAvailable: preferences.equipmentAvailable,
          focusMuscles: preferences.focusMuscles,
        }),
        exerciseLibrary,
        usePremium: parsed.data.usePremium,
      })
    } catch (err) {
      handleAiError(reply, err)
      return
    }

    if ('refusal' in result) {
      return reply.code(422).send({ error: { code: 'AI_REFUSAL', message: result.refusal } })
    }

    if (!parsed.data.saveDraft) {
      return reply.code(200).send({ data: result })
    }

    // Persist as draft
    const [workout] = await db
      .insert(workouts)
      .values({
        personalId: request.userId,
        studentId: parsed.data.studentId,
        title: result.title,
        modality: result.modality,
        estimatedDurationMin: result.estimatedDurationMin,
        aiGenerated: true,
        aiPromptSnapshot: { student: parsed.data.student, preferences: parsed.data.preferences },
        status: 'draft',
      })
      .returning()

    if (workout) {
      const mainExercises = result.exercises.map((e) => ({
        workoutId: workout.id,
        exerciseId: e.exerciseId,
        order: e.order,
        sets: e.sets,
        reps: e.reps,
        ...(e.load ? { load: e.load } : {}),
        ...(e.restSeconds != null ? { restSeconds: e.restSeconds } : {}),
        ...(e.notes ? { notes: e.notes } : {}),
      }))

      const warmUpExercises = (result.warmUp ?? []).map((e, i) => ({
        workoutId: workout.id,
        exerciseId: e.exerciseId,
        order: -(result.exercises.length + i + 1),
        sets: e.sets,
        reps: e.reps,
        ...(e.load ? { load: e.load } : {}),
        notes: `[aquecimento]${e.notes ? ` ${e.notes}` : ''}`,
      }))

      const allExercises = [...warmUpExercises, ...mainExercises]
      if (allExercises.length > 0) {
        await db.insert(workoutExercises).values(allExercises)
      }
    }

    return reply.code(201).send({
      data: {
        workoutId: workout?.id,
        workout: result,
        safetyNotes: result.safetyNotes,
      },
    })
  })

  // ── AI: Suggest exercises ──────────────────────────────────────────────────
  fastify.post(
    '/suggest-exercises',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const parsed = suggestExercisesSchema.safeParse(request.body)
      if (!parsed.success) {
        return reply.badRequest(parsed.error.issues[0]?.message ?? 'Dados inválidos')
      }

      const plan = await getPersonalPlan(request.userId)
      const exerciseLibrary = await getPublicExerciseLibrary()

      try {
        const result = await suggestExercises({
          personalId: request.userId,
          plan,
          exerciseLibrary,
          muscleGroups: parsed.data.muscleGroups,
          modality: parsed.data.modality,
          equipment: parsed.data.equipment,
          experienceLevel: parsed.data.experienceLevel,
          restrictions: parsed.data.restrictions,
          count: parsed.data.count,
        })
        return { data: result }
      } catch (err) {
        handleAiError(reply, err)
      }
    },
  )

  // ── AI: Validate workout ───────────────────────────────────────────────────
  fastify.post('/:id/validate', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const parsed = validateWorkoutSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.badRequest(parsed.error.issues[0]?.message ?? 'Dados inválidos')
    }

    const [workout] = await db
      .select({ title: workouts.title, modality: workouts.modality })
      .from(workouts)
      .where(and(eq(workouts.id, id), eq(workouts.personalId, request.userId)))
      .limit(1)
    if (!workout) return reply.notFound('Treino não encontrado')

    const items = await db
      .select({
        exerciseId: workoutExercises.exerciseId,
        exerciseName: exercises.name,
        sets: workoutExercises.sets,
        reps: workoutExercises.reps,
        load: workoutExercises.load,
      })
      .from(workoutExercises)
      .innerJoin(exercises, eq(workoutExercises.exerciseId, exercises.id))
      .where(eq(workoutExercises.workoutId, id))

    const plan = await getPersonalPlan(request.userId)

    try {
      const result = await validateWorkout({
        personalId: request.userId,
        plan,
        workout: {
          title: workout.title,
          modality: workout.modality,
          exercises: items.map((e) => ({
            exerciseId: e.exerciseId,
            exerciseName: e.exerciseName,
            sets: e.sets,
            reps: e.reps,
            ...(e.load != null ? { load: e.load } : {}),
          })),
        },
        student: parsed.data.student,
        usePremium: parsed.data.usePremium,
      })
      return { data: result }
    } catch (err) {
      handleAiError(reply, err)
    }
  })

  // ── AI: Substitute exercise ────────────────────────────────────────────────
  fastify.post(
    '/:id/exercises/:exerciseId/substitute',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const { id, exerciseId } = request.params as { id: string; exerciseId: string }
      const parsed = substituteExerciseSchema.safeParse(request.body)
      if (!parsed.success) {
        return reply.badRequest(parsed.error.issues[0]?.message ?? 'Dados inválidos')
      }

      const [workout] = await db
        .select({ id: workouts.id })
        .from(workouts)
        .where(and(eq(workouts.id, id), eq(workouts.personalId, request.userId)))
        .limit(1)
      if (!workout) return reply.notFound('Treino não encontrado')

      const [exercise] = await db
        .select({ id: exercises.id, name: exercises.name })
        .from(exercises)
        .where(eq(exercises.id, exerciseId))
        .limit(1)
      if (!exercise) return reply.notFound('Exercício não encontrado')

      const plan = await getPersonalPlan(request.userId)
      const exerciseLibrary = await getPublicExerciseLibrary()

      try {
        const result = await substituteExercise({
          personalId: request.userId,
          plan,
          exerciseId,
          exerciseName: exercise.name,
          reason: parsed.data.reason,
          restrictions: parsed.data.restrictions,
          equipment: parsed.data.equipment,
          exerciseLibrary,
        })
        return { data: result }
      } catch (err) {
        handleAiError(reply, err)
      }
    },
  )
}
