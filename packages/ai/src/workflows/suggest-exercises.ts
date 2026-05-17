import { aiSuggestExercisesOutputSchema } from '@athletiqlab/shared'
import type { AiSuggestExercisesOutput } from '@athletiqlab/shared'

import { SYSTEM_PROMPT } from '../prompts/system'
import { callWithValidation } from '../guardrails/validate-output'

interface SuggestExercisesParams {
  muscleGroups: string[]
  modality: string
  equipment: string[]
  experienceLevel: string
  restrictions: string[]
  exerciseLibraryIds: string[]
  count?: number
}

export async function suggestExercises(
  params: SuggestExercisesParams,
): Promise<AiSuggestExercisesOutput> {
  return callWithValidation({
    schema: aiSuggestExercisesOutputSchema,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: JSON.stringify({
          task: 'suggest_exercises',
          ...params,
          outputSchema: 'AiSuggestExercisesOutput',
        }),
      },
    ],
  })
}
