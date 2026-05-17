import type { AiGenerateWorkoutOutput } from '@athletiqlab/shared'
import { aiGenerateWorkoutOutputSchema, aiRefusalSchema } from '@athletiqlab/shared'
import { z } from 'zod'

import { SYSTEM_PROMPT } from '../prompts/system'
import { callWithValidation } from '../guardrails/validate-output'

interface GenerateWorkoutParams {
  student: {
    age?: number
    gender?: string
    weightKg?: number
    heightCm?: number
    goal: string
    experienceLevel: string
    weeklyFrequency: number
    sessionDurationMin?: number
    restrictions: string[]
  }
  preferences: {
    modality: string
    equipmentAvailable: string[]
    focusMuscles?: string[]
  }
  exerciseLibraryIds: string[]
  usePremium?: boolean
}

const responseSchema = z.union([aiGenerateWorkoutOutputSchema, aiRefusalSchema])

export async function generateWorkout(
  params: GenerateWorkoutParams,
): Promise<AiGenerateWorkoutOutput | { refusal: string }> {
  return callWithValidation({
    schema: responseSchema,
    usePremium: params.usePremium,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: JSON.stringify({
          task: 'generate_workout',
          student: params.student,
          preferences: params.preferences,
          exerciseLibraryIds: params.exerciseLibraryIds,
          outputSchema: 'AiGenerateWorkoutOutput',
        }),
      },
    ],
  })
}
