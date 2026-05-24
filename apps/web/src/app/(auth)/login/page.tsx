'use client'

import { useActionState, useState } from 'react'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { signInWithGoogle, signInWithMagicLink, signInWithPassword } from '../actions'

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
)

export default function LoginPage() {
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const [usePassword, setUsePassword] = useState(false)
  const [state, formAction, isPending] = useActionState(
    async (_prev: unknown, formData: FormData) => {
      if (usePassword) {
        return await signInWithPassword(_prev, formData)
      }
      const result = await signInWithMagicLink(_prev, formData)
      if (result?.success) setMagicLinkSent(true)
      return result
    },
    null,
  )

  if (magicLinkSent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50">
        <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-sm border border-neutral-100 text-center">
          <div className="mb-4 text-4xl">📩</div>
          <h2 className="text-xl font-semibold text-neutral-900 mb-2">Verifique seu e-mail</h2>
          <p className="text-sm text-neutral-500">
            Enviamos um link de acesso. Pode fechar essa janela.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="text-2xl font-bold text-blue-600">
            AthletiQLab
          </Link>
          <p className="mt-1 text-sm text-neutral-500">Plataforma para personal trainers</p>
        </div>

        <div className="rounded-xl bg-white p-8 shadow-sm border border-neutral-100">
          <h1 className="mb-6 text-xl font-semibold text-neutral-900">Acessar plataforma</h1>

          <form action={signInWithGoogle}>
            <Button type="submit" variant="outline" className="w-full gap-3" size="lg">
              <GoogleIcon />
              Continuar com Google
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-neutral-200" />
            <span className="text-xs text-neutral-400">ou</span>
            <div className="h-px flex-1 bg-neutral-200" />
          </div>

          <form action={formAction} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="seu@email.com"
                required
                autoComplete="email"
              />
            </div>
            {usePassword && (
              <div className="space-y-1.5">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
              </div>
            )}
            {state?.error && <p className="text-xs text-red-500">{state.error}</p>}
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
              {usePassword ? 'Entrar com senha' : 'Enviar link de acesso'}
            </Button>
            <button
              type="button"
              onClick={() => setUsePassword((v) => !v)}
              className="w-full text-center text-xs text-neutral-400 hover:text-neutral-600"
            >
              {usePassword ? 'Usar link de acesso por e-mail' : 'Entrar com senha'}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-neutral-400">
            Ao continuar, você concorda com nossos{' '}
            <a href="#" className="underline hover:text-neutral-600">
              Termos
            </a>{' '}
            e{' '}
            <a href="#" className="underline hover:text-neutral-600">
              Privacidade
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  )
}
