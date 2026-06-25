import { and, desc, eq, getTableColumns, gt, isNotNull, isNull, ne, sql } from 'drizzle-orm'
import { randomBytes } from 'node:crypto'
import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import {
  db,
  personals,
  personalInvites,
  students,
  anamneses,
  workouts,
  workoutExercises,
  exercises,
  workoutSessions,
} from '@athletiqlab/db'
import { PLAN_LIMITS } from '@athletiqlab/shared'
import { generateStudentReport } from '../lib/report'

const anamneseBodySchema = z.object({
  weightKg: z.string().optional(),
  heightCm: z.string().optional(),
  bodyFatPct: z.string().optional(),
  goal: z.enum(['hypertrophy', 'weight_loss', 'conditioning', 'rehab', 'general_health']),
  experienceLevel: z.enum(['beginner', 'intermediate', 'advanced']),
  weeklyFrequency: z.number().int().min(1).max(7),
  restrictions: z.array(z.string()).default([]),
  medications: z.array(z.string()).default([]),
  medicalNotes: z.string().max(2000).optional(),
})

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
    const [row] = await db
      .select({
        ...getTableColumns(students),
        brandPrimaryColor: sql<
          string | null
        >`case when ${personals.plan} = 'elite' then ${personals.brandColor} else null end`,
        brandLogoUrl: sql<
          string | null
        >`case when ${personals.plan} = 'elite' then ${personals.brandLogoUrl} else null end`,
        professionalName: personals.name,
      })
      .from(students)
      .innerJoin(personals, eq(personals.userId, students.personalId))
      .where(eq(students.userId, request.userId))
      .limit(1)

    if (!row) return reply.notFound('Perfil de aluno não encontrado')
    return { data: row }
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
      .select({
        ...getTableColumns(students),
        hasAnamnese: sql<boolean>`exists(select 1 from ${anamneses} where ${anamneses.studentId} = ${students.userId})`,
      })
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

  // GET /students/:id/anamnese — latest anamnese for a student (personal only)
  fastify.get('/:id/anamnese', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string }

    const [student] = await db
      .select({ userId: students.userId })
      .from(students)
      .where(and(eq(students.userId, id), eq(students.personalId, request.userId)))
      .limit(1)

    if (!student) return reply.notFound('Aluno não encontrado')

    const [anamnese] = await db
      .select()
      .from(anamneses)
      .where(eq(anamneses.studentId, id))
      .orderBy(desc(anamneses.createdAt))
      .limit(1)

    if (!anamnese) return reply.notFound('Anamnese não preenchida')
    return { data: anamnese }
  })

  // GET /students/:id/anamnese/status
  fastify.get(
    '/:id/anamnese/status',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string }

      const [student] = await db
        .select({ userId: students.userId })
        .from(students)
        .where(and(eq(students.userId, id), eq(students.personalId, request.userId)))
        .limit(1)

      if (!student) return reply.notFound('Aluno não encontrado')

      const [latest] = await db
        .select({ updatedAt: anamneses.updatedAt })
        .from(anamneses)
        .where(eq(anamneses.studentId, id))
        .orderBy(desc(anamneses.createdAt))
        .limit(1)

      return { data: { filled: !!latest, lastUpdated: latest?.updatedAt ?? null } }
    },
  )

  // POST /students/:id/anamnese — create new anamnese version
  fastify.post('/:id/anamnese', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const parsed = anamneseBodySchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.badRequest(parsed.error.issues[0]?.message ?? 'Dados inválidos')
    }

    const [student] = await db
      .select({ userId: students.userId })
      .from(students)
      .where(and(eq(students.userId, id), eq(students.personalId, request.userId)))
      .limit(1)

    if (!student) return reply.notFound('Aluno não encontrado')

    const { restrictions, medications, ...rest } = parsed.data
    const [created] = await db
      .insert(anamneses)
      .values({
        studentId: id,
        ...rest,
        restrictions: JSON.stringify(restrictions),
        medications: JSON.stringify(medications),
        signedAt: new Date(),
      })
      .returning()

    return reply.code(201).send({ data: created })
  })

  // GET /students/:id/report — PDF report for a student (professional only)
  fastify.get('/:id/report', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string }

    const [student] = await db
      .select({
        name: students.name,
        birthDate: students.birthDate,
        gender: students.gender,
      })
      .from(students)
      .where(and(eq(students.userId, id), eq(students.personalId, request.userId)))
      .limit(1)

    if (!student) return reply.notFound('Aluno não encontrado')

    const [personal] = await db
      .select({ name: personals.name, cref: personals.cref })
      .from(personals)
      .where(eq(personals.userId, request.userId))
      .limit(1)

    if (!personal) return reply.notFound()

    const [anamnese] = await db
      .select()
      .from(anamneses)
      .where(eq(anamneses.studentId, id))
      .orderBy(desc(anamneses.createdAt))
      .limit(1)

    const studentWorkouts = await db
      .select({
        id: workouts.id,
        title: workouts.title,
        modality: workouts.modality,
        estimatedDurationMin: workouts.estimatedDurationMin,
        publishedAt: workouts.publishedAt,
      })
      .from(workouts)
      .where(and(eq(workouts.studentId, id), eq(workouts.status, 'published')))
      .orderBy(desc(workouts.publishedAt))

    const workoutList = await Promise.all(
      studentWorkouts.map(async (w) => {
        const exRows = await db
          .select({
            order: workoutExercises.order,
            sets: workoutExercises.sets,
            reps: workoutExercises.reps,
            load: workoutExercises.load,
            restSeconds: workoutExercises.restSeconds,
            exerciseName: exercises.name,
            muscleGroup: exercises.muscleGroup,
          })
          .from(workoutExercises)
          .innerJoin(exercises, eq(exercises.id, workoutExercises.exerciseId))
          .where(eq(workoutExercises.workoutId, w.id))
          .orderBy(workoutExercises.order)

        return { ...w, exercises: exRows }
      }),
    )

    const sessionRows = await db
      .select({
        startedAt: workoutSessions.startedAt,
        endedAt: workoutSessions.endedAt,
        totalVolumeKg: workoutSessions.totalVolumeKg,
        avgHrBpm: workoutSessions.avgHrBpm,
        rpe: workoutSessions.rpe,
        workoutId: workoutSessions.workoutId,
      })
      .from(workoutSessions)
      .where(and(eq(workoutSessions.studentId, id), isNotNull(workoutSessions.endedAt)))
      .orderBy(desc(workoutSessions.startedAt))
      .limit(20)

    const workoutTitleMap = new Map(studentWorkouts.map((w) => [w.id, w.title]))
    const sessions = sessionRows.map((s) => ({
      ...s,
      workoutTitle: workoutTitleMap.get(s.workoutId) ?? 'Treino',
    }))

    const [totals] = await db
      .select({
        totalSessions: sql<number>`count(*)::int`.as('total_sessions'),
        totalVolumeKg:
          sql<number>`coalesce(sum(${workoutSessions.totalVolumeKg}::numeric), 0)::float`.as(
            'total_volume_kg',
          ),
      })
      .from(workoutSessions)
      .where(and(eq(workoutSessions.studentId, id), isNotNull(workoutSessions.endedAt)))

    const pdfBuffer = await generateStudentReport({
      professional: { name: personal.name, cref: personal.cref },
      student: { name: student.name, birthDate: student.birthDate, gender: student.gender },
      anamnese: anamnese ?? null,
      workouts: workoutList,
      sessions,
      totals: totals ?? { totalSessions: 0, totalVolumeKg: 0 },
    })

    const filename = `relatorio-${student.name.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().slice(0, 10)}.pdf`

    return reply
      .header('Content-Type', 'application/pdf')
      .header('Content-Disposition', `attachment; filename="${filename}"`)
      .send(pdfBuffer)
  })
}
