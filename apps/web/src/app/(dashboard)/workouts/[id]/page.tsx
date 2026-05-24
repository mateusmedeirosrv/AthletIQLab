import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Sparkles } from 'lucide-react'
import { createServerClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'

interface WorkoutExercise {
  id: string
  exerciseId: string
  order: number
  sets: number
  reps: string
  load: string | null
  restSeconds: number | null
  notes: string | null
  tempo: string | null
  exerciseName: string
  muscleGroup: string
}

interface WorkoutDetail {
  id: string
  title: string
  modality: string
  status: string
  aiGenerated: boolean
  estimatedDurationMin: number | null
  studentId: string | null
  createdAt: string
  exercises: WorkoutExercise[]
}

const statusLabel: Record<
  string,
  { label: string; variant: 'success' | 'secondary' | 'warning' | 'destructive' }
> = {
  draft: { label: 'Rascunho', variant: 'secondary' },
  published: { label: 'Publicado', variant: 'success' },
  archived: { label: 'Arquivado', variant: 'destructive' },
}

export default async function WorkoutDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  let workout: WorkoutDetail | null = null
  try {
    const res = await api.get<{ data: WorkoutDetail }>(`/workouts/${id}`, session.access_token)
    workout = res.data
  } catch {
    // handled below
  }

  if (!workout) {
    return (
      <div className="text-center py-20">
        <p className="text-neutral-500">Treino não encontrado.</p>
        <Button variant="outline" className="mt-4" asChild>
          <Link href="/dashboard/workouts">Voltar aos treinos</Link>
        </Button>
      </div>
    )
  }

  const status = statusLabel[workout.status] ?? {
    label: workout.status,
    variant: 'secondary' as const,
  }
  const mainExercises = workout.exercises
    .filter((e) => e.order > 0)
    .sort((a, b) => a.order - b.order)
  const warmUp = workout.exercises.filter((e) => e.order <= 0).sort((a, b) => a.order - b.order)

  return (
    <div className="max-w-2xl space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href="/dashboard/workouts">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Treinos
          </Link>
        </Button>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-neutral-900">{workout.title}</h1>
              {workout.aiGenerated && <Sparkles className="h-4 w-4 text-blue-500" />}
            </div>
            <p className="mt-1 text-sm capitalize text-neutral-500">
              {workout.modality}
              {workout.estimatedDurationMin ? ` · ${workout.estimatedDurationMin} min` : ''}
            </p>
          </div>
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>

        {workout.status === 'draft' && (
          <div className="mt-4 flex gap-2">
            <PublishButton workoutId={workout.id} token={session.access_token} />
          </div>
        )}
      </div>

      {warmUp.length > 0 && <ExerciseSection title="Aquecimento" exercises={warmUp} />}

      {mainExercises.length > 0 ? (
        <ExerciseSection title="Exercícios" exercises={mainExercises} />
      ) : (
        <div className="rounded-xl border border-dashed border-neutral-200 p-8 text-center text-sm text-neutral-500">
          Nenhum exercício adicionado.
        </div>
      )}
    </div>
  )
}

function ExerciseSection({ title, exercises }: { title: string; exercises: WorkoutExercise[] }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
      <div className="border-b border-neutral-100 bg-neutral-50 px-5 py-3">
        <h2 className="text-sm font-medium text-neutral-700">{title}</h2>
      </div>
      <div className="divide-y divide-neutral-100">
        {exercises.map((ex, i) => {
          let muscleGroups: string[] = []
          try {
            muscleGroups = JSON.parse(ex.muscleGroup) as string[]
          } catch {
            // ignore
          }

          return (
            <div key={ex.id} className="flex items-start gap-4 px-5 py-4">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-neutral-900">{ex.exerciseName}</p>
                {muscleGroups.length > 0 && (
                  <p className="mt-0.5 text-xs text-neutral-400">{muscleGroups.join(', ')}</p>
                )}
                <p className="mt-1 text-sm text-neutral-600">
                  {ex.sets}x{ex.reps}
                  {ex.load ? ` · ${ex.load}` : ''}
                  {ex.restSeconds ? ` · ${ex.restSeconds}s descanso` : ''}
                  {ex.tempo ? ` · ${ex.tempo}` : ''}
                </p>
                {ex.notes && <p className="mt-0.5 text-xs italic text-neutral-400">{ex.notes}</p>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function PublishButton({ workoutId, token }: { workoutId: string; token: string }) {
  async function publish() {
    'use server'
    await api.patch(`/workouts/${workoutId}`, { status: 'published' }, token)
    redirect(`/dashboard/workouts/${workoutId}`)
  }

  return (
    <form action={publish}>
      <Button type="submit" size="sm">
        Publicar treino
      </Button>
    </form>
  )
}
