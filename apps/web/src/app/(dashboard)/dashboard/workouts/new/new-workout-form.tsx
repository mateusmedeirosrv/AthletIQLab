'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function NewWorkoutForm({ token: _token }: { token: string }) {
  const router = useRouter()
  const [mode, setMode] = useState<'ai' | 'manual'>('ai')

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
        <div className="space-y-4 rounded-xl border border-neutral-200 bg-white p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-blue-100 p-3">
              <Sparkles className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-neutral-900">Chat conversacional com IA</h3>
              <p className="mt-1 text-sm text-neutral-500">
                A IA faz perguntas e monta o treino em conversa com você. Você autoriza antes de
                enviar ao cliente.
              </p>
            </div>
          </div>
          <Button className="w-full" onClick={() => router.push('/dashboard/workouts/chat')}>
            <MessageSquare className="mr-2 h-4 w-4" />
            Conversar com IA
          </Button>
        </div>
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
