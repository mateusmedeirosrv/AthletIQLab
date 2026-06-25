import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ClipboardList, Dumbbell, MessageSquare } from 'lucide-react'
import { createServerClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { AnamneseSection } from './anamnese-section'
import { ChatSection } from './chat-section'
import { ReportDownloadButton } from './report-download-button'

const statusLabel: Record<
  string,
  { label: string; variant: 'success' | 'secondary' | 'warning' | 'destructive' }
> = {
  active: { label: 'Ativo', variant: 'success' },
  invited: { label: 'Convidado', variant: 'warning' },
  paused: { label: 'Pausado', variant: 'secondary' },
  removed: { label: 'Removido', variant: 'destructive' },
}

interface Student {
  userId: string
  name: string
  photoUrl: string | null
  status: string
  createdAt: string
  inviteAcceptedAt: string | null
}

interface Workout {
  id: string
  title: string
  status: string
  createdAt: string
}

interface AnamneseStatus {
  filled: boolean
  lastUpdated: string | null
}

export default async function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const token = session.access_token

  let student: Student | null = null
  let workouts: Workout[] = []
  let anamneseStatus: AnamneseStatus = { filled: false, lastUpdated: null }

  try {
    student = await api.get<Student>(`/students/${id}`, token)
  } catch {
    redirect('/dashboard/students')
  }

  try {
    const res = await api.get<{ data: Workout[] }>(`/workouts?studentId=${id}`, token)
    workouts = Array.isArray(res) ? res : (res.data ?? [])
  } catch {
    workouts = []
  }

  try {
    const res = await api.get<{ data: AnamneseStatus }>(`/students/${id}/anamnese/status`, token)
    anamneseStatus = res.data
  } catch {
    anamneseStatus = { filled: false, lastUpdated: null }
  }

  if (!student) redirect('/dashboard/students')

  const status = statusLabel[student.status] ?? {
    label: student.status,
    variant: 'secondary' as const,
  }
  const initials = student.name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href="/dashboard/students">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Alunos
          </Link>
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-lg font-bold">
            {initials}
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900">{student.name}</h1>
            <div className="flex items-center gap-3 mt-1">
              <Badge variant={status.variant}>{status.label}</Badge>
              <span className="text-sm text-neutral-500">
                Desde{' '}
                {new Date(student.createdAt).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>
        </div>
        <ReportDownloadButton studentId={id} studentName={student.name} token={token} />
      </div>

      {/* Treinos section */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="flex items-center gap-2 text-base font-semibold text-neutral-900">
            <Dumbbell className="h-4 w-4" />
            Treinos ({workouts.length})
          </h2>
          <Button size="sm" asChild>
            <Link href={`/dashboard/workouts/new?studentId=${id}`}>Novo treino</Link>
          </Button>
        </div>

        {workouts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-neutral-200 bg-white p-10 text-center">
            <p className="text-sm text-neutral-500">Nenhum treino atribuído ainda.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-neutral-200 bg-white divide-y divide-neutral-100">
            {workouts.map((w) => (
              <Link
                key={w.id}
                href={`/dashboard/workouts/${w.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-neutral-50 transition-colors"
              >
                <span className="font-medium text-neutral-900 text-sm">{w.title}</span>
                <div className="flex items-center gap-3">
                  <Badge variant={w.status === 'published' ? 'success' : 'secondary'}>
                    {w.status === 'published'
                      ? 'Publicado'
                      : w.status === 'draft'
                        ? 'Rascunho'
                        : 'Arquivado'}
                  </Badge>
                  <span className="text-xs text-neutral-400">
                    {new Date(w.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Anamnese section */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="flex items-center gap-2 text-base font-semibold text-neutral-900">
            <ClipboardList className="h-4 w-4" />
            Anamnese
          </h2>
          {anamneseStatus.filled && (
            <span className="text-xs text-neutral-400">
              Atualizada em{' '}
              {anamneseStatus.lastUpdated
                ? new Date(anamneseStatus.lastUpdated).toLocaleDateString('pt-BR')
                : '—'}
            </span>
          )}
        </div>
        <AnamneseSection studentId={id} filled={anamneseStatus.filled} token={token} />
      </section>

      {/* Chat section */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="flex items-center gap-2 text-base font-semibold text-neutral-900">
            <MessageSquare className="h-4 w-4" />
            Mensagens
          </h2>
        </div>
        <ChatSection studentId={id} userId={session.user.id} token={token} />
      </section>
    </div>
  )
}
