'use client'

import { useState } from 'react'
import { UserPlus, Copy, Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { api } from '@/lib/api'

interface Invite {
  code: string
  expiresAt: string
}

interface InviteButtonProps {
  token: string
}

export function InviteButton({ token }: InviteButtonProps) {
  const [invite, setInvite] = useState<Invite | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [open, setOpen] = useState(false)

  async function createInvite() {
    setIsLoading(true)
    setError(null)
    try {
      const result = await api.post<Invite>('/students/invites', {}, token)
      setInvite(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar convite')
    } finally {
      setIsLoading(false)
    }
  }

  function handleOpenChange(value: boolean) {
    setOpen(value)
    if (!value) {
      setInvite(null)
      setError(null)
    }
  }

  async function copyCode() {
    if (!invite) return
    await navigator.clipboard.writeText(invite.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          className="gap-2"
          onClick={() => {
            setOpen(true)
            createInvite()
          }}
        >
          <UserPlus className="h-4 w-4" />
          Convidar aluno
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Convidar novo aluno</DialogTitle>
          <DialogDescription>
            Compartilhe o código abaixo com seu aluno para que ele possa baixar o app e se vincular
            à sua conta.
          </DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-100 p-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {invite && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 rounded-lg bg-neutral-50 border border-neutral-200 px-4 py-3">
              <span className="flex-1 text-center text-2xl font-mono font-bold tracking-widest text-neutral-900">
                {invite.code}
              </span>
              <Button variant="ghost" size="icon" onClick={copyCode} className="shrink-0">
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-center text-xs text-neutral-400">
              Válido até{' '}
              {new Date(invite.expiresAt).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'long',
              })}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
