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

const OUTPUT_SCHEMA_EXAMPLE = `{
  "title": "Treino Peito e Costas - Intermediário",
  "modality": "academia",
  "estimatedDurationMin": 60,
  "exercises": [
    {
      "exerciseId": "<UUID do exercício da biblioteca>",
      "order": 1,
      "sets": 4,
      "reps": "8-12",
      "load": "70% 1RM",
      "restSeconds": 90,
      "notes": "Controle a descida por 3 segundos"
    }
  ],
  "warmUp": [
    {
      "exerciseId": "<UUID do exercício da biblioteca>",
      "order": 1,
      "sets": 2,
      "reps": "15",
      "restSeconds": 30
    }
  ],
  "safetyNotes": ["Evite travar os cotovelos no supino"]
}`

export async function generateWorkout(
  params: GenerateWorkoutParams,
): Promise<AiGenerateWorkoutOutput | { refusal: string }> {
  const libraryFormatted = params.exerciseLibrary
    .map(
      (e) =>
        `• ID: ${e.id} | Nome: ${e.name} | Músculos: ${e.muscleGroup.join(', ')} | Nível: ${e.level} | Equipamento: ${e.equipment.join(', ')}`,
    )
    .join('\n')

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
        content: `Monte um treino de ${params.preferences.modality} com as seguintes especificações:

ALUNO:
- Objetivo: ${params.student.goal}
- Nível: ${params.student.experienceLevel}
- Frequência: ${params.student.weeklyFrequency}x por semana
- Duração da sessão: ${params.student.sessionDurationMin ?? 60} minutos
${params.student.age ? `- Idade: ${params.student.age} anos` : ''}
${params.student.weightKg ? `- Peso: ${params.student.weightKg}kg` : ''}
${params.student.restrictions.length > 0 ? `- Restrições: ${params.student.restrictions.join(', ')}` : '- Sem restrições'}

PREFERÊNCIAS:
- Modalidade: ${params.preferences.modality}
- Equipamentos: ${params.preferences.equipmentAvailable.length > 0 ? params.preferences.equipmentAvailable.join(', ') : 'padrão de academia'}
${params.preferences.focusMuscles ? `- Músculos foco: ${params.preferences.focusMuscles.join(', ')}` : ''}

BIBLIOTECA DE EXERCÍCIOS DISPONÍVEIS (use APENAS os IDs listados abaixo):
${libraryFormatted}

INSTRUÇÃO: Responda APENAS com JSON válido. Use os campos "exerciseId" com os UUIDs EXATOS da lista acima. O campo "modality" deve ser UM DESSES valores: academia, funcional, casa, natacao, corrida, laboral.

FORMATO DE RESPOSTA ESPERADO:
${OUTPUT_SCHEMA_EXAMPLE}

Se não conseguir montar o treino, retorne: {"refusal": "motivo"}`,
      },
    ],
  })
}
