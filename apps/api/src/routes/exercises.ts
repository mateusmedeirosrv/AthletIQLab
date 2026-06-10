import { and, eq, ilike, or, sql } from 'drizzle-orm'
import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { db, exercises, personals } from '@athletiqlab/db'
import { PLAN_LIMITS } from '@athletiqlab/shared'

const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm']
const MAX_VIDEO_BYTES = 500 * 1024 * 1024 // 500 MB

function getR2Client() {
  const accountId = process.env['CLOUDFLARE_ACCOUNT_ID']
  const accessKey = process.env['CLOUDFLARE_R2_ACCESS_KEY']
  const secretKey = process.env['CLOUDFLARE_R2_SECRET_KEY']
  if (!accountId || !accessKey || !secretKey) {
    throw new Error('R2 credentials not configured')
  }
  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
  })
}

const createExerciseSchema = z.object({
  name: z.string().min(2).max(200),
  description: z.string().max(1000).optional(),
  techniqueTips: z.string().max(1000).optional(),
  muscleGroup: z.array(z.string()).default([]),
  modality: z.array(z.string()).default([]),
  equipment: z.array(z.string()).default([]),
  level: z.enum(['beginner', 'intermediate', 'advanced']).default('beginner'),
  contraindications: z.array(z.string()).default([]),
})

const updateExerciseSchema = createExerciseSchema.partial()

const uploadVideoSchema = z.object({
  filename: z.string().min(1),
  contentType: z.enum(['video/mp4', 'video/quicktime', 'video/webm']),
  exerciseId: z.string().uuid().optional(),
})

const youtubeExerciseSchema = z.object({
  url: z.string().url(),
  name: z.string().min(2).max(200),
  description: z.string().max(1000).optional(),
  muscleGroup: z.array(z.string()).default([]),
  modality: z.array(z.string()).default([]),
  equipment: z.array(z.string()).default([]),
  level: z.enum(['beginner', 'intermediate', 'advanced']).default('beginner'),
})

const listQuerySchema = z.object({
  search: z.string().optional(),
  level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  modality: z.string().optional(),
  muscleGroup: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
})

