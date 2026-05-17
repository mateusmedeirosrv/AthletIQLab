import { z } from 'zod'

export const crefSchema = z
  .string()
  .regex(/^\d{6}-[A-Z]\/[A-Z]{2}$/, 'CREF inválido. Formato esperado: 123456-G/SP')

export const personalProfileSchema = z.object({
  name: z.string().min(2).max(100),
  cref: crefSchema,
  bio: z.string().max(500).optional(),
})

export const studentProfileSchema = z.object({
  name: z.string().min(2).max(100),
  birthDate: z.string().date().optional(),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
})

export const anamneseSchema = z.object({
  weightKg: z.number().min(20).max(300).optional(),
  heightCm: z.number().min(100).max(250).optional(),
  bodyFatPct: z.number().min(3).max(60).optional(),
  goal: z.enum(['hypertrophy', 'weight_loss', 'conditioning', 'rehab', 'general_health']),
  experienceLevel: z.enum(['beginner', 'intermediate', 'advanced']),
  weeklyFrequency: z.number().int().min(1).max(7),
  restrictions: z.array(z.string()).default([]),
  medications: z.array(z.string()).default([]),
  medicalNotes: z.string().max(2000).optional(),
})

export type PersonalProfileInput = z.infer<typeof personalProfileSchema>
export type StudentProfileInput = z.infer<typeof studentProfileSchema>
export type AnamneseInput = z.infer<typeof anamneseSchema>
