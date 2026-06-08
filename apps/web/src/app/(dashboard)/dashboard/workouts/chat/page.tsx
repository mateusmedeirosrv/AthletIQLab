import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { ChatWorkoutCreation } from './chat-workout-creation'

export default async function ChatWorkoutPage() {
  const supabase = await createServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold text-neutral-900">Criar Treino com IA</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Converse com a IA para criar um treino personalizado. Você autoriza antes de enviar ao
          cliente.
        </p>
      </div>
      <ChatWorkoutCreation token={session.access_token} />
    </div>
  )
}
