'use client'

import { useState } from 'react'
import { ArrowRightLeft, Loader2, Sparkles, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001'

interface SubstituteResult {
  exerciseId: string
  exerciseName: string
  reason: string
  notes?: string
}

interface AiSubstituteProps {
  workoutId: string
  workoutExerciseId: string
  exerciseName: string
  token: string
}

export function AiSubstituteButton({
  workoutId,
  workoutExerciseId,
  exerciseName,
  token,
}: AiSubstituteProps) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<SubstituteResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function substitute() {
    if (!reason.trim()) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(
        `${API_URL}/workouts/${workoutId}/exercises/${workoutExerciseId}/substitute`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ reason: reason.trim(), restrictions: [], equipment: [] }),
        },
      )
      const json = (await res.json()) as {
        data?: SubstituteResult
        error?: { message?: string }
      }
      if (!res.ok) {
        setError(json.error?.message ?? `Erro ${res.status}`)
        return
      }
      setResult(json.data ?? null)
    } catch {
      setError('Erro de rede.')
    } finally {
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium text-neutral-400 hover:bg-neutral-100 hover:text-blue-600 transition-colors"
        title="Substituir com IA"
      >
        <ArrowRightLeft className="h-3 w-3" />
        Substituir
      </button>
    )
  }

  return (
    <div className="mt-2 rounded-lg border border-blue-100 bg-blue-50/60 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs font-medium text-blue-700">
          <Sparkles className="h-3 w-3" />
          Substituição de &ldquo;{exerciseName}&rdquo;
        </span>
        <button
          onClick={() => {
            setOpen(false)
            setResult(null)
            setError(null)
          }}
          className="text-neutral-400 hover:text-neutral-600"
        >
          ×
        </button>
      </div>

      {!result && (
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label className="text-xs text-neutral-600 block mb-1">Motivo da substituição</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="ex: sem equipamento, lesão no ombro..."
              className="w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              onKeyDown={(e) => {
                if (e.key === 'Enter') void substitute()
              }}
            />
          </div>
          <Button
            size="sm"
            onClick={substitute}
            disabled={loading || !reason.trim()}
            className="gap-1.5 shrink-0"
          >
            {loading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Sparkles className="h-3 w-3" />
            )}
            {loading ? 'Buscando...' : 'Sugerir'}
          </Button>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-xs text-red-700">
          <XCircle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-1.5">
          <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2.5">
            <p className="text-sm font-semibold text-green-800">{result.exerciseName}</p>
            {result.notes && <p className="text-xs text-green-700 mt-0.5">{result.notes}</p>}
            <p className="text-xs text-green-600 mt-1">Motivo: {result.reason}</p>
          </div>
          <button
            onClick={() => {
              setResult(null)
              setReason('')
            }}
            className="text-xs text-neutral-400 hover:text-neutral-600"
          >
            Tentar de novo
          </button>
        </div>
      )}
    </div>
  )
}
