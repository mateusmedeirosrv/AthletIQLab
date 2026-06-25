import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Bookmark, Dumbbell, Plus, Sparkles } from 'lucide-react'
import { createServerClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { api } from '@/lib/api'

const statusLabel: Record<
  string,
  { label: string; variant: 'success' | 'secondary' | 'warning' | 'destructive' }
> = {
  draft: { label: 'Rascunho', variant: 'secondary' },
  published: { label: 'Publicado', variant: 'success' },
  archived: { label: 'Arquivado', variant: 'destructive' },
}

interface Workout {
  id: string
  title: string
  modality: string
  status: string
  aiGenerated: boolean
  isTemplate: boolean
  estimatedDurationMin: number | null
  studentId: string | null
  createdAt: string
}

export default async function WorkoutsPage() {
  const supabase = await createServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  let workouts: Workout[] = []
  let templates: Workout[] = []
  try {
    const [wRes, tRes] = await Promise.all([
      api.get<{ data: Workout[] }>('/workouts', session.access_token),
      api.get<{ data: Workout[] }>('/workouts/templates', session.access_token),
    ])
    workouts = wRes.data ?? []
    templates = tRes.data ?? []
  } catch {
    // handled below
  }

  return (
    <div className="space-y-8">
      <div>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900">Treinos</h1>
            <p className="mt-1 text-sm text-neutral-500">
              {workouts.length} treino{workouts.length !== 1 ? 's' : ''} criado
              {workouts.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Button asChild>
            <Link href="/dashboard/workouts/new">
              <Plus className="mr-2 h-4 w-4" />
              Novo Treino
            </Link>
          </Button>
        </div>

        {workouts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-neutral-200 bg-white p-14 text-center">
            <Dumbbell className="mx-auto mb-3 h-10 w-10 text-neutral-300" />
            <h3 className="font-medium text-neutral-900">Nenhum treino ainda</h3>
            <p className="mt-1 text-sm text-neutral-500">
              Crie um treino manualmente ou deixe a IA montar para você.
            </p>
            <div className="mt-4 flex justify-center gap-3">
              <Button variant="outline" asChild>
                <Link href="/dashboard/workouts/new">Criar manualmente</Link>
              </Button>
              <Button asChild>
                <Link href="/dashboard/workouts/new?mode=ai">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Gerar com IA
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Treino</TableHead>
                  <TableHead>Modalidade</TableHead>
                  <TableHead>Duração</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {workouts.map((workout) => {
                  const status = statusLabel[workout.status] ?? {
                    label: workout.status,
                    variant: 'secondary' as const,
                  }
                  return (
                    <TableRow key={workout.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-neutral-900">{workout.title}</span>
                          {workout.aiGenerated && (
                            <Sparkles className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="capitalize text-sm text-neutral-600">
                        {workout.modality}
                      </TableCell>
                      <TableCell className="text-sm text-neutral-600">
                        {workout.estimatedDurationMin ? `${workout.estimatedDurationMin} min` : '—'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-neutral-500">
                        {new Date(workout.createdAt).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/dashboard/workouts/${workout.id}`}>Ver</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Templates */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">Templates</h2>
            <p className="mt-0.5 text-sm text-neutral-500">
              Treinos base reutilizáveis. Aplique a qualquer aluno com um clique.
            </p>
          </div>
        </div>

        {templates.length === 0 ? (
          <div className="rounded-xl border border-dashed border-neutral-200 bg-white p-8 text-center">
            <Bookmark className="mx-auto mb-2 h-8 w-8 text-neutral-300" />
            <p className="text-sm text-neutral-500">
              Nenhum template ainda. Abra um treino e clique em &quot;Salvar como template&quot;.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {templates.map((t) => (
              <Link
                key={t.id}
                href={`/dashboard/workouts/${t.id}`}
                className="flex flex-col gap-2 rounded-xl border border-neutral-200 bg-white p-4 hover:border-violet-300 hover:bg-violet-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-neutral-900 text-sm leading-snug">{t.title}</p>
                  {t.aiGenerated && (
                    <Sparkles className="h-3.5 w-3.5 shrink-0 text-blue-400 mt-0.5" />
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-neutral-500">
                  <span className="capitalize">{t.modality}</span>
                  {t.estimatedDurationMin && <span>· {t.estimatedDurationMin} min</span>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
