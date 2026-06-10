import { redirect } from 'next/navigation'
import { CreditCard } from 'lucide-react'
import { createServerClient } from '@/lib/supabase/server'
import { api } from '@/lib/api'
import type { Plan } from '@athletiqlab/shared'
import { Badge } from '@/components/ui/badge'
import { PlanCards } from './plan-cards'

interface BillingData {
  plan: Plan
  subscriptionStatus: 'trialing' | 'active' | 'past_due' | 'canceled'
  trialEndsAt: string | null
  limits: {
    maxStudents: number
    aiCallsPerMonth: number
    customVideos: boolean
    whiteLabel: boolean
  }
  subscription: {
    plan: string
    status: string
    currentPeriodEnd: string | null
    cancelAtPeriodEnd: boolean
  } | null
}

const statusLabel: Record<
  string,
  { label: string; variant: 'success' | 'warning' | 'destructive' | 'secondary' }
> = {
  trialing: { label: 'Trial', variant: 'warning' },
  active: { label: 'Ativo', variant: 'success' },
  past_due: { label: 'Pagamento pendente', variant: 'warning' },
  canceled: { label: 'Cancelado', variant: 'destructive' },
}

export default async function BillingPage() {
  const supabase = await createServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  let billing: BillingData | null = null
  try {
    billing = await api.get<BillingData>('/billing/subscription', session.access_token)
  } catch {
    billing = null
  }

  const currentPlan = billing?.plan ?? 'starter'
  const status = billing?.subscriptionStatus ?? 'trialing'
  const statusInfo = statusLabel[status] ?? { label: status, variant: 'secondary' as const }

  const planNames: Record<Plan, string> = { starter: 'Starter', pro: 'Pro', elite: 'Elite' }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Cobrança e Planos</h1>
        <p className="text-sm text-neutral-500 mt-1">Gerencie seu plano e assinatura.</p>
      </div>

      {/* Current status card */}
      <div className="rounded-xl border border-neutral-200 bg-white p-6 flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm text-neutral-500">Plano atual</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-lg font-semibold text-neutral-900">
                {planNames[currentPlan]}
              </span>
              <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
            </div>
            {billing?.subscription?.currentPeriodEnd && (
              <p className="text-xs text-neutral-400 mt-1">
                Próxima cobrança:{' '}
                {new Date(billing.subscription.currentPeriodEnd).toLocaleDateString('pt-BR')}
              </p>
            )}
            {billing?.trialEndsAt && status === 'trialing' && (
              <p className="text-xs text-neutral-400 mt-1">
                Trial até {new Date(billing.trialEndsAt).toLocaleDateString('pt-BR')}
              </p>
            )}
            {billing?.subscription?.cancelAtPeriodEnd && (
              <p className="text-xs text-orange-500 mt-1">
                Cancelamento agendado no fim do período
              </p>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-neutral-500">Limites do plano</p>
          <p className="text-xs text-neutral-400 mt-1">
            {billing?.limits.maxStudents === Infinity ? '∞' : billing?.limits.maxStudents} alunos ·{' '}
            {billing?.limits.aiCallsPerMonth} chamadas IA/mês
          </p>
          <p className="text-xs text-neutral-400">
            Vídeo próprio: {billing?.limits.customVideos ? 'Sim' : 'Não'} · White-label:{' '}
            {billing?.limits.whiteLabel ? 'Sim' : 'Não'}
          </p>
        </div>
      </div>

      {/* Plan comparison cards */}
      <div>
        <h2 className="text-base font-semibold text-neutral-900 mb-4">Escolha um plano</h2>
        <PlanCards
          currentPlan={currentPlan}
          subscriptionStatus={status}
          cancelAtPeriodEnd={billing?.subscription?.cancelAtPeriodEnd ?? false}
          token={session.access_token}
        />
      </div>

      {/* Feature comparison table */}
      <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-100">
              <th className="text-left px-6 py-3 font-medium text-neutral-500">Recurso</th>
              <th className="text-center px-4 py-3 font-medium text-neutral-900">Starter</th>
              <th className="text-center px-4 py-3 font-medium text-blue-700">Pro</th>
              <th className="text-center px-4 py-3 font-medium text-purple-700">Elite</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-50">
            {[
              { label: 'Alunos', s: '10', p: '30', e: 'Ilimitado' },
              { label: 'Chamadas IA/mês', s: '50', p: '200', e: '1.000' },
              { label: 'Upload de vídeo', s: '✗', p: '✓', e: '✓' },
              { label: 'White-label', s: '✗', p: '✗', e: '✓' },
            ].map((row) => (
              <tr key={row.label}>
                <td className="px-6 py-3 text-neutral-700">{row.label}</td>
                <td className="text-center px-4 py-3 text-neutral-500">{row.s}</td>
                <td className="text-center px-4 py-3 text-blue-700 font-medium">{row.p}</td>
                <td className="text-center px-4 py-3 text-purple-700 font-medium">{row.e}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
