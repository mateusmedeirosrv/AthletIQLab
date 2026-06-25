'use client'

import { useState } from 'react'
import { CheckCircle2 } from 'lucide-react'

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001'

interface ImportButtonProps {
  exerciseId: string
  token: string
}

export function ImportButton({ exerciseId, token }: ImportButtonProps) {
  const [state, setState] = useState<'idle' | 'loading' | 'done'>('idle')
  const [hasError, setHasError] = useState(false)

  async function handleImport() {
    setState('loading')
    setHasError(false)
    try {
      const res = await fetch(`${API_URL}/exercises/${exerciseId}/import`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error()
      setState('done')
    } catch {
      setState('idle')
      setHasError(true)
    }
  }

  if (state === 'done') {
    return (
      <span className="flex items-center gap-1.5 text-sm font-medium text-green-600 shrink-0">
        <CheckCircle2 className="h-4 w-4" />
        Importado
      </span>
    )
  }

  return (
    <div className="flex flex-col items-end gap-1 shrink-0">
      <button
        onClick={handleImport}
        disabled={state === 'loading'}
        className="text-sm font-medium px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors disabled:opacity-50"
      >
        {state === 'loading' ? 'Importando...' : 'Importar'}
      </button>
      {hasError && <span className="text-xs text-red-500">Erro. Tente novamente.</span>}
    </div>
  )
}
