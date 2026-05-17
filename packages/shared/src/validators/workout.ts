import { z } from 'zod'

export const workoutExerciseSchema = z.object({
  exerciseId: z.string().uuid(),
  order: z.number().int().min(1),
  sets: z.number().int().min(1).max(20),
  reps: z.string().min(1).max(20),
  load: z.string().max(50).optional(),
  restSeconds: z.number().int().min(0).max(600).optional(),
  notes: z.string().max(500).optional(),
  tempo: z.string().max(20).optional(),
})

export const createWorkoutSchema = z.object({
  title: z.string().min(2).max(100),
  modality: z.enum(['academia', 'funcional', 'casa', 'natacao', 'corrida', 'laboral']),
  estimatedDurationMin: z.number().int().min(5).max(240).optional(),
  studentId: z.string().uuid().optional(),
  exercises: z.array(workoutExerciseSchema).min(1),
})

export const sessionLogSchema = z.object({
  completedSets: z.number().int().min(0),
  repsPerSet: z.array(z.number().int().min(0)),
  loadPerSet: z.array(z.number().min(0)),
  skipped: z.boolean().default(false),
})

export type CreateWorkoutInput = z.infer<typeof createWorkoutSchema>
export type SessionLogInput = z.infer<typeof sessionLogSchema>
