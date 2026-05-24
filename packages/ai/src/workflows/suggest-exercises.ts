import type { Plan } from '@athletiqlab/shared'
import { aiSuggestExercisesOutputSchema } from '@athletiqlab/shared'
import type { AiSuggestExercisesOutput } from '@athletiqlab/shared'

import { SYSTEM_PROMPT } from '../prompts/system'
import { callWithValidation } from '../guardrails/validate-output'
import type { ExerciseLibraryItem } from './generate-workout'

export interface SuggestExercisesParams {
  personalId: string
  plan: Plan
  muscleGroups: string[]
  modality: string
  equipment: string[]
  experienceLevel: string
  restrictions: string[]
  exerciseLibrary: ExerciseLibraryItem[]
  count?: number
}

export async function suggestExercises(
  params: SuggestExercisesParams,
): Promise<AiSuggestExercisesOutput> {
  return callWithValidation({
    schema: aiSuggestExercisesOutputSchema,
    personalId: params.personalId,
    feature: 'suggest_exercises',
    plan: params.plan,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: JSON.stringify({
          task: 'suggest_exercises',
          muscleGroups: params.muscleGroups,
          modality: params.modality,
          equipment: params.equipment,
          experienceLevel: params.experienceLevel,
          restrictions: params.restrictions,
          exerciseLibrary: params.exerciseLibrary,
          count: params.count ?? 5,
          outputSchema: 'AiSuggestExercisesOutput',
          instructions:
            'Return exerciseIds from the provided exerciseLibrary that best match the criteria.',
        }),
      },
    ],
  })
}
