import { z } from 'zod'

// Schema validating OpenAI output for workout generation (PRD section 9.3)
const aiExerciseSchema = z.object({
  exerciseId: z.string().uuid(),
  order: z.number().int().min(1),
  sets: z.number().int().min(1),
  reps: z.string().min(1),
  load: z.string().optional(),
  restSeconds: z.number().int().optional(),
  notes: z.string().optional(),
  rationale: z.string().optional(),
})

export const aiGenerateWorkoutOutputSchema = z.object({
  title: z.string().min(2).max(100),
  modality: z.enum(['academia', 'funcional', 'casa', 'natacao', 'corrida', 'laboral']),
  estimatedDurationMin: z.number().int().min(5).max(240),
  exercises: z.array(aiExerciseSchema).min(1),
  warmUp: z.array(aiExerciseSchema).optional(),
  coolDown: z.array(aiExerciseSchema).optional(),
  safetyNotes: z.array(z.string()).optional(),
})

export const aiRefusalSchema = z.object({
  refusal: z.string(),
})

// Top-level: either a valid workout or a refusal
export const aiWorkoutResponseSchema = z.union([aiGenerateWorkoutOutputSchema, aiRefusalSchema])

export const aiSuggestExercisesOutputSchema = z.object({
  exerciseIds: z.array(z.string().uuid()).min(1),
  rationale: z.string().optional(),
})

export const aiSubstituteExerciseOutputSchema = z.object({
  exerciseId: z.string().uuid(),
  rationale: z.string(),
})

export const aiValidateWorkoutOutputSchema = z.object({
  isValid: z.boolean(),
  warnings: z.array(z.string()),
  suggestions: z.array(z.string()),
  contraindications: z.array(z.string()),
})

// Schema for AI-proposed workout in chat flow — modality is open text, exerciseId is optional
const aiChatExerciseSchema = z.object({
  exerciseId: z.string().uuid().optional(),
  name: z.string().min(1),
  order: z.number().int().min(1),
  sets: z.number().int().min(1),
  reps: z.string().min(1),
  load: z.string().optional(),
  restSeconds: z.number().int().optional(),
  notes: z.string().optional(),
  rationale: z.string().optional(),
})

export const aiChatWorkoutProposalSchema = z.object({
  title: z.string().min(2).max(100),
  modality: z.string().min(1),
  estimatedDurationMin: z.number().int().min(5).max(240),
  exercises: z.array(aiChatExerciseSchema).min(1),
  warmUp: z.array(aiChatExerciseSchema).optional(),
  coolDown: z.array(aiChatExerciseSchema).optional(),
  safetyNotes: z.array(z.string()).optional(),
})

export type AiGenerateWorkoutOutput = z.infer<typeof aiGenerateWorkoutOutputSchema>
export type AiSuggestExercisesOutput = z.infer<typeof aiSuggestExercisesOutputSchema>
export type AiSubstituteExerciseOutput = z.infer<typeof aiSubstituteExerciseOutputSchema>
export type AiValidateWorkoutOutput = z.infer<typeof aiValidateWorkoutOutputSchema>
export type AiChatWorkoutProposal = z.infer<typeof aiChatWorkoutProposalSchema>
