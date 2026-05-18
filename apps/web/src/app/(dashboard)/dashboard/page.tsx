import { redirect } from 'next/navigation'
import { Users, Dumbbell, TrendingUp, Crown } from 'lucide-react'
import { createServerClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import type { Plan } from '@athletiqlab/shared'
import { PLAN_LIMITS } from '@athletiqlab/shared'

const planLabel: Record<Plan, string> = {
  starter: 'Starter',
  pro: 'Pro',
  elite: 'Elite',
}

interface PersonalProfile {
  name: string
  plan: Plan
  subscriptionStatus: string
  trialEndsAt: string | null
}

interface Student {
  userId: string
  status: string
}

async function getPersonalData(token: string) {
  try {
    const [personal, students] = await Promise.all([
      api.get<PersonalProfile>('/personals/me', token),
      api.get<Student[]>('/students', token),
    ])
    return { personal, students }
  } catch {
    return null
  }
}

export default async function DashboardPage() {
  const supabase = await createServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const data = await getPersonalData(session.access_token)
  if (!data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-neutral-500">Erro ao carregar dados. Tente novamente.</p>
      </div>
    )
  }

  const { personal, students } = data
  const activeStudents = students.filter((s) => s.status === 'active').length
  const maxStudents = PLAN_LIMITS[personal.plan].maxStudents
  const isTrialing = personal.subscriptionStatus === 'trialing'
  const trialDaysLeft = personal.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(personal.trialEndsAt).getTime() - Date.now()) / 86_400_000))
    : 0

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">
            Olá, {personal.name.split(' ')[0]}!
          </h1>
          <p className="mt-1 text-sm text-neutral-500">Aqui está o resumo da sua conta.</p>
        </div>
        {isTrialing && trialDaysLeft > 0 && (
          <div className="rounded-lg bg-yellow-50 border border-yellow-200 px-4 py-2.5 text-sm">
            <span className="font-medium text-yellow-800">
              {trialDaysLeft} dia{trialDaysLeft !== 1 ? 's' : ''} de teste restante
              {trialDaysLeft !== 1 ? 's' : ''}
            </span>
            <Button size="sm" className="ml-3" asChild>
              <a href="/dashboard/settings#billing">Assinar</a>
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500">Alunos ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <span className="text-3xl font-bold text-neutral-900">{activeStudents}</span>
              <Users className="h-5 w-5 text-neutral-300" />
            </div>
            <p className="mt-1 text-xs text-neutral-400">
              de {maxStudents === Infinity ? '∞' : maxStudents} no seu plano
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500">Total de alunos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <span className="text-3xl font-bold text-neutral-900">{students.length}</span>
              <TrendingUp className="h-5 w-5 text-neutral-300" />
            </div>
            <p className="mt-1 text-xs text-neutral-400">incluindo pausados e convidados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500">Treinos criados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <span className="text-3xl font-bold text-neutral-900">—</span>
              <Dumbbell className="h-5 w-5 text-neutral-300" />
            </div>
            <p className="mt-1 text-xs text-neutral-400">disponível no Sprint 2</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500">Seu plano</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <Badge variant={personal.plan === 'elite' ? 'default' : 'secondary'}>
                {planLabel[personal.plan]}
              </Badge>
              <Crown className="h-5 w-5 text-neutral-300" />
            </div>
            <p className="mt-1 text-xs text-neutral-400">
              {isTrialing ? `Teste — ${trialDaysLeft}d restantes` : personal.subscriptionStatus}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 rounded-xl border border-dashed border-neutral-200 bg-white p-10 text-center">
        <Dumbbell className="mx-auto mb-3 h-10 w-10 text-neutral-300" />
        <h3 className="font-medium text-neutral-900">Crie seu primeiro treino</h3>
        <p className="mt-1 text-sm text-neutral-500">
          Funcionalidade de criação de treinos com IA disponível no Sprint 2.
        </p>
      </div>
    </div>
  )
}
