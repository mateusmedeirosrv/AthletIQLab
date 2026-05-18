import { redirect } from 'next/navigation'
import { UserPlus } from 'lucide-react'
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { api } from '@/lib/api'
import { InviteButton } from './invite-button'

const statusLabel: Record<
  string,
  { label: string; variant: 'success' | 'secondary' | 'warning' | 'destructive' }
> = {
  active: { label: 'Ativo', variant: 'success' },
  invited: { label: 'Convidado', variant: 'warning' },
  paused: { label: 'Pausado', variant: 'secondary' },
  removed: { label: 'Removido', variant: 'destructive' },
}

interface Student {
  userId: string
  name: string
  photoUrl: string | null
  status: string
  createdAt: string
  inviteAcceptedAt: string | null
}

export default async function StudentsPage() {
  const supabase = await createServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  let students: Student[] = []
  try {
    students = await api.get<Student[]>('/students', session.access_token)
  } catch {
    // handled below
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Alunos</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {students.length} aluno{students.length !== 1 ? 's' : ''} cadastrado
            {students.length !== 1 ? 's' : ''}
          </p>
        </div>
        <InviteButton token={session.access_token} />
      </div>

      {students.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-200 bg-white p-14 text-center">
          <UserPlus className="mx-auto mb-3 h-10 w-10 text-neutral-300" />
          <h3 className="font-medium text-neutral-900">Nenhum aluno ainda</h3>
          <p className="mt-1 text-sm text-neutral-500">
            Crie um convite e compartilhe com seu aluno para ele baixar o app.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Aluno</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Desde</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student) => {
                const status = statusLabel[student.status] ?? {
                  label: student.status,
                  variant: 'secondary' as const,
                }
                const initials = student.name
                  .split(' ')
                  .slice(0, 2)
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                return (
                  <TableRow key={student.userId}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          {student.photoUrl && (
                            <AvatarImage src={student.photoUrl} alt={student.name} />
                          )}
                          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-neutral-900">{student.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-neutral-500">
                      {new Date(student.createdAt).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" asChild>
                        <a href={`/dashboard/students/${student.userId}`}>Ver</a>
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
  )
}
