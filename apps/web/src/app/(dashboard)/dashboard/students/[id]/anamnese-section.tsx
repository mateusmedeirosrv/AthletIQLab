'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Props {
  studentId: string
  filled: boolean
  token: string
}

const API_URL =
  process.env['NEXT_PUBLIC_API_URL'] ?? process.env['API_URL'] ?? 'http://localhost:3001'

const GOAL_OPTIONS = [
  { value: 'hypertrophy', label: 'Hipertrofia' },
  { value: 'weight_loss', label: 'Emagrecimento' },
  { value: 'conditioning', label: 'Condicionamento' },
  { value: 'rehab', label: 'Reabilitação' },
  { value: 'general_health', label: 'Saúde Geral' },
]

const LEVEL_OPTIONS = [
  { value: 'beginner', label: 'Iniciante' },
  { value: 'intermediate', label: 'Intermediário' },
  { value: 'advanced', label: 'Avançado' },
]

export function AnamneseSection({ studentId, filled: initialFilled, token }: Props) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    weightKg: '',
    heightCm: '',
    bodyFatPct: '',
    goal: 'general_health',
    experienceLevel: 'beginner',
    weeklyFrequency: '3',
    restrictions: '',
    medications: '',
    medicalNotes: '',
  })

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      const payload = {
        goal: form.goal,
        experienceLevel: form.experienceLevel,
        weeklyFrequency: parseInt(form.weeklyFrequency, 10),
        restrictions: form.restrictions
          ? form.restrictions
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
          : [],
        medications: form.medications
          ? form.medications
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
          : [],
        ...(form.weightKg ? { weightKg: form.weightKg } : {}),
        ...(form.heightCm ? { heightCm: form.heightCm } : {}),
        ...(form.bodyFatPct ? { bodyFatPct: form.bodyFatPct } : {}),
        ...(form.medicalNotes ? { medicalNotes: form.medicalNotes } : {}),
      }

      const res = await fetch(`${API_URL}/students/${studentId}/anamnese`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string }
        throw new Error(body.message ?? `Erro ${res.status}`)
      }

      setSaved(true)
      setOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  const isFilled = initialFilled || saved

  if (!open) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white p-6 flex items-center justify-between">
        <div>
          {isFilled ? (
            <p className="text-sm text-neutral-700">Anamnese preenchida.</p>
          ) : (
            <p className="text-sm text-neutral-500">Nenhuma anamnese cadastrada ainda.</p>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
          {isFilled ? 'Atualizar' : 'Preencher'}
        </Button>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-6 space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1">
          <Label htmlFor="weightKg">Peso (kg)</Label>
          <Input
            id="weightKg"
            value={form.weightKg}
            onChange={(e) => set('weightKg', e.target.value)}
            placeholder="70.0"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="heightCm">Altura (cm)</Label>
          <Input
            id="heightCm"
            value={form.heightCm}
            onChange={(e) => set('heightCm', e.target.value)}
            placeholder="175"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="bodyFatPct">% Gordura</Label>
          <Input
            id="bodyFatPct"
            value={form.bodyFatPct}
            onChange={(e) => set('bodyFatPct', e.target.value)}
            placeholder="18.0"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="goal">Objetivo</Label>
          <select
            id="goal"
            value={form.goal}
            onChange={(e) => set('goal', e.target.value)}
            className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {GOAL_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="experienceLevel">Nível</Label>
          <select
            id="experienceLevel"
            value={form.experienceLevel}
            onChange={(e) => set('experienceLevel', e.target.value)}
            className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {LEVEL_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="weeklyFrequency">Frequência semanal (dias)</Label>
        <Input
          id="weeklyFrequency"
          type="number"
          min={1}
          max={7}
          value={form.weeklyFrequency}
          onChange={(e) => set('weeklyFrequency', e.target.value)}
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="restrictions">Restrições (separadas por vírgula)</Label>
        <Input
          id="restrictions"
          value={form.restrictions}
          onChange={(e) => set('restrictions', e.target.value)}
          placeholder="Ex: joelho, ombro direito"
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="medications">Medicamentos (separados por vírgula)</Label>
        <Input
          id="medications"
          value={form.medications}
          onChange={(e) => set('medications', e.target.value)}
          placeholder="Ex: losartana, metformina"
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="medicalNotes">Observações médicas</Label>
        <textarea
          id="medicalNotes"
          value={form.medicalNotes}
          onChange={(e) => set('medicalNotes', e.target.value)}
          rows={3}
          className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          placeholder="Informações adicionais relevantes..."
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
          Cancelar
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Salvando...' : 'Salvar anamnese'}
        </Button>
      </div>
    </div>
  )
}
