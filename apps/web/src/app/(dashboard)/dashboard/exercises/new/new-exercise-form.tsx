'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Props {
  token: string
}

type VideoMode = 'none' | 'upload' | 'youtube'

const LEVEL_OPTIONS = [
  { value: 'beginner', label: 'Iniciante' },
  { value: 'intermediate', label: 'Intermediário' },
  { value: 'advanced', label: 'Avançado' },
]

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001'

export function NewExerciseForm({ token }: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [videoMode, setVideoMode] = useState<VideoMode>('none')
  const [uploadProgress, setUploadProgress] = useState<'idle' | 'uploading' | 'done'>('idle')
  const [uploadedKey, setUploadedKey] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: '',
    description: '',
    techniqueTips: '',
    level: 'beginner',
    modality: '',
    muscleGroup: '',
    equipment: '',
    youtubeUrl: '',
  })

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function parseTags(raw: string): string[] {
    return raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  }

  async function handleUpload(file: File) {
    setUploadProgress('uploading')
    try {
      const sigRes = await fetch(`${API_URL}/exercises/upload-video`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ filename: file.name, contentType: file.type }),
      })
      if (!sigRes.ok) throw new Error('Falha ao obter URL de upload')
      const { data } = (await sigRes.json()) as { data: { uploadUrl: string; key: string } }

      const uploadRes = await fetch(data.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      })
      if (!uploadRes.ok) throw new Error('Falha no upload do vídeo')

      setUploadedKey(data.key)
      setUploadProgress('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro no upload')
      setUploadProgress('idle')
    }
  }

  async function handleSave() {
    if (!form.name.trim()) {
      setError('Nome é obrigatório')
      return
    }

    setSaving(true)
    setError(null)

    try {
      if (videoMode === 'youtube') {
        const payload = {
          url: form.youtubeUrl,
          name: form.name,
          ...(form.description ? { description: form.description } : {}),
          level: form.level,
          muscleGroup: parseTags(form.muscleGroup),
          modality: parseTags(form.modality),
          equipment: parseTags(form.equipment),
        }
        const res = await fetch(`${API_URL}/exercises/youtube`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        })
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { message?: string }
          throw new Error(body.message ?? `Erro ${res.status}`)
        }
      } else {
        const payload: Record<string, unknown> = {
          name: form.name,
          level: form.level,
          muscleGroup: parseTags(form.muscleGroup),
          modality: parseTags(form.modality),
          equipment: parseTags(form.equipment),
          contraindications: [],
          ...(form.description ? { description: form.description } : {}),
          ...(form.techniqueTips ? { techniqueTips: form.techniqueTips } : {}),
          ...(uploadedKey ? { videoUrl: uploadedKey, videoProvider: 'cloudflare' } : {}),
        }
        const res = await fetch(`${API_URL}/exercises`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        })
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { message?: string }
          throw new Error(body.message ?? `Erro ${res.status}`)
        }
      }

      router.push('/dashboard/exercises')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar')
    } finally {
      setSaving(false)
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

      {/* Video */}
      <div className="space-y-2">
        <Label>Vídeo (opcional)</Label>
        <div className="flex gap-2">
          {(['none', 'upload', 'youtube'] as VideoMode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setVideoMode(m)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${
                videoMode === m
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
              }`}
            >
              {m === 'none' ? 'Sem vídeo' : m === 'upload' ? 'Upload (R2)' : 'YouTube / Vimeo'}
            </button>
          ))}
        </div>

        {videoMode === 'upload' && (
          <div className="space-y-2">
            <input
              type="file"
              accept="video/mp4,video/quicktime,video/webm"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleUpload(file)
              }}
              className="text-sm text-neutral-600"
            />
            {uploadProgress === 'uploading' && (
              <p className="text-xs text-blue-600">Enviando vídeo...</p>
            )}
            {uploadProgress === 'done' && (
              <p className="text-xs text-green-600">Vídeo enviado com sucesso.</p>
            )}
          </div>
        )}

        {videoMode === 'youtube' && (
          <div className="space-y-1">
            <Input
              value={form.youtubeUrl}
              onChange={(e) => set('youtubeUrl', e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
            />
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={() => router.back()} disabled={saving}>
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          disabled={saving || (videoMode === 'upload' && uploadProgress === 'uploading')}
        >
          {saving ? 'Salvando...' : 'Criar exercício'}
        </Button>
      </div>
    </div>
  )
}
