'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, Loader2, ChevronRight, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/api'

// ─── Types ───────────────────────────────────────────────────────────────────

interface AiExercise {
  exerciseId: string
  order: number
  sets: number
  reps: string
  load?: string
  restSeconds?: number
  notes?: string
  rationale?: string
}

interface GeneratedWorkout {
  workoutId: string
  workout: {
    title: string
    modality: string
    estimatedDurationMin: number
    exercises: AiExercise[]
    warmUp?: AiExercise[]
    safetyNotes?: string[]
  }
  safetyNotes?: string[]
}

// ─── Constants ───────────────────────────────────────────────────────────────

const MODALITIES = ['academia', 'funcional', 'casa', 'natacao', 'corrida', 'laboral'] as const
const EXPERIENCE_LEVELS = [
  { value: 'beginner', label: 'Iniciante' },
  { value: 'intermediate', label: 'Intermediário' },
  { value: 'advanced', label: 'Avançado' },
] as const
const EQUIPMENT_OPTIONS = [
  'Barra',
  'Halteres',
  'Kettlebell',
  'Cabo',
  'Máquina',
  'TRX',
  'Elástico',
  'Peso corporal',
] as const

// ─── Component ───────────────────────────────────────────────────────────────

export function NewWorkoutForm({ token }: { token: string }) {
  const router = useRouter()
  const [mode, setMode] = useState<'ai' | 'manual'>('ai')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generated, setGenerated] = useState<GeneratedWorkout | null>(null)

  // AI form state
  const [goal, setGoal] = useState('')
  const [experienceLevel, setExperienceLevel] = useState<'beginner' | 'intermediate' | 'advanced'>(
    'intermediate',
  )
  const [weeklyFrequency, setWeeklyFrequency] = useState(3)
  const [sessionDurationMin, setSessionDurationMin] = useState(60)
  const [modality, setModality] = useState<string>('academia')
  const [restrictions, setRestrictions] = useState('')
  const [equipment, setEquipment] = useState<string[]>([])

  function toggleEquipment(item: string) {
    setEquipment((prev) => (prev.includes(item) ? prev.filter((e) => e !== item) : [...prev, item]))
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const result = await api.post<GeneratedWorkout>(
        '/workouts/generate',
        {
          student: {
            goal,
            experienceLevel,
            weeklyFrequency,
            sessionDurationMin,
            restrictions: restrictions
              .split(',')
              .map((r) => r.trim())
              .filter(Boolean),
          },
          preferences: {
            modality,
            equipmentAvailable: equipment,
          },
          saveDraft: true,
        },
        token,
      )
      setGenerated(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar treino')
    } finally {
      setLoading(false)
    }
  }

  if (generated) {
    return (
      <WorkoutPreview generated={generated} onBack={() => setGenerated(null)} router={router} />
    )
  }

  return (
    <div>
      {/* Mode selector */}
      <div className="mb-6 flex rounded-lg border border-neutral-200 bg-neutral-50 p-1">
        <button
          type="button"
          onClick={() => setMode('ai')}
          className={`flex-1 flex items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-colors ${
            mode === 'ai'
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-neutral-500 hover:text-neutral-700'
          }`}
        >
          <Sparkles className="h-4 w-4" />
          Gerar com IA
        </button>
        <button
          type="button"
          onClick={() => setMode('manual')}
          className={`flex-1 flex items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-colors ${
            mode === 'manual'
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-neutral-500 hover:text-neutral-700'
          }`}
        >
          Manual
        </button>
      </div>

      {mode === 'ai' ? (
        <form
          onSubmit={handleGenerate}
          className="space-y-5 rounded-xl border border-neutral-200 bg-white p-6"
        >
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="goal">Objetivo do aluno *</Label>
            <Input
              id="goal"
              placeholder="Ex: hipertrofia muscular, emagrecimento, condicionamento físico"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Nível de experiência *</Label>
            <div className="flex gap-2">
              {EXPERIENCE_LEVELS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setExperienceLevel(value)}
                  className={`flex-1 rounded-lg border py-2 text-sm font-medium transition-colors ${
                    experienceLevel === value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-neutral-200 text-neutral-600 hover:border-neutral-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="frequency">Frequência semanal</Label>
              <Input
                id="frequency"
                type="number"
                min={1}
                max={7}
                value={weeklyFrequency}
                onChange={(e) => setWeeklyFrequency(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Duração por sessão (min)</Label>
              <Input
                id="duration"
                type="number"
                min={15}
                max={180}
                step={5}
                value={sessionDurationMin}
                onChange={(e) => setSessionDurationMin(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Modalidade *</Label>
            <div className="flex flex-wrap gap-2">
              {MODALITIES.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setModality(m)}
                  className={`rounded-lg border px-3 py-1.5 text-sm capitalize transition-colors ${
                    modality === m
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-neutral-200 text-neutral-600 hover:border-neutral-300'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {modality === 'academia' || modality === 'funcional' ? (
            <div className="space-y-2">
              <Label>Equipamentos disponíveis</Label>
              <div className="flex flex-wrap gap-2">
                {EQUIPMENT_OPTIONS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleEquipment(item)}
                    className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                      equipment.includes(item)
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-neutral-200 text-neutral-600 hover:border-neutral-300'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="restrictions">Restrições / contraindicações</Label>
            <Input
              id="restrictions"
              placeholder="Ex: lesão no joelho, hérnia de disco (separe por vírgula)"
              value={restrictions}
              onChange={(e) => setRestrictions(e.target.value)}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading || !goal}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Gerando treino...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Gerar treino com IA
              </>
            )}
          </Button>
        </form>
      ) : (
        <div className="rounded-xl border border-neutral-200 bg-white p-6 text-center text-sm text-neutral-500">
          Criação manual de treinos em breve.{' '}
          <button
            type="button"
            onClick={() => setMode('ai')}
            className="text-blue-600 hover:underline"
          >
            Usar a IA por enquanto
          </button>
          .
        </div>
      )}
    </div>
  )
}

