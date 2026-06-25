import { redirect } from 'next/navigation'
import { Globe, Link as LinkIcon, Search, Video } from 'lucide-react'
import { createServerClient } from '@/lib/supabase/server'
import { api } from '@/lib/api'
import { ImportButton } from './import-button'

interface SearchParams {
  q?: string
  level?: string
  page?: string
}

interface MarketplaceExercise {
  id: string
  name: string
  description: string | null
  level: string
  modality: string
  muscleGroup: string
  videoUrl: string | null
  videoProvider: string | null
  authorName: string
}

const levelLabel: Record<string, string> = {
  beginner: 'Iniciante',
  intermediate: 'Intermediário',
  advanced: 'Avançado',
}

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const { q, level, page } = await searchParams

  const supabase = await createServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  let exercises: MarketplaceExercise[] = []
  try {
    const params = new URLSearchParams()
    if (q) params.set('search', q)
    if (level) params.set('level', level)
    if (page) params.set('page', page)
    params.set('limit', '20')

    const res = await api.get<{ data: MarketplaceExercise[] }>(
      `/exercises/marketplace?${params}`,
      session.access_token,
    )
    exercises = res.data ?? []
  } catch {
    exercises = []
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-neutral-900">Marketplace</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Exercícios públicos compartilhados por outros profissionais. Importe para sua biblioteca.
        </p>
      </div>

      <form method="GET" action="/dashboard/marketplace" className="mb-6 flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Buscar exercício..."
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-neutral-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          name="level"
          defaultValue={level ?? ''}
          className="text-sm rounded-lg border border-neutral-200 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos os níveis</option>
          <option value="beginner">Iniciante</option>
          <option value="intermediate">Intermediário</option>
          <option value="advanced">Avançado</option>
        </select>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Buscar
        </button>
      </form>

      {exercises.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-200 bg-white p-14 text-center">
          <Globe className="mx-auto mb-3 h-10 w-10 text-neutral-300" />
          <h3 className="font-medium text-neutral-900">Nenhum exercício encontrado</h3>
          <p className="mt-1 text-sm text-neutral-500">
            {(q ?? level)
              ? 'Tente outros filtros.'
              : 'Ainda não há exercícios públicos. Publique os seus em Exercícios → Editar.'}
          </p>
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
              <div key={ex.id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-neutral-100">
                  {ex.videoUrl ? (
                    ex.videoProvider === 'youtube' || ex.videoProvider === 'vimeo' ? (
                      <LinkIcon className="h-4 w-4 text-neutral-500" />
                    ) : (
                      <Video className="h-4 w-4 text-neutral-500" />
                    )
                  ) : (
                    <Globe className="h-4 w-4 text-neutral-400" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
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
                    <span className="text-xs text-blue-600 font-medium">por {ex.authorName}</span>
                  </div>
                </div>

                <ImportButton exerciseId={ex.id} token={session.access_token} />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