export const exerciseRoutes: FastifyPluginAsync = async (fastify) => {
  // List exercises from the public library + personal's own exercises
  fastify.get('/', { preHandler: [fastify.authenticate] }, async (request, _reply) => {
    const parsed = listQuerySchema.safeParse(request.query)
    if (!parsed.success) {
      return _reply.badRequest(parsed.error.issues[0]?.message ?? 'Query inválida')
    }

    const { search, level, modality, muscleGroup, page, limit } = parsed.data
    const offset = (page - 1) * limit

    const conditions = [or(eq(exercises.isPublic, true), eq(exercises.ownerId, request.userId))]

    if (level) conditions.push(eq(exercises.level, level))
    if (search) conditions.push(ilike(exercises.name, `%${search}%`))
    // JSON text array filters via LIKE (simple, avoids casting overhead for MVP)
    if (modality)
      conditions.push(sql`${exercises.modality}::jsonb @> ${JSON.stringify([modality])}::jsonb`)
    if (muscleGroup)
      conditions.push(
        sql`${exercises.muscleGroup}::jsonb @> ${JSON.stringify([muscleGroup])}::jsonb`,
      )

    const rows = await db
      .select()
      .from(exercises)
      .where(and(...(conditions as [ReturnType<typeof eq>])))
      .orderBy(exercises.name)
      .limit(limit)
      .offset(offset)

    return { data: rows, page, limit }
  })

  // Get single exercise
  fastify.get('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string }

    const [exercise] = await db
      .select()
      .from(exercises)
      .where(
        and(
          eq(exercises.id, id),
          or(eq(exercises.isPublic, true), eq(exercises.ownerId, request.userId)),
        ),
      )
      .limit(1)

    if (!exercise) return reply.notFound('Exercício não encontrado')
    return { data: exercise }
  })

  // POST /exercises — create a custom exercise
  fastify.post('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const parsed = createExerciseSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.badRequest(parsed.error.issues[0]?.message ?? 'Dados inválidos')
    }

    const { muscleGroup, modality, equipment, contraindications, ...rest } = parsed.data
    const [created] = await db
      .insert(exercises)
      .values({
        ...rest,
        muscleGroup: JSON.stringify(muscleGroup),
        modality: JSON.stringify(modality),
        equipment: JSON.stringify(equipment),
        contraindications: JSON.stringify(contraindications),
        source: 'personal',
        ownerId: request.userId,
        isPublic: false,
      })
      .returning()

    return reply.code(201).send({ data: created })
  })

  // POST /exercises/upload-video — get presigned R2 POST URL
  fastify.post('/upload-video', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    // Check plan allows custom video uploads
    const [personal] = await db
      .select({ plan: personals.plan })
      .from(personals)
      .where(eq(personals.userId, request.userId))
      .limit(1)

    if (personal && !PLAN_LIMITS[personal.plan].customVideos) {
      return reply.code(402).send({
        error: {
          code: 'PLAN_LIMIT_EXCEEDED',
          message: `Upload de vídeo próprio está disponível nos planos Pro e Elite. Faça upgrade para continuar.`,
        },
      })
    }

    const parsed = uploadVideoSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.badRequest(parsed.error.issues[0]?.message ?? 'Dados inválidos')
    }

    if (!ALLOWED_VIDEO_TYPES.includes(parsed.data.contentType)) {
      return reply.badRequest('Tipo de vídeo não suportado')
    }

    const bucket = process.env['CLOUDFLARE_R2_BUCKET'] ?? 'athletiqlab-videos'
    const key = `exercises/${request.userId}/${Date.now()}-${parsed.data.filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`

    let r2Client: S3Client
    try {
      r2Client = getR2Client()
    } catch {
      return reply.internalServerError('Serviço de upload não configurado')
    }

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: parsed.data.contentType,
      ContentLength: MAX_VIDEO_BYTES,
    })
    const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: 900 })

    return { data: { uploadUrl, key } }
  })

  // POST /exercises/youtube — create exercise from YouTube/Vimeo URL
  fastify.post('/youtube', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const parsed = youtubeExerciseSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.badRequest(parsed.error.issues[0]?.message ?? 'Dados inválidos')
    }

    const { url, muscleGroup, modality, equipment, ...rest } = parsed.data

    const isYoutube = /youtube\.com|youtu\.be/.test(url)
    const isVimeo = /vimeo\.com/.test(url)
    if (!isYoutube && !isVimeo) {
      return reply.badRequest('URL deve ser do YouTube ou Vimeo')
    }

    let thumbnailUrl: string | undefined
    if (isYoutube) {
      const match = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
      if (match?.[1]) {
        thumbnailUrl = `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`
      }
    }

    const [created] = await db
      .insert(exercises)
      .values({
        ...rest,
        muscleGroup: JSON.stringify(muscleGroup),
        modality: JSON.stringify(modality),
        equipment: JSON.stringify(equipment),
        contraindications: JSON.stringify([]),
        videoUrl: url,
        videoProvider: isYoutube ? 'youtube' : 'vimeo',
        thumbnailUrl,
        source: 'external_link',
        ownerId: request.userId,
        isPublic: false,
      })
      .returning()

    return reply.code(201).send({ data: created })
  })

  // PATCH /exercises/:id — update own exercise
  fastify.patch('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const parsed = updateExerciseSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.badRequest(parsed.error.issues[0]?.message ?? 'Dados inválidos')
    }

    const [existing] = await db
      .select({ id: exercises.id })
      .from(exercises)
      .where(and(eq(exercises.id, id), eq(exercises.ownerId, request.userId)))
      .limit(1)

    if (!existing) return reply.notFound('Exercício não encontrado ou sem permissão')

    const { muscleGroup, modality, equipment, contraindications, ...rest } = parsed.data
    const updateValues: Record<string, unknown> = { ...rest, updatedAt: new Date() }
    if (muscleGroup) updateValues['muscleGroup'] = JSON.stringify(muscleGroup)
    if (modality) updateValues['modality'] = JSON.stringify(modality)
    if (equipment) updateValues['equipment'] = JSON.stringify(equipment)
    if (contraindications) updateValues['contraindications'] = JSON.stringify(contraindications)

    const [updated] = await db
      .update(exercises)
      .set(updateValues)
      .where(eq(exercises.id, id))
      .returning()

    return { data: updated }
  })

  // DELETE /exercises/:id — delete own exercise
  fastify.delete('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string }

    const [existing] = await db
      .select({ id: exercises.id })
      .from(exercises)
      .where(and(eq(exercises.id, id), eq(exercises.ownerId, request.userId)))
      .limit(1)

    if (!existing) return reply.notFound('Exercício não encontrado ou sem permissão')

    await db.delete(exercises).where(eq(exercises.id, id))

    return reply.code(204).send()
  })
}