// ─── Preview ─────────────────────────────────────────────────────────────────

function WorkoutPreview({
  generated,
  onBack,
  router,
}: {
  generated: GeneratedWorkout
  onBack: () => void
  router: ReturnType<typeof useRouter>
}) {
  const { workout, workoutId } = generated

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white p-5">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">{workout.title}</h2>
          <p className="mt-0.5 text-sm capitalize text-neutral-500">
            {workout.modality} · {workout.estimatedDurationMin} min
          </p>
        </div>
        <Sparkles className="h-5 w-5 text-blue-500" />
      </div>

      {workout.safetyNotes && workout.safetyNotes.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="mb-1.5 text-sm font-medium text-amber-800">Notas de segurança</p>
          <ul className="space-y-1">
            {workout.safetyNotes.map((note, i) => (
              <li key={i} className="text-sm text-amber-700">
                • {note}
              </li>
            ))}
          </ul>
        </div>
      )}

      {workout.warmUp && workout.warmUp.length > 0 && (
        <ExerciseGroup title="Aquecimento" exercises={workout.warmUp} />
      )}

      <ExerciseGroup title="Treino principal" exercises={workout.exercises} />

      <div className="flex gap-3 pt-2">
        <Button variant="outline" onClick={onBack} className="flex-1">
          Gerar novamente
        </Button>
        <Button className="flex-1" onClick={() => router.push(`/dashboard/workouts/${workoutId}`)}>
          Ver treino salvo
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

function ExerciseGroup({ title, exercises }: { title: string; exercises: AiExercise[] }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
      <div className="border-b border-neutral-100 bg-neutral-50 px-5 py-3">
        <h3 className="text-sm font-medium text-neutral-700">{title}</h3>
      </div>
      <div className="divide-y divide-neutral-100">
        {exercises.map((ex, i) => (
          <div key={i} className="flex items-start gap-4 px-5 py-3">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-neutral-900 truncate">{ex.exerciseId}</p>
              <p className="mt-0.5 text-xs text-neutral-500">
                {ex.sets}x{ex.reps}
                {ex.load ? ` · ${ex.load}` : ''}
                {ex.restSeconds ? ` · ${ex.restSeconds}s descanso` : ''}
              </p>
              {ex.notes && <p className="mt-0.5 text-xs italic text-neutral-400">{ex.notes}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
