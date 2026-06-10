import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { NewExerciseForm } from './new-exercise-form'

export default async function NewExercisePage() {
  const supabase = await createServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold text-neutral-900 mb-6">Novo exercício</h1>
      <NewExerciseForm token={session.access_token} />
    </div>
  )
}
