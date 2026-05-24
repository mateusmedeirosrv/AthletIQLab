import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { NewWorkoutForm } from './new-workout-form'

export default async function NewWorkoutPage() {
  const supabase = await createServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-neutral-900">Novo Treino</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Gere um treino personalizado com IA ou crie manualmente.
        </p>
      </div>
      <NewWorkoutForm token={session.access_token} />
    </div>
  )
}
