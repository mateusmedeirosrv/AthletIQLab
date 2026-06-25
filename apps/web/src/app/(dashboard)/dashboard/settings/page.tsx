'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CheckCircle2, Clock, Loader2, Save } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { api } from '@/lib/api'
import type { Plan } from '@athletiqlab/shared'
import { PLAN_LIMITS, PLAN_PRICES_BRL } from '@athletiqlab/shared'

const schema = z.object({
  name: z.string().min(2).max(100),
  bio: z.string().max(500).optional(),
  brandLogoUrl: z.string().url('URL inválida').optional().or(z.literal('')),
  brandColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Cor inválida')
    .optional()
    .or(z.literal('')),
})

type FormData = z.infer<typeof schema>

const COUNCIL_LABEL: Record<string, string> = {
  cref: 'CREF',
  crefito: 'CREFITO',
  crm: 'CRM',
  crn: 'CRN',
  outro: 'Registro',
}

interface PersonalProfile {
  name: string
  bio: string | null
  cref: string
  councilType: string
  crefVerifiedAt: string | null
  plan: Plan
  subscriptionStatus: string
  brandLogoUrl: string | null
  brandColor: string | null
  trialEndsAt: string | null
}

const planLabel: Record<Plan, string> = { starter: 'Starter', pro: 'Pro', elite: 'Elite' }

function getSupabaseClient() {
  return createBrowserClient(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!,
  )
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<PersonalProfile | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  useEffect(() => {
    async function load() {
      const supabase = getSupabaseClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) return
      setToken(session.access_token)
      try {
        const data = await api.get<PersonalProfile>('/personals/me', session.access_token)
        setProfile(data)
        reset({
          name: data.name,
          bio: data.bio ?? '',
          brandLogoUrl: data.brandLogoUrl ?? '',
          brandColor: data.brandColor ?? '',
        })
      } catch {
        // ignore
      }
    }
    void load()
  }, [reset])

  async function onSubmit(data: FormData) {
    if (!token) return
    try {
      const updated = await api.patch<PersonalProfile>(
        '/personals/me',
        {
          name: data.name,
          bio: data.bio ?? null,
          brandLogoUrl: data.brandLogoUrl || null,
          brandColor: data.brandColor || null,
        },
        token,
      )
      setProfile(updated)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      // TODO: show error
    }
  }

  if (!profile) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
      </div>
    )
  }

  const maxStudents = PLAN_LIMITS[profile.plan].maxStudents
  const priceKey = profile.plan as keyof typeof PLAN_PRICES_BRL
  const monthlyPrice = (PLAN_PRICES_BRL[priceKey] / 100).toFixed(0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Configurações</h1>
        <p className="mt-1 text-sm text-neutral-500">Gerencie seu perfil e assinatura.</p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle>Perfil profissional</CardTitle>
          <CardDescription>Essas informações são visíveis para seus alunos.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" {...register('name')} />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="bio">
                Bio <span className="text-neutral-400">(opcional)</span>
              </Label>
              <textarea
                id="bio"
                rows={3}
                className="flex w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm placeholder:text-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 resize-none"
                {...register('bio')}
              />
            </div>

            {profile.plan === 'elite' && (
              <div className="space-y-1.5">
                <Label htmlFor="brandLogoUrl">Logo da marca (URL)</Label>
                <Input
                  id="brandLogoUrl"
                  placeholder="https://seusite.com/logo.png"
                  {...register('brandLogoUrl')}
                />
                {errors.brandLogoUrl && (
                  <p className="text-xs text-red-500">{errors.brandLogoUrl.message}</p>
                )}
                <p className="text-xs text-neutral-400">
                  URL pública da logo exibida no app do aluno.
                </p>
              </div>
            )}

            {profile.plan === 'elite' && (
              <div className="space-y-1.5">
                <Label htmlFor="brandColor">Cor da marca (hex)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="brandColor"
                    placeholder="#2563EB"
                    {...register('brandColor')}
                    className="max-w-[180px]"
                  />
                  {!errors.brandColor && (
                    <div
                      className="h-9 w-9 rounded-md border border-neutral-200"
                      style={{ backgroundColor: profile.brandColor ?? '#2563EB' }}
                    />
                  )}
                </div>
                {errors.brandColor && (
                  <p className="text-xs text-red-500">{errors.brandColor.message}</p>
                )}
              </div>
            )}

            <div className="flex items-center gap-3">
              <Button type="submit" disabled={isSubmitting} className="gap-2">
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Salvar alterações
              </Button>
              {saved && <p className="text-sm text-green-600">Salvo!</p>}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Council registration */}
      <Card>
        <CardHeader>
          <CardTitle>Registro profissional</CardTitle>
          <CardDescription>
            Seu número de conselho é verificado manualmente pela equipe AthletiQLab.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-lg bg-neutral-50 border border-neutral-200 px-5 py-4">
            <div>
              <p className="text-sm font-medium text-neutral-900">
                {COUNCIL_LABEL[profile.councilType] ?? 'Registro'}{' '}
                <span className="font-mono">{profile.cref}</span>
              </p>
            </div>
            {profile.crefVerifiedAt ? (
              <span className="flex items-center gap-1.5 text-sm font-medium text-green-700">
                <CheckCircle2 className="h-4 w-4" />
                Verificado
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-sm text-amber-600">
                <Clock className="h-4 w-4" />
                Aguardando verificação
              </span>
            )}
          </div>
          {!profile.crefVerifiedAt && (
            <p className="mt-3 text-xs text-neutral-500">
              Enviamos um e-mail de confirmação. A verificação costuma ocorrer em até 48 horas
              úteis.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Plan */}
      <Card id="billing">
        <CardHeader>
          <CardTitle>Plano e faturamento</CardTitle>
          <CardDescription>Gerencie sua assinatura.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg bg-neutral-50 border border-neutral-200 px-5 py-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-neutral-900">{planLabel[profile.plan]}</span>
                <Badge variant="secondary">R$ {monthlyPrice}/mês</Badge>
              </div>
              <p className="mt-0.5 text-sm text-neutral-500">
                Até {maxStudents === Infinity ? 'alunos ilimitados' : `${maxStudents} alunos`}
              </p>
            </div>
            <Button variant="outline" size="sm">
              Gerenciar plano
            </Button>
          </div>
          {profile.subscriptionStatus === 'trialing' && profile.trialEndsAt && (
            <p className="text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3">
              Seu período de teste termina em{' '}
              {new Date(profile.trialEndsAt).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })}
              . Adicione um método de pagamento para continuar.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
