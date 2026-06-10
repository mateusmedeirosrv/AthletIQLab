import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, Video, Link as LinkIcon } from 'lucide-react'
import { createServerClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'

interface Exercise {
  id: string
  name: string
  level: string
  modality: string
  source: string
  videoProvider: string | null
  videoUrl: string | null
  createdAt: string
}

const levelLabel: Record<string, string> = {
  beginner: 'Iniciante',
  intermediate: 'Intermediário',
  advanced: 'Avançado',
}

const sourceLabel: Record<string, { label: string; variant: 'secondary' | 'warning' }> = {
  personal: { label: 'Meu exercício', variant: 'secondary' },
  external_link: { label: 'Link externo', variant: 'warning' },
}

export default async function ExercisesPage() {
  const supabase = await createServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  let exercises: Exercise[] = []
  try {
    const res = await api.get<{ data: Exercise[]; page: number; limit: number }>(
      '/exercises?limit=100',
      session.access_token,
    )
    exercises = (res.data ?? []).filter((e) => e.source !== 'curated')
  } catch {
    exercises = []
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Exercícios</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {exercises.length} exercício{exercises.length !== 1 ? 's' : ''} personalizado
            {exercises.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/exercises/new">
            <Plus className="h-4 w-4 mr-2" />
            Novo exercício
          </Link>
        </Button>
      </div>

      {exercises.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-200 bg-white p-14 text-center">
          <Video className="mx-auto mb-3 h-10 w-10 text-neutral-300" />
          <h3 className="font-medium text-neutral-900">Nenhum exercício personalizado</h3>
          <p className="mt-1 text-sm text-neutral-500">
            Crie exercícios próprios com vídeo ou link do YouTube/Vimeo.
          </p>
          <Button asChild className="mt-4">
            <Link href="/dashboard/exercises/new">Criar exercício</Link>
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border border-neutral-200 bg-white divide-y divide-neutral-100 overflow-hidden">
          {exercises.map((ex) => {
            const modalities = (() => {
              try {
                return (JSON.parse(ex.modality) as string[]).slice(0, 2)
              } catch {
                return []
              }
            })()

            return (
              <div key={ex.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-neutral-100">
                    {ex.videoUrl ? (
                      ex.videoProvider === 'youtube' || ex.videoProvider === 'vimeo' ? (
                        <LinkIcon className="h-4 w-4 text-neutral-500" />
                      ) : (
                        <Video className="h-4 w-4 text-neutral-500" />
                      )
                    ) : (
                      <Video className="h-4 w-4 text-neutral-300" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-neutral-900 text-sm truncate">{ex.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-neutral-400">
                        {levelLabel[ex.level] ?? ex.level}
                      </span>
                      {modalities.map((m) => (
                        <span
                          key={m}
                          className="text-xs bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded"
                        >
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Badge variant={sourceLabel[ex.source]?.variant ?? 'secondary'}>
                    {sourceLabel[ex.source]?.label ?? ex.source}
                  </Badge>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/dashboard/exercises/${ex.id}/edit`}>Editar</Link>
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
