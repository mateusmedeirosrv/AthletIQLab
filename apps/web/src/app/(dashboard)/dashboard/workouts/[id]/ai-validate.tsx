'use client'

import { useState } from 'react'
import { AlertCircle, CheckCircle2, Loader2, Sparkles, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001'

interface ValidationResult {
  score: number
  valid: boolean
  warnings: string[]
  suggestions: string[]
  summary: string
}

interface AiValidateProps {
  workoutId: string
  token: string
}

export function AiValidate({ workoutId, token }: AiValidateProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ValidationResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Inline form state
  const [goal, setGoal] = useState('hypertrophy')
  const [level, setLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate')

  async function validate() {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch(`${API_URL}/workouts/${workoutId}/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          student: { goal, experienceLevel: level, restrictions: [] },
          usePremium: false,
        }),
      })
      const json = (await res.json()) as {
        data?: ValidationResult
        error?: { message?: string }
      }
      if (!res.ok) {
        setError(json.error?.message ?? `Erro ${res.status}`)
        return
      }
      setResult(json.data ?? null)
    } catch {
      setError('Erro de rede. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <Button variant="outline" size="sm" className="gap-2" onClick={() => setOpen(true)}>
        <Sparkles className="h-3.5 w-3.5" />
        Validar com IA
      </Button>
    )
  }

  return (
    <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-medium text-blue-800">
          <Sparkles className="h-4 w-4" />
          Validação com IA
        </span>
        <button
          onClick={() => {
            setOpen(false)
            setResult(null)
            setError(null)
          }}
          className="text-neutral-400 hover:text-neutral-600 text-lg leading-none"
        >
          ×
        </button>
      </div>

      {!result && (
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="text-xs text-neutral-600 block mb-1">Objetivo do aluno</label>
            <select
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="rounded-lg border border-neutral-200 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="hypertrophy">Hipertrofia</option>
              <option value="weight_loss">Emagrecimento</option>
              <option value="conditioning">Condicionamento</option>
              <option value="rehab">Reabilitação</option>
              <option value="general_health">Saúde geral</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-neutral-600 block mb-1">Nível do aluno</label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value as typeof level)}
              className="rounded-lg border border-neutral-200 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="beginner">Iniciante</option>
              <option value="intermediate">Intermediário</option>
              <option value="advanced">Avançado</option>
            </select>
          </div>
          <Button size="sm" onClick={validate} disabled={loading} className="gap-2">
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            {loading ? 'Validando...' : 'Validar'}
          </Button>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <XCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-3">
          {/* Score */}
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold',
                result.score >= 80
                  ? 'bg-green-100 text-green-700'
                  : result.score >= 60
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-red-100 text-red-700',
              )}
            >
              {result.score}
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-900">{result.summary}</p>
              <p className="text-xs text-neutral-400">Score de qualidade</p>
            </div>
            <div className="ml-auto">
              {result.valid ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-yellow-500" />
              )}
            </div>
          </div>

          {/* Warnings */}
          {result.warnings.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-neutral-500">Avisos</p>
              {result.warnings.map((w, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-yellow-700">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  {w}
                </div>
              ))}
            </div>
          )}

          {/* Suggestions */}
          {result.suggestions.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-neutral-500">Sugestões</p>
              {result.suggestions.map((s, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-blue-700">
                  <Sparkles className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  {s}
                </div>
              ))}
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setResult(null)
            }}
          >
            Nova validação
          </Button>
        </div>
      )}
    </div>
  )
}
