import type { Plan } from '@athletiqlab/shared'
import { aiValidateWorkoutOutputSchema } from '@athletiqlab/shared'
import type { AiValidateWorkoutOutput } from '@athletiqlab/shared'

import { SYSTEM_PROMPT } from '../prompts/system'
import { callWithValidation } from '../guardrails/validate-output'

export interface ValidateWorkoutParams {
  personalId: string
  plan: Plan
  workout: {
    title: string
    modality: string
    exercises: Array<{
      exerciseId: string
      exerciseName: string
      sets: number
      reps: string
      load?: string
    }>
  }
  student: {
    goal: string
    experienceLevel: string
    restrictions: string[]
  }
  usePremium?: boolean
}

export async function validateWorkout(
  params: ValidateWorkoutParams,
): Promise<AiValidateWorkoutOutput> {
  return callWithValidation({
    schema: aiValidateWorkoutOutputSchema,
    personalId: params.personalId,
    feature: 'validate',
    plan: params.plan,
    usePremium: params.usePremium ?? false,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: JSON.stringify({
          task: 'validate_workout',
          workout: params.workout,
          student: params.student,
          outputSchema: 'AiValidateWorkoutOutput',
        }),
      },
    ],
  })
}
