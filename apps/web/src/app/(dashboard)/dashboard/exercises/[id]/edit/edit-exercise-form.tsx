'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Exercise {
  id: string
  name: string
  description: string | null
  techniqueTips: string | null
  level: string
  modality: string
  muscleGroup: string
  equipment: string
  videoUrl: string | null
  videoProvider: string | null
  source: string
}

interface Props {
  exercise: Exercise
  token: string
}

const LEVEL_OPTIONS = [
  { value: 'beginner', label: 'Iniciante' },
  { value: 'intermediate', label: 'Intermediário' },
  { value: 'advanced', label: 'Avançado' },
]

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001'

function parseTags(raw: string): string[] {
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

function joinTags(json: string): string {
  try {
    const arr = JSON.parse(json) as string[]
    return arr.join(', ')
  } catch {
    return json
  }
}

export function EditExerciseForm({ exercise, token }: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isExternalLink = exercise.videoProvider === 'youtube' || exercise.videoProvider === 'vimeo'

  const [form, setForm] = useState({
    name: exercise.name,
    description: exercise.description ?? '',
    techniqueTips: exercise.techniqueTips ?? '',
    level: exercise.level,
    modality: joinTags(exercise.modality),
    muscleGroup: joinTags(exercise.muscleGroup),
    equipment: joinTags(exercise.equipment),
    videoUrl: exercise.videoUrl ?? '',
  })

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSave() {
    if (!form.name.trim()) {
      setError('Nome é obrigatório')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const payload: Record<string, unknown> = {
        name: form.name,
        level: form.level,
        muscleGroup: parseTags(form.muscleGroup),
        modality: parseTags(form.modality),
        equipment: parseTags(form.equipment),
        ...(form.description ? { description: form.description } : {}),
        ...(form.techniqueTips ? { techniqueTips: form.techniqueTips } : {}),
        ...(isExternalLink ? { videoUrl: form.videoUrl } : {}),
      }

      const res = await fetch(`${API_URL}/exercises/${exercise.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string }
        throw new Error(body.message ?? `Erro ${res.status}`)
      }

      router.push('/dashboard/exercises')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Excluir este exercício? Esta ação não pode ser desfeita.')) return

    setDeleting(true)
    try {
      const res = await fetch(`${API_URL}/exercises/${exercise.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok && res.status !== 204) {
        const body = (await res.json().catch(() => ({}))) as { message?: string }
        throw new Error(body.message ?? `Erro ${res.status}`)
      }

      router.push('/dashboard/exercises')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir')
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-5 rounded-xl border border-neutral-200 bg-white p-6">
      <div className="space-y-1">
        <Label htmlFor="name">Nome do exercício *</Label>
        <Input
          id="name"
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          placeholder="Ex: Supino reto com halteres"
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="description">Descrição</Label>
        <textarea
          id="description"
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          rows={3}
          className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          placeholder="Descreva a execução do exercício..."
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="techniqueTips">Dicas de técnica</Label>
        <textarea
          id="techniqueTips"
          value={form.techniqueTips}
          onChange={(e) => set('techniqueTips', e.target.value)}
          rows={2}
          className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          placeholder="Ex: Mantenha os cotovelos levemente flexionados..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="level">Nível</Label>
          <select
            id="level"
            value={form.level}
            onChange={(e) => set('level', e.target.value)}
            className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {LEVEL_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="muscleGroup">Grupos musculares (vírgula)</Label>
          <Input
            id="muscleGroup"
            value={form.muscleGroup}
            onChange={(e) => set('muscleGroup', e.target.value)}
            placeholder="Ex: peito, tríceps"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="modality">Modalidade(s) (vírgula)</Label>
          <Input
            id="modality"
            value={form.modality}
            onChange={(e) => set('modality', e.target.value)}
            placeholder="Ex: academia, funcional"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="equipment">Equipamentos (vírgula)</Label>
          <Input
            id="equipment"
            value={form.equipment}
            onChange={(e) => set('equipment', e.target.value)}
            placeholder="Ex: halteres, banco"
          />
        </div>
      </div>

      {isExternalLink && (
        <div className="space-y-1">
          <Label htmlFor="videoUrl">
            URL do {exercise.videoProvider === 'youtube' ? 'YouTube' : 'Vimeo'}
          </Label>
          <Input
            id="videoUrl"
            value={form.videoUrl}
            onChange={(e) => set('videoUrl', e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
          />
        </div>
      )}

      {exercise.videoProvider === 'cloudflare' && (
        <p className="text-sm text-neutral-500 bg-neutral-50 rounded-lg px-3 py-2">
          Vídeo enviado via R2. Para trocar, exclua e crie um novo exercício.
        </p>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center justify-between pt-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          disabled={deleting || saving}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          {deleting ? 'Excluindo...' : 'Excluir exercício'}
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.back()} disabled={saving || deleting}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving || deleting}>
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </div>
    </div>
  )
}
