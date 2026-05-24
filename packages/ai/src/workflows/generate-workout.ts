import type { Plan } from '@athletiqlab/shared'
import type { AiGenerateWorkoutOutput } from '@athletiqlab/shared'
import { aiGenerateWorkoutOutputSchema, aiRefusalSchema } from '@athletiqlab/shared'
import { z } from 'zod'

import { SYSTEM_PROMPT } from '../prompts/system'
import { callWithValidation } from '../guardrails/validate-output'

export interface ExerciseLibraryItem {
  id: string
  name: string
  muscleGroup: string[]
  modality: string[]
  equipment: string[]
  level: string
}

export interface GenerateWorkoutParams {
  personalId: string
  plan: Plan
  student: {
    age?: number | undefined
    gender?: string | undefined
    weightKg?: number | undefined
    heightCm?: number | undefined
    goal: string
    experienceLevel: string
    weeklyFrequency: number
    sessionDurationMin?: number | undefined
    restrictions: string[]
  }
  preferences: {
    modality: string
    equipmentAvailable: string[]
    focusMuscles?: string[] | undefined
  }
  exerciseLibrary: ExerciseLibraryItem[]
  usePremium?: boolean
}

const responseSchema = z.union([aiGenerateWorkoutOutputSchema, aiRefusalSchema])

export async function generateWorkout(
  params: GenerateWorkoutParams,
): Promise<AiGenerateWorkoutOutput | { refusal: string }> {
  return callWithValidation({
    schema: responseSchema,
    personalId: params.personalId,
    feature: 'generate_workout',
    plan: params.plan,
    usePremium: params.usePremium ?? false,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: JSON.stringify({
          task: 'generate_workout',
          student: params.student,
          preferences: params.preferences,
          exerciseLibrary: params.exerciseLibrary,
          outputSchema: 'AiGenerateWorkoutOutput',
          instructions:
            'Use ONLY exerciseId values from the provided exerciseLibrary. Return a complete workout plan as JSON.',
        }),
      },
    ],
  })
}
