'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, CheckCircle2 } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/api'

const COUNCIL_OPTIONS = [
  { value: 'cref', label: 'CREF', hint: 'Ex: 123456-G/SP', placeholder: '123456-G/SP' },
  { value: 'crefito', label: 'CREFITO', hint: 'Ex: 1-12345-F', placeholder: '1-12345-F' },
  { value: 'crm', label: 'CRM', hint: 'Ex: 12345/SP', placeholder: '12345/SP' },
  { value: 'crn', label: 'CRN', hint: 'Ex: 1234/SP', placeholder: '1234/SP' },
  {
    value: 'outro',
    label: 'Outro',
    hint: 'Número do seu registro profissional',
    placeholder: 'Número do registro',
  },
] as const

type CouncilValue = (typeof COUNCIL_OPTIONS)[number]['value']

const schema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
  councilType: z.enum(['cref', 'crefito', 'crm', 'crn', 'outro']),
  cref: z.string().min(3, 'Número de registro inválido').max(30),
  bio: z.string().max(500).optional(),
  consentLgpd: z.literal(true, {
    errorMap: () => ({ message: 'Você deve aceitar os termos para continuar' }),
  }),
})

type FormData = z.infer<typeof schema>

function getSupabaseClient() {
  return createBrowserClient(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!,
  )
}

export default function OnboardingPage() {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { councilType: 'cref' },
  })

  const selectedCouncil = watch('councilType') as CouncilValue
  const councilMeta =
    COUNCIL_OPTIONS.find((c) => c.value === selectedCouncil) ?? COUNCIL_OPTIONS[0]!

  async function onSubmit(data: FormData) {
    setServerError(null)
    try {
      const supabase = getSupabaseClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }
      await api.post('/auth/personals/onboard', data, session.access_token)
      router.push('/dashboard')
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Erro ao salvar perfil')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <span className="text-2xl font-bold text-blue-600">AthletiQLab</span>
          <h1 className="mt-3 text-2xl font-semibold text-neutral-900">Configure seu perfil</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Apenas uma vez — levará menos de 2 minutos.
          </p>
        </div>

        <div className="rounded-xl bg-white p-8 shadow-sm border border-neutral-100">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="name">Nome completo</Label>
              <Input
                id="name"
                placeholder="Ana Carvalho"
                {...register('name')}
                aria-invalid={!!errors.name}
              />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Conselho profissional</Label>
              <div className="flex gap-2 flex-wrap">
                {COUNCIL_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-center gap-1.5 cursor-pointer rounded-md border px-3 py-1.5 text-sm transition-colors ${
                      selectedCouncil === opt.value
                        ? 'border-blue-600 bg-blue-50 text-blue-700 font-medium'
                        : 'border-neutral-200 text-neutral-600 hover:border-neutral-300'
                    }`}
                  >
                    <input
                      type="radio"
                      value={opt.value}
                      className="sr-only"
                      {...register('councilType')}
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cref">Número do registro ({councilMeta.label})</Label>
              <Input
                id="cref"
                placeholder={councilMeta.placeholder}
                {...register('cref')}
                aria-invalid={!!errors.cref}
              />
              {errors.cref ? (
                <p className="text-xs text-red-500">{errors.cref.message}</p>
              ) : (
                <p className="text-xs text-neutral-400">{councilMeta.hint}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="bio">
                Bio <span className="text-neutral-400">(opcional)</span>
              </Label>
              <textarea
                id="bio"
                rows={3}
                placeholder="Especialidade, anos de experiência..."
                className="flex w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm placeholder:text-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                {...register('bio')}
              />
            </div>

            <div className="flex items-start gap-3 rounded-lg bg-neutral-50 p-4">
              <input
                id="consent"
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-600"
                {...register('consentLgpd')}
              />
              <Label
                htmlFor="consent"
                className="text-sm font-normal leading-relaxed cursor-pointer"
              >
                Li e aceito a{' '}
                <a href="/privacidade" target="_blank" className="text-blue-600 underline">
                  Política de Privacidade
                </a>{' '}
                e autorizo o tratamento dos meus dados conforme a LGPD.
              </Label>
            </div>
            {errors.consentLgpd && (
              <p className="text-xs text-red-500">{errors.consentLgpd.message}</p>
            )}

            {serverError && (
              <div className="rounded-lg bg-red-50 border border-red-100 p-3">
                <p className="text-sm text-red-700">{serverError}</p>
              </div>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-2 h-4 w-4" />
              )}
              Começar meu teste grátis
            </Button>
          </form>
        </div>

        <p className="mt-4 text-center text-xs text-neutral-400">
          14 dias grátis. Sem necessidade de cartão de crédito.
        </p>
      </div>
    </div>
  )
}
