import Link from 'next/link'
import { CheckCircle2, Brain, Video, Watch, Palette, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PLAN_PRICES_BRL, PLAN_LIMITS } from '@athletiqlab/shared'

const features = [
  {
    icon: Brain,
    title: 'IA que entende de treino',
    description:
      'Gere treinos completos em segundos com base na anamnese e objetivos do aluno. Baseado nas metodologias Bompa e ACSM.',
  },
  {
    icon: Video,
    title: 'Vídeos estilo Reels',
    description:
      'Seus alunos assistem os exercícios no app mobile em formato vertical, com auto-play e feedback em tempo real.',
  },
  {
    icon: Watch,
    title: 'Integração SmartWatch',
    description:
      'Monitore frequência cardíaca e dados de execução direto do Apple Watch e Wear OS durante o treino.',
  },
  {
    icon: Palette,
    title: 'Sua marca, sua identidade',
    description:
      'Personalize cores e logo no plano Elite. Seus alunos veem a sua marca, não a nossa.',
  },
]

const plans = [
  {
    key: 'starter' as const,
    name: 'Starter',
    priceLabel: `R$ ${(PLAN_PRICES_BRL.starter / 100).toFixed(0).replace('.', ',')}/mês`,
    description: 'Para quem está começando',
    features: [
      `Até ${PLAN_LIMITS.starter.maxStudents} alunos`,
      `${PLAN_LIMITS.starter.aiCallsPerMonth} gerações de treino/mês`,
      'App mobile para alunos',
      'Suporte por e-mail',
    ],
    cta: 'Começar grátis',
    highlight: false,
  },
  {
    key: 'pro' as const,
    name: 'Pro',
    priceLabel: `R$ ${(PLAN_PRICES_BRL.pro / 100).toFixed(0).replace('.', ',')}/mês`,
    description: 'Para quem quer crescer',
    features: [
      `Até ${PLAN_LIMITS.pro.maxStudents} alunos`,
      `${PLAN_LIMITS.pro.aiCallsPerMonth} gerações de treino/mês`,
      'Vídeos customizados',
      'Chat com alunos',
      'Suporte prioritário',
    ],
    cta: 'Testar grátis por 14 dias',
    highlight: true,
  },
  {
    key: 'elite' as const,
    name: 'Elite',
    priceLabel: `R$ ${(PLAN_PRICES_BRL.elite / 100).toFixed(0).replace('.', ',')}/mês`,
    description: 'Para studios e academias',
    features: [
      'Alunos ilimitados',
      `${PLAN_LIMITS.elite.aiCallsPerMonth} gerações de treino/mês`,
      'White-label completo',
      'Vídeos e marca própria',
      'Gerente de conta dedicado',
    ],
    cta: 'Falar com vendas',
    highlight: false,
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-neutral-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <span className="text-xl font-bold text-blue-600">AthletiQLab</span>
          <nav className="hidden items-center gap-6 text-sm font-medium text-neutral-600 md:flex">
            <a href="#features" className="hover:text-neutral-900 transition-colors">
              Recursos
            </a>
            <a href="#pricing" className="hover:text-neutral-900 transition-colors">
              Planos
            </a>
          </nav>
          <Button asChild size="sm">
            <Link href="/login">Entrar</Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6 sm:py-32">
        <Badge variant="secondary" className="mb-6">
          Novo: integração SmartWatch disponível
        </Badge>
        <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight text-neutral-900 sm:text-6xl">
          Crie treinos personalizados com IA.{' '}
          <span className="text-blue-600">Entregue como Reels.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-neutral-500">
          A plataforma que une inteligência artificial, vídeos estilo TikTok e SmartWatch para
          personal trainers que querem se destacar.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button asChild size="lg" className="gap-2">
            <Link href="/login">
              Começar grátis — 14 dias
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <a href="#pricing">Ver planos</a>
          </Button>
        </div>
        <p className="mt-4 text-sm text-neutral-400">
          Sem cartão de crédito. Cancele quando quiser.
        </p>
      </section>

      {/* Features */}
      <section id="features" className="bg-neutral-50 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-14 text-center">
            <h2 className="text-3xl font-bold text-neutral-900">
              Tudo que você precisa para escalar
            </h2>
            <p className="mt-3 text-neutral-500">Menos planilha. Mais resultado.</p>
          </div>
          <div className="grid gap-8 sm:grid-cols-2">
            {features.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="rounded-xl bg-white p-7 shadow-sm border border-neutral-100"
              >
                <div className="mb-4 inline-flex rounded-lg bg-blue-50 p-3 text-blue-600">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-neutral-900">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-500">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-14 text-center">
            <h2 className="text-3xl font-bold text-neutral-900">Planos simples e transparentes</h2>
            <p className="mt-3 text-neutral-500">
              14 dias grátis em qualquer plano. Sem surpresas.
            </p>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.key}
                className={`relative rounded-2xl p-8 ${
                  plan.highlight
                    ? 'bg-blue-600 text-white shadow-xl ring-2 ring-blue-600'
                    : 'border border-neutral-200 bg-white'
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <Badge className="bg-green-500 border-transparent shadow-sm">
                      Mais popular
                    </Badge>
                  </div>
                )}
                <div className="mb-6">
                  <h3
                    className={`text-lg font-bold ${plan.highlight ? 'text-white' : 'text-neutral-900'}`}
                  >
                    {plan.name}
                  </h3>
                  <p
                    className={`mt-1 text-sm ${plan.highlight ? 'text-blue-100' : 'text-neutral-500'}`}
                  >
                    {plan.description}
                  </p>
                  <div className="mt-4">
                    <span
                      className={`text-3xl font-bold ${plan.highlight ? 'text-white' : 'text-neutral-900'}`}
                    >
                      {plan.priceLabel}
                    </span>
                  </div>
                </div>
                <ul className="mb-8 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm">
                      <CheckCircle2
                        className={`h-4 w-4 shrink-0 ${plan.highlight ? 'text-blue-200' : 'text-green-600'}`}
                      />
                      <span className={plan.highlight ? 'text-blue-50' : 'text-neutral-600'}>
                        {f}
                      </span>
                    </li>
                  ))}
                </ul>
                <Button
                  asChild
                  className="w-full"
                  variant={plan.highlight ? 'secondary' : 'default'}
                  size="lg"
                >
                  <Link href="/login">{plan.cta}</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-100 py-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 flex flex-col items-center gap-4 text-sm text-neutral-400 sm:flex-row sm:justify-between">
          <span className="font-medium text-blue-600">AthletiQLab</span>
          <div className="flex gap-6">
            <Link href="/termos" className="hover:text-neutral-600 transition-colors">
              Termos de Uso
            </Link>
            <Link href="/privacidade" className="hover:text-neutral-600 transition-colors">
              Privacidade
            </Link>
          </div>
          <span>© {new Date().getFullYear()} AthletiQLab</span>
        </div>
      </footer>
    </div>
  )
}
