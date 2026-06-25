import { redirect, notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { api } from '@/lib/api'
import { EditExerciseForm } from './edit-exercise-form'

interface Exercise {
  id: string
  name: string
  description: string | null
  techniqueTips: string | null
  level: string
  modality: string
  muscleGroup: string
  equipment: string
  videoUrl: string | null
  videoProvider: string | null
  source: string
  ownerId: string | null
}

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditExercisePage({ params }: Props) {
  const { id } = await params

  const supabase = await createServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  let exercise: Exercise
  try {
    const res = await api.get<{ data: Exercise }>(`/exercises/${id}`, session.access_token)
    exercise = res.data
  } catch {
    notFound()
  }

  if (exercise.source === 'curated' || exercise.ownerId !== session.user.id) {
    notFound()
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold text-neutral-900 mb-6">Editar exercício</h1>
      <EditExerciseForm exercise={exercise} token={session.access_token} />
    </div>
  )
}
