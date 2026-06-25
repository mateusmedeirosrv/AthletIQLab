'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001'

interface Student {
  userId: string
  name: string
  status: string
}

interface Props {
  workoutId: string
  workoutTitle: string
  token: string
}

export function ApplyTemplateButton({ workoutId, workoutTitle, token }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [students, setStudents] = useState<Student[]>([])
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [customTitle, setCustomTitle] = useState(workoutTitle)
  const [applying, setApplying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || students.length > 0) return
    fetch(`${API_URL}/students`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data: unknown) => {
        const list = (data as Student[]).filter((s) => s.status === 'active')
        setStudents(list)
        if (list[0]) setSelectedStudentId(list[0].userId)
      })
      .catch(() => setStudents([]))
  }, [open, students.length, token])

  async function handleApply() {
    if (!selectedStudentId) return
    setApplying(true)
    setError(null)
    try {
      const res = await fetch(`${API_URL}/workouts/${workoutId}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ studentId: selectedStudentId, title: customTitle || undefined }),
      })
      if (!res.ok) throw new Error()
      const body = (await res.json()) as { data: { id: string } }
      router.push(`/dashboard/workouts/${body.data.id}`)
      router.refresh()
    } catch {
      setError('Erro ao aplicar template')
      setApplying(false)
    }
  }

  if (!open) {
    return (
      <Button size="sm" onClick={() => setOpen(true)}>
        <UserCheck className="mr-1.5 h-3.5 w-3.5" />
        Aplicar a aluno
      </Button>
    )
  }

  return (
    <div className="w-full rounded-xl border border-violet-200 bg-violet-50 p-4 space-y-3">
      <p className="text-sm font-medium text-neutral-900">Aplicar template a um aluno</p>

      <div className="space-y-1">
        <label className="text-xs text-neutral-500">Título do treino</label>
        <input
          value={customTitle}
          onChange={(e) => setCustomTitle(e.target.value)}
          className="w-full rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs text-neutral-500">Aluno</label>
        {students.length === 0 ? (
          <p className="text-sm text-neutral-500">Nenhum aluno ativo encontrado.</p>
        ) : (
          <select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="w-full rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            {students.map((s) => (
              <option key={s.userId} value={s.userId}>
                {s.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => setOpen(false)} disabled={applying}>
          Cancelar
        </Button>
        <Button size="sm" onClick={handleApply} disabled={applying || !selectedStudentId}>
          {applying ? 'Criando...' : 'Criar treino'}
        </Button>
      </div>
    </div>
  )
}
