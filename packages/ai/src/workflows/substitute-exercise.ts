import type { Plan } from '@athletiqlab/shared'
import { aiSubstituteExerciseOutputSchema } from '@athletiqlab/shared'
import type { AiSubstituteExerciseOutput } from '@athletiqlab/shared'

import { SYSTEM_PROMPT } from '../prompts/system'
import { callWithValidation } from '../guardrails/validate-output'
import type { ExerciseLibraryItem } from './generate-workout'

export interface SubstituteExerciseParams {
  personalId: string
  plan: Plan
  exerciseId: string
  exerciseName: string
  reason: string
  restrictions: string[]
  equipment: string[]
  exerciseLibrary: ExerciseLibraryItem[]
}

export async function substituteExercise(
  params: SubstituteExerciseParams,
): Promise<AiSubstituteExerciseOutput> {
  return callWithValidation({
    schema: aiSubstituteExerciseOutputSchema,
    personalId: params.personalId,
    feature: 'substitute',
    plan: params.plan,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: JSON.stringify({
          task: 'substitute_exercise',
          exerciseId: params.exerciseId,
          exerciseName: params.exerciseName,
          reason: params.reason,
          restrictions: params.restrictions,
          equipment: params.equipment,
          exerciseLibrary: params.exerciseLibrary,
          outputSchema: 'AiSubstituteExerciseOutput',
          instructions:
            'Return a single exerciseId from the provided exerciseLibrary to replace the given exercise.',
        }),
      },
    ],
  })
}
