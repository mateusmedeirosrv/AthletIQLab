import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Activity, AlertTriangle, ChevronRight, Crown, Dumbbell, Star, Users } from 'lucide-react'
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

interface DashboardData {
  students: { total: number; active: number }
  workouts: { total: number; published: number; draft: number }
  sessionsThisWeek: number
  sessionsLast7Days: Array<{ date: string; count: number }>
  nps: { avg: number | null; count: number }
  recentSessions: Array<{
    sessionId: string
    startedAt: string
    rpe: number | null
    totalVolumeKg: string | null
    studentName: string
    workoutTitle: string
  }>
  studentsWithoutWorkout: number
}

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86_400_000)
  const time = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  if (diffDays === 0) return `hoje às ${time}`
  if (diffDays === 1) return `ontem às ${time}`
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

export default async function DashboardPage() {
  const supabase = await createServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  let personal: PersonalProfile | null = null
  let dashData: DashboardData | null = null

  try {
    const [personalRes, dashRes] = await Promise.all([
      api.get<PersonalProfile>('/personals/me', session.access_token),
      api.get<{ data: DashboardData }>('/personals/dashboard', session.access_token),
    ])
    personal = personalRes
    dashData = dashRes.data
  } catch {
    // handled below
  }

  if (!personal) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-neutral-500">Erro ao carregar dados. Tente novamente.</p>
      </div>
    )
  }

  const maxStudents = PLAN_LIMITS[personal.plan].maxStudents
  const isTrialing = personal.subscriptionStatus === 'trialing'
  const trialDaysLeft = personal.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(personal.trialEndsAt).getTime() - Date.now()) / 86_400_000))
    : 0

  const dash: DashboardData = dashData ?? {
    students: { total: 0, active: 0 },
    workouts: { total: 0, published: 0, draft: 0 },
    sessionsThisWeek: 0,
    sessionsLast7Days: [],
    nps: { avg: null, count: 0 },
    recentSessions: [],
    studentsWithoutWorkout: 0,
  }

  // Fill missing days for the 7-day chart
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d.toISOString().slice(0, 10)
  })
  const sessionMap = new Map(dash.sessionsLast7Days.map((s) => [s.date, s.count]))
  const chartData = last7.map((date) => ({
    date,
    count: sessionMap.get(date) ?? 0,
    label: new Date(`${date}T12:00:00Z`)
      .toLocaleDateString('pt-BR', { weekday: 'short' })
      .replace('.', ''),
  }))
  const maxCount = Math.max(...chartData.map((d) => d.count), 1)

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">
            Olá, {personal.name.split(' ')[0]}!
          </h1>
          <p className="mt-1 text-sm text-neutral-500">Aqui está o resumo da sua semana.</p>
        </div>
        {isTrialing && trialDaysLeft > 0 && (
          <div className="rounded-lg bg-yellow-50 border border-yellow-200 px-4 py-2.5 text-sm">
            <span className="font-medium text-yellow-800">
              {trialDaysLeft} dia{trialDaysLeft !== 1 ? 's' : ''} de teste restante
              {trialDaysLeft !== 1 ? 's' : ''}
            </span>
            <Button size="sm" className="ml-3" asChild>
              <a href="/dashboard/billing">Assinar</a>
            </Button>
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500">Alunos ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <span className="text-3xl font-bold text-neutral-900">{dash.students.active}</span>
              <Users className="h-5 w-5 text-neutral-300" />
            </div>
            <p className="mt-1 text-xs text-neutral-400">
              de {maxStudents === Infinity ? '∞' : maxStudents} no plano {planLabel[personal.plan]}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500">
              Sessões esta semana
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <span className="text-3xl font-bold text-neutral-900">{dash.sessionsThisWeek}</span>
              <Activity className="h-5 w-5 text-neutral-300" />
            </div>
            <p className="mt-1 text-xs text-neutral-400">treinos concluídos pelos alunos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500">
              Treinos publicados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <span className="text-3xl font-bold text-neutral-900">{dash.workouts.published}</span>
              <Dumbbell className="h-5 w-5 text-neutral-300" />
            </div>
            <p className="mt-1 text-xs text-neutral-400">
              {dash.workouts.draft > 0
                ? `${dash.workouts.draft} em rascunho`
                : `${dash.workouts.total} no total`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500">NPS médio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <span className="text-3xl font-bold text-neutral-900">
                {dash.nps.avg !== null ? Number(dash.nps.avg).toFixed(1) : '—'}
              </span>
              <Star className="h-5 w-5 text-neutral-300" />
            </div>
            <p className="mt-1 text-xs text-neutral-400">
              {dash.nps.count > 0
                ? `${dash.nps.count} avaliação${dash.nps.count !== 1 ? 'ões' : ''}`
                : 'nenhuma avaliação ainda'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Chart + Actions */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border border-neutral-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-neutral-700">
            Atividade — últimos 7 dias
          </h2>
          <div className="flex items-end gap-2 h-24">
            {chartData.map((d) => (
              <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
                {d.count > 0 && (
                  <span className="text-[10px] font-medium text-neutral-500">{d.count}</span>
                )}
                <div
                  className="w-full rounded-t-sm bg-blue-500 transition-all"
                  style={{
                    height: `${Math.max(d.count > 0 ? 12 : 2, Math.round((d.count / maxCount) * 72))}px`,
                    opacity: d.count > 0 ? 1 : 0.15,
                  }}
                />
                <span className="text-[10px] capitalize text-neutral-400">{d.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {dash.studentsWithoutWorkout > 0 && (
            <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-600" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-yellow-800">
                    {dash.studentsWithoutWorkout} aluno
                    {dash.studentsWithoutWorkout !== 1 ? 's' : ''} sem treino
                  </p>
                  <p className="mt-0.5 text-xs text-yellow-700">
                    Ativo{dash.studentsWithoutWorkout !== 1 ? 's' : ''} e sem treino publicado
                  </p>
                  <Link
                    href="/dashboard/students"
                    className="mt-2 inline-flex items-center text-xs font-medium text-yellow-800 underline-offset-2 hover:underline"
                  >
                    Ver alunos
                    <ChevronRight className="ml-0.5 h-3 w-3" />
                  </Link>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-xl border border-neutral-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
              Acesso rápido
            </p>
            <div className="mt-3 space-y-1">
              <Link
                href="/dashboard/workouts/chat"
                className="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
              >
                Criar treino com IA
                <ChevronRight className="h-4 w-4 text-neutral-400" />
              </Link>
              <Link
                href="/dashboard/students"
                className="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
              >
                Gerenciar alunos
                <ChevronRight className="h-4 w-4 text-neutral-400" />
              </Link>
              <Link
                href="/dashboard/marketplace"
                className="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
              >
                Marketplace
                <ChevronRight className="h-4 w-4 text-neutral-400" />
              </Link>
              <Link
                href="/dashboard/billing"
                className="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
              >
                <span className="flex items-center gap-1.5">
                  <Crown className="h-3.5 w-3.5 text-neutral-400" />
                  Plano {planLabel[personal.plan]}
                </span>
                <Badge
                  variant={personal.plan === 'elite' ? 'default' : 'secondary'}
                  className="text-[10px]"
                >
                  {personal.subscriptionStatus === 'trialing' ? 'Trial' : 'Ativo'}
                </Badge>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Sessions */}
      {dash.recentSessions.length > 0 && (
        <div className="mt-6 rounded-xl border border-neutral-200 bg-white overflow-hidden">
          <div className="flex items-center justify-between border-b border-neutral-100 bg-neutral-50 px-5 py-3">
            <h2 className="text-sm font-semibold text-neutral-700">Sessões recentes</h2>
            <Link href="/dashboard/students" className="text-xs text-blue-600 hover:underline">
              Ver alunos
            </Link>
          </div>
          <div className="divide-y divide-neutral-100">
            {dash.recentSessions.map((s) => (
              <div key={s.sessionId} className="flex items-center gap-4 px-5 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-900">{s.studentName}</p>
                  <p className="truncate text-xs text-neutral-500">{s.workoutTitle}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xs text-neutral-500">{formatRelativeDate(s.startedAt)}</p>
                  {s.rpe !== null && (
                    <span className="mt-0.5 inline-block rounded-full bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium text-neutral-600">
                      RPE {s.rpe}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
