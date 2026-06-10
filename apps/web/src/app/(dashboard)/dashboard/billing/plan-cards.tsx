'use client'

import { useState } from 'react'
import { Check, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { Plan } from '@athletiqlab/shared'
import { PLAN_PRICES_BRL } from '@athletiqlab/shared'

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001'

const PLANS: {
  id: Plan
  name: string
  color: string
  features: string[]
}[] = [
  {
    id: 'starter',
    name: 'Starter',
    color: 'neutral',
    features: ['10 alunos', '50 chamadas IA/mês', 'Chat com IA', 'Player Reels'],
  },
  {
    id: 'pro',
    name: 'Pro',
    color: 'blue',
    features: [
      '30 alunos',
      '200 chamadas IA/mês',
      'Upload de vídeo próprio',
      'Chat com IA + SmartWatch',
    ],
  },
  {
    id: 'elite',
    name: 'Elite',
    color: 'purple',
    features: [
      'Alunos ilimitados',
      '1.000 chamadas IA/mês',
      'Upload de vídeo próprio',
      'White-label (cores + logo)',
    ],
  },
]

interface PlanCardsProps {
  currentPlan: Plan
  subscriptionStatus: string
  cancelAtPeriodEnd: boolean
  token: string
}

export function PlanCards({
  currentPlan,
  subscriptionStatus,
  cancelAtPeriodEnd,
  token,
}: PlanCardsProps) {
  const [loading, setLoading] = useState<Plan | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleCheckout(plan: Plan) {
    if (plan === 'starter') return
    setLoading(plan)
    setError(null)
    try {
      const res = await fetch(`${API_URL}/billing/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ plan }),
      })
      const json = (await res.json()) as {
        data?: { checkoutUrl?: string }
        error?: { message?: string }
      }
      if (!res.ok || !json.data?.checkoutUrl) {
        setError(json.error?.message ?? 'Erro ao criar checkout. Tente novamente.')
        return
      }
      window.location.href = json.data.checkoutUrl
    } catch {
      setError('Erro de rede. Verifique sua conexão.')
    } finally {
      setLoading(null)
    }
  }

  async function handleCancel() {
    if (
      !confirm(
        'Tem certeza que deseja cancelar sua assinatura? O acesso continua até o fim do período.',
      )
    )
      return
    setLoading('starter')
    setError(null)
    try {
      const res = await fetch(`${API_URL}/billing/cancel`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) window.location.reload()
      else setError('Erro ao cancelar. Tente novamente.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {PLANS.map((plan) => {
          const isCurrent = currentPlan === plan.id
          const isActive = isCurrent && subscriptionStatus === 'active'
          const priceReais = PLAN_PRICES_BRL[plan.id] / 100
          const isPro = plan.id === 'pro'
          const isElite = plan.id === 'elite'

          return (
            <div
              key={plan.id}
              className={cn(
                'relative rounded-xl border bg-white p-6 flex flex-col',
                isCurrent ? 'border-blue-300 ring-2 ring-blue-100' : 'border-neutral-200',
                isPro && 'border-blue-200',
                isElite && 'border-purple-200',
              )}
            >
              {isCurrent && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-3 py-0.5 text-xs font-medium text-white">
                  Plano atual
                </span>
              )}

              <div className="mb-4">
                <h3
                  className={cn(
                    'text-base font-semibold',
                    isPro ? 'text-blue-700' : isElite ? 'text-purple-700' : 'text-neutral-700',
                  )}
                >
                  {plan.name}
                </h3>
                <div className="mt-1">
                  {plan.id === 'starter' ? (
                    <span className="text-2xl font-bold text-neutral-900">Grátis</span>
                  ) : (
                    <span className="text-2xl font-bold text-neutral-900">
                      R$ {priceReais.toFixed(0)}
                      <span className="text-sm font-normal text-neutral-500">/mês</span>
                    </span>
                  )}
                </div>
              </div>

              <ul className="space-y-2 mb-6 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-neutral-600">
                    <Check
                      className={cn(
                        'h-4 w-4 shrink-0 mt-0.5',
                        isPro ? 'text-blue-500' : isElite ? 'text-purple-500' : 'text-green-500',
                      )}
                    />
                    {f}
                  </li>
                ))}
              </ul>

              {plan.id === 'starter' ? (
                <Button variant="outline" disabled size="sm">
                  {isCurrent ? 'Plano atual' : 'Gratuito'}
                </Button>
              ) : isActive && !cancelAtPeriodEnd ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                  disabled={loading !== null}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  {loading === 'starter' ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                  Cancelar assinatura
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant={isCurrent ? 'outline' : 'default'}
                  className={cn(
                    !isCurrent && isPro && 'bg-blue-600 hover:bg-blue-700',
                    !isCurrent && isElite && 'bg-purple-600 hover:bg-purple-700',
                  )}
                  onClick={() => void handleCheckout(plan.id)}
                  disabled={loading !== null || (isCurrent && !cancelAtPeriodEnd)}
                >
                  {loading === plan.id ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                  {isCurrent && cancelAtPeriodEnd
                    ? 'Reativar'
                    : isCurrent
                      ? 'Plano atual'
                      : 'Assinar'}
                </Button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
