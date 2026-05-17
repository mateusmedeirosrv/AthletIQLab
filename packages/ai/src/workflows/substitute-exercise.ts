import { aiSubstituteExerciseOutputSchema } from '@athletiqlab/shared'
import type { AiSubstituteExerciseOutput } from '@athletiqlab/shared'

import { SYSTEM_PROMPT } from '../prompts/system'
import { callWithValidation } from '../guardrails/validate-output'

interface SubstituteExerciseParams {
  exerciseId: string
  exerciseName: string
  reason: string
  restrictions: string[]
  equipment: string[]
  exerciseLibraryIds: string[]
}

export async function substituteExercise(
  params: SubstituteExerciseParams,
): Promise<AiSubstituteExerciseOutput> {
  return callWithValidation({
    schema: aiSubstituteExerciseOutputSchema,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: JSON.stringify({
          task: 'substitute_exercise',
          ...params,
          outputSchema: 'AiSubstituteExerciseOutput',
        }),
      },
    ],
  })
}
