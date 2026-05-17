# PRD — AthletiQLab

> **Product Requirements Document**
> Versão 1.0 — Maio/2026
> Autor: Mateus Medeiros + Tales Henrique + Claude Code (brainstorm colaborativo)
> Status: Aprovado para implementação

---

## Sumário

1. [Visão e Posicionamento](#1-visão-e-posicionamento)
2. [Personas e Público-Alvo](#2-personas-e-público-alvo)
3. [Modelo de Negócio e Monetização](#3-modelo-de-negócio-e-monetização)
4. [Estimativa de Custos Operacionais](#4-estimativa-de-custos-operacionais)
5. [Roadmap e Sprints](#5-roadmap-e-sprints)
6. [Arquitetura e Stack Técnica](#6-arquitetura-e-stack-técnica)
7. [Modelo de Dados](#7-modelo-de-dados)
8. [APIs e Endpoints Principais](#8-apis-e-endpoints-principais)
9. [Estratégia de IA](#9-estratégia-de-ia)
10. [Integração com SmartWatches](#10-integração-com-smartwatches)
11. [Player de Treino Estilo Reels (UX)](#11-player-de-treino-estilo-reels-ux)
12. [Segurança e Conformidade LGPD](#12-segurança-e-conformidade-lgpd)
13. [Verificação, Testes e Lançamento](#13-verificação-testes-e-lançamento)
14. [Diretório do Projeto e Convenções](#14-diretório-do-projeto-e-convenções)

---

## 1. Visão e Posicionamento

### 1.1 One-liner

**AthletiQLab é o laboratório digital onde personal trainers criam, com apoio de IA especializada em educação física, treinos personalizados que os alunos executam em uma experiência imersiva estilo Reels com integração nativa a SmartWatches.**

### 1.2 Propósito

Empoderar profissionais de educação física a entregar treinos personalizados em escala, mantendo qualidade técnica e proximidade com cada aluno, sem se afogar em planilhas, PDFs e mensagens dispersas no WhatsApp.

### 1.3 Manifesto

Acreditamos que:

- **Treino bom é treino executado.** Por isso priorizamos a UX do aluno (Reels, SmartWatch, push, chat) tanto quanto a do personal.
- **IA é copiloto, não piloto.** Nenhum treino chega ao aluno sem revisão humana do personal responsável (CREF).
- **Dados de saúde são sagrados.** LGPD não é checkbox, é arquitetura.
- **Foco no Brasil primeiro.** Mercado Pago, PIX, português brasileiro nativo, suporte a personais autônomos antes de academias.

### 1.4 Diferenciação Competitiva

| Concorrente      | O que faz bem                           | O que NÃO faz (nossa abertura)                     |
| ---------------- | --------------------------------------- | -------------------------------------------------- |
| Tecnofit         | Gestão financeira completa, marketplace | Foco em academia, sem IA, UX do aluno datada       |
| Mfit             | App polido para o aluno                 | Sem IA, sem painel web robusto para o personal     |
| Personal Manager | Tradicional no BR, base grande          | UI desatualizada, sem SmartWatch, sem IA           |
| Trainerize       | Padrão mundial, app bom                 | Em inglês, sem Mercado Pago/PIX, sem IA generativa |

**Nossa proposta única**: único SaaS no Brasil que combina (a) IA especializada em educação física com guardrails científicos, (b) experiência de execução estilo Reels otimizada para retenção do aluno, (c) integração nativa com Apple Watch e Wear OS no MVP.

---

## 2. Personas e Público-Alvo

### 2.1 Persona P1 — Personal Trainer Autônomo (foco primário)

- **Idade**: 25-45 anos
- **Formação**: CREF ativo, geralmente bacharel em Ed. Física
- **Renda**: R$3.000-R$12.000/mês com 10-30 alunos
- **Dor**: gasta 3-5h/semana montando planilhas no Excel ou aplicativos sem IA, repete exercícios, tem dificuldade em personalizar para muitos alunos
- **Comportamento**: usa Instagram para captar alunos, atende em academia/condomínio/casa do aluno, quer escalar sem perder qualidade
- **Trigger de compra**: indicação de colega ou anúncio mostrando IA gerando treino em 30 segundos

### 2.2 Persona P2 — Aluno (usuário final, não pagante)

- **Idade**: 20-55 anos
- **Perfil**: profissional que treina 3-5x/semana, ou pessoa em retomada de atividade física
- **Dor**: esquece a planilha em casa, não lembra cargas anteriores, perde tempo no celular procurando próximo exercício
- **Comportamento**: usa Instagram/TikTok, quer experiência fluida no celular, possui ou pretende comprar SmartWatch
- **Engajamento**: notificação no horário de treino + UX viciante (Reels) + ver progresso = ficar ativo

### 2.3 Persona P3 — Academia/Box (fase 2, não MVP)

- **Perfil**: academia pequena/média (1-3 unidades) ou box de CrossFit
- **Dor**: quer padronizar treinos da equipe de personais, dar app branded aos alunos
- **Plano**: Elite white-label parcial — fase 2 do produto

---

## 3. Modelo de Negócio e Monetização

### 3.1 Estrutura SaaS B2B

O **personal trainer** é o cliente pagante. O **aluno** acessa gratuitamente via convite do personal.

### 3.2 Planos

| Plano       | Preço      | Alunos    | Gerações IA/mês | Vídeos próprios | Outros                                                 |
| ----------- | ---------- | --------- | --------------- | --------------- | ------------------------------------------------------ |
| **Starter** | R$ 49/mês  | até 10    | 50              | ❌              | Biblioteca curada, suporte por e-mail                  |
| **Pro**     | R$ 99/mês  | até 30    | 200             | ✅              | + Chat ilimitado, suporte priorizado                   |
| **Elite**   | R$ 199/mês | ilimitado | ilimitado\*     | ✅              | + White-label parcial (logo, cores), API de exportação |

\*Soft cap em 1.000/mês para evitar abuso.

### 3.3 Trial e Onboarding

- **14 dias grátis sem cartão de crédito** (apenas e-mail e validação de CREF).
- Onboarding guia: cadastrar perfil → convidar primeiro aluno → criar primeiro treino (com IA) → enviar ao aluno.
- Meta de ativação: personal envia treino para ≥1 aluno em ≤7 dias.

### 3.4 Métricas Projetadas (12 meses)

- 100 personais pagantes ao final do ano 1
- Distribuição esperada: 50% Starter, 45% Pro, 5% Elite
- MRR projetado: 50×49 + 45×99 + 5×199 = R$ 7.890/mês
- Custo de aquisição (CAC) alvo: ≤ R$ 150
- LTV alvo (churn 5%/mês): ~R$ 1.500-2.000

### 3.5 Estratégia de Aquisição

- **Conteúdo orgânico** no Instagram/TikTok mostrando "IA gerando treino em 30s"
- **Indicação**: 1 mês grátis para personal que indica colega que paga
- **Parcerias com cursos de Ed. Física** (acesso gratuito para alunos formandos)
- **CREF Brasil/regionais**: tentar selo de parceiro

---

## 4. Estimativa de Custos Operacionais

Para uma base de **100 personais ativos × 20 alunos médios = 2.000 alunos**:

| Item               | Custo Mensal      | Observação                                  |
| ------------------ | ----------------- | ------------------------------------------- |
| Supabase Pro       | US$ 25            | DB + Auth + Realtime + 100GB storage        |
| Railway (API)      | US$ 20-40         | Auto-scale, 1-2 instâncias                  |
| Vercel             | US$ 0-20          | Gratuito até escala; Pro se passar de hobby |
| Cloudflare R2      | US$ 5-10          | Storage de vídeo (zero egress)              |
| Cloudflare Stream  | US$ 15-25         | Transcoding + reprodução                    |
| OpenAI GPT-4o-mini | US$ 15-50         | Depende de uso real, com prompt caching     |
| Mercado Pago       | 3.99% + R$0,39/tx | Variável por receita                        |
| Expo Push          | US$ 0             | Gratuito ilimitado                          |
| Sentry             | US$ 0-26          | Free tier suficiente no início              |
| PostHog Cloud      | US$ 0-20          | Free tier 1M eventos/mês                    |
| Domínio + SSL      | R$ 5              | Registro.br + Cloudflare SSL grátis         |
| **TOTAL FIXO**     | **~US$ 80-200**   | **= R$ 400-1.000/mês**                      |

**Margem bruta projetada**: ~85-90% no MRR de R$ 7.890.

---

## 5. Roadmap e Sprints

MVP estimado em **22-24 semanas (~5-6 meses)** com solo developer + Claude Code.

### Fase 0 — Fundações (Semanas 1-2)

- [ ] Setup monorepo Turborepo (apps + packages)
- [ ] Configurar TypeScript strict, ESLint, Prettier, Husky
- [ ] CI/CD: GitHub Actions (lint + typecheck + test)
- [ ] Design system inicial: tokens (cores, tipografia, spacing), componentes base
- [ ] Schema Postgres inicial (Drizzle ORM) + migrations
- [ ] Setup Supabase, Railway, Vercel staging
- [ ] Configurar Sentry

### Fase 1 — Núcleo (Semanas 3-10)

**Sprint 1-2 (Auth + Estrutura)** — Semanas 3-6

- [ ] Auth Supabase com Google e Apple OAuth
- [ ] Telas de signup/login no web e mobile
- [ ] Landing page no Next.js (marketing simples)
- [ ] Painel web do personal: dashboard, perfil, lista de alunos
- [ ] Sistema de convite por código/link para aluno
- [ ] Validação de CREF (cadastro manual, validação automática vem depois)

**Sprint 3-4 (Biblioteca + Treino + IA inicial)** — Semanas 7-10

- [ ] Importar/popular biblioteca curada de ~200 exercícios iniciais (Academia, Funcional, Casa)
- [ ] CRUD de exercícios (com upload de vídeo via R2/Stream)
- [ ] Integração YouTube/Vimeo (paste de link, extração de embed)
- [ ] Tela de criação manual de treino (drag-and-drop de exercícios)
- [ ] Integração OpenAI: casos 1 (gerar treino) e 2 (sugerir exercícios)
- [ ] Tabela `ai_usage_log` e rate limiting por plano

### Fase 2 — Aluno e Mobile (Semanas 11-16)

**Sprint 5-6 (App do Aluno)** — Semanas 11-14

- [ ] App React Native (Expo) com autenticação
- [ ] Lista de treinos do aluno
- [ ] Player Reels (vertical, swipe, overlay) — ver seção 11
- [ ] Check-in/check-out de sessão com foto opcional
- [ ] Marcação de séries concluídas, ajuste de carga

**Sprint 7 (SmartWatch básico)** — Semanas 15-16

- [ ] watchOS companion app (Swift, SwiftUI): visualização do treino, timer
- [ ] Wear OS companion app (Kotlin/Compose): visualização + Vibrator
- [ ] Sincronização via Watch Connectivity (iOS) / DataLayer (Android)
- [ ] Timer de descanso com vibração ao final

### Fase 3 — Engajamento e Receita (Semanas 17-22)

**Sprint 8 (Engajamento)** — Semanas 17-18

- [ ] Anamnese: formulário para o personal preencher por aluno (alimenta IA)
- [ ] Tela de progresso do aluno (gráficos: cargas, frequência, peso)
- [ ] Chat personal-aluno via Supabase Realtime
- [ ] Push notifications (Expo Push): lembrete de treino, nova mensagem

**Sprint 9 (Pagamento)** — Semanas 19-20

- [ ] Integração Mercado Pago Checkout Pro
- [ ] Assinaturas recorrentes + webhook handler
- [ ] Tela de planos e billing no painel
- [ ] Lock/unlock de features por plano
- [ ] E-mails transacionais (boas-vindas, falha de pagamento, cancelamento) via Resend ou Postmark

**Sprint 10 (SmartWatch FC + IA avançada)** — Semanas 21-22

- [ ] HealthKit (iOS) e Health Connect (Android) — leitura de FC
- [ ] Tabela `heart_rate_samples` e exibição de gráfico de FC pós-treino
- [ ] IA caso 3: sugerir substituição de exercício
- [ ] IA caso 4: validar/criticar treino criado

### Fase 4 — Beta e Lançamento (Semanas 23-24)

- [ ] Beta fechado: 10-20 personais por 4 semanas (overlap com sprint 10)
- [ ] Coleta de feedback estruturado (NPS + entrevistas)
- [ ] Ajustes de UX e correção de bugs críticos
- [ ] Submissão à App Store e Google Play
- [ ] Lançamento soft: rede de contatos + anúncio Instagram
- [ ] Configuração de suporte: Crisp ou Intercom Lite

### Fora do MVP (Fase 5+)

- Módulos: Natação, Corrida, Laboral
- White-label completo (Persona P3)
- Integração Garmin/Polar/Suunto
- Marketplace de exercícios entre personais
- Programa de afiliados
- Anamnese assinada digitalmente (DocuSign-like)

---

## 6. Arquitetura e Stack Técnica

### 6.1 Diagrama de Alto Nível

```
┌─────────────────────┐    ┌─────────────────────┐    ┌──────────────────────┐
│  App Mobile (Aluno) │    │  App Mobile (Pers.) │    │  Painel Web (Pers.)  │
│  React Native/Expo  │    │  React Native/Expo  │    │  Next.js 15 (App R.) │
│  + Wear OS / watchOS│    │                     │    │                      │
└──────────┬──────────┘    └──────────┬──────────┘    └──────────┬───────────┘
           │                          │                          │
           └──────────────────────────┼──────────────────────────┘
                                      │ HTTPS / WSS
                            ┌─────────▼──────────┐
                            │  API Node.js TS    │
                            │  Fastify + Zod     │  ──► OpenAI GPT-4o-mini
                            │  (Railway)         │  ──► Mercado Pago API
                            │                    │  ──► Cloudflare Stream API
                            └─────────┬──────────┘
                                      │
              ┌───────────────────────┼───────────────────────┐
              │                       │                       │
       ┌──────▼─────┐        ┌────────▼────────┐     ┌────────▼────────┐
       │  Supabase  │        │ Cloudflare R2 + │     │ Expo Push +     │
       │  Postgres  │        │ Stream (vídeos) │     │ FCM/APNs        │
       │  Auth      │        └─────────────────┘     └─────────────────┘
       │  Realtime  │
       │  Storage   │
       └────────────┘
```

### 6.2 Decisões de Stack — Justificativa

| Camada                | Tecnologia                      | Por quê                                                                  |
| --------------------- | ------------------------------- | ------------------------------------------------------------------------ |
| **Mobile**            | React Native 0.74 + Expo SDK 51 | Cross-platform, 1 codebase iOS/Android, Claude Code domina bem           |
| **Navegação mobile**  | expo-router                     | Convenção file-based, deep linking nativo, fácil deep link para treino   |
| **Animação mobile**   | react-native-reanimated 3       | Necessário para Reels player com 60fps                                   |
| **UI mobile**         | Tamagui                         | Performance superior (compila para nativo), tokens compartilhados        |
| **Vídeo mobile**      | expo-video                      | Sucessor moderno do expo-av, suporta HLS do Cloudflare Stream            |
| **Web**               | Next.js 15 + App Router         | SSR, RSC, Vercel deploy, SEO da landing                                  |
| **UI web**            | Tailwind + shadcn/ui + Radix    | Padrão de mercado, customização total, acessibilidade nativa             |
| **State web**         | Zustand + Tanstack Query        | Simples e poderoso, evita Redux boilerplate                              |
| **API**               | Node.js 20 + Fastify            | Mais rápido que Express, plugin system bom, suporte nativo a JSON Schema |
| **Validação**         | Zod                             | Schema único compartilhado entre cliente e servidor                      |
| **ORM**               | Drizzle ORM                     | Type-safe sem code gen pesado, queries SQL-like                          |
| **DB**                | PostgreSQL 15 (Supabase)        | ACID, JSON, RLS nativo, full-text search                                 |
| **Auth**              | Supabase Auth                   | Google/Apple OAuth, magic link, RLS integrado                            |
| **Realtime**          | Supabase Realtime               | Postgres CDC over WebSocket, sem custo extra                             |
| **Storage de vídeo**  | Cloudflare R2 + Stream          | Egress grátis no R2, Stream faz HLS adaptativo                           |
| **Storage de fotos**  | Supabase Storage                | Suficiente para fotos pequenas (perfis, check-ins)                       |
| **IA**                | OpenAI GPT-4o-mini              | US$0,15/1M input — barato e bom o suficiente                             |
| **Pagamento**         | Mercado Pago                    | PIX nativo, mercado BR, suporta recorrência                              |
| **Push**              | Expo Notifications              | Wrapper sobre FCM/APNs, gratuito                                         |
| **Observabilidade**   | Sentry + Logtail                | Error tracking + log search                                              |
| **Analytics produto** | PostHog                         | Eventos, funis, retenção, sessões                                        |
| **CI/CD**             | GitHub Actions                  | Padrão de mercado, fácil integração                                      |
| **Deploy web**        | Vercel                          | SSR otimizado, edge functions                                            |
| **Deploy API**        | Railway                         | Simples, auto-scale, bom DX                                              |

### 6.3 Estrutura de Monorepo

```
athletiqlab/
├── apps/
│   ├── mobile/                   # React Native (Expo) — bundle único aluno + personal
│   │   ├── app/                  # expo-router screens
│   │   │   ├── (auth)/           # login, signup
│   │   │   ├── (personal)/       # área do personal no mobile
│   │   │   └── (student)/        # área do aluno (player Reels, progresso)
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── ios/                  # watchOS companion app
│   │   └── android/              # Wear OS companion app
│   ├── web/                      # Next.js 15
│   │   ├── app/
│   │   │   ├── (marketing)/      # landing, pricing, sobre
│   │   │   ├── (auth)/
│   │   │   └── (dashboard)/      # painel do personal
│   │   └── components/
│   └── api/                      # Fastify
│       ├── src/
│       │   ├── routes/
│       │   ├── plugins/
│       │   ├── services/         # mercadopago, openai, cloudflare
│       │   └── workers/          # jobs assíncronos (transcode poll, e-mails)
│       └── tests/
├── packages/
│   ├── db/                       # Drizzle schema + migrations
│   │   ├── schema/
│   │   ├── migrations/
│   │   └── seed/
│   ├── shared/                   # Tipos, validators Zod, constantes
│   ├── ai/                       # Prompts, clientes OpenAI, schemas de output
│   │   ├── prompts/
│   │   ├── workflows/            # geração de treino, sugestão, etc.
│   │   └── guardrails/
│   └── ui/                       # Componentes compartilhados (apenas tokens — UI específica fica em cada app)
├── .github/workflows/
├── turbo.json
├── package.json
├── pnpm-workspace.yaml
├── PRD.md                        # Este documento
├── CLAUDE.md                     # Instruções para Claude Code
└── README.md
```

### 6.4 Padrões de Código

- **TypeScript strict mode** em todos os pacotes
- **Imports absolutos** com aliases (`@/components`, `@athletiqlab/shared`)
- **Conventional Commits** (feat, fix, chore, refactor)
- **Trunk-based development**: branches curtas, merge em `main` via PR, deploy automático
- **Code review**: solo dev usa Claude Code para revisar PRs antes do merge

---

## 7. Modelo de Dados

Schemas principais em Drizzle ORM. Todas as tabelas têm `id` UUID, `created_at` e `updated_at` (com triggers).

### 7.1 Tabelas Centrais

```typescript
// users — base de autenticação (Supabase Auth gerencia)
users {
  id: uuid (PK, gerado por Supabase Auth)
  email: text (unique, not null)
  role: enum('personal', 'student') not null
  oauth_provider: enum('google', 'apple', 'email')
  locale: text default 'pt-BR'
  consent_lgpd_at: timestamp        // marca consentimento LGPD
  consent_health_data_at: timestamp // consentimento específico dados de saúde
  deleted_at: timestamp             // soft delete para LGPD
}

// personals — dados profissionais do personal trainer
personals {
  user_id: uuid (PK, FK users)
  name: text not null
  cref: text not null (formato XXX.XXX-G/UF)
  cref_verified_at: timestamp
  bio: text
  photo_url: text
  plan: enum('starter', 'pro', 'elite') default 'starter'
  subscription_status: enum('trialing', 'active', 'past_due', 'canceled')
  trial_ends_at: timestamp
  mp_subscription_id: text          // ID da assinatura no Mercado Pago
  brand_color: text                 // white-label Elite
  brand_logo_url: text              // white-label Elite
}

// students — alunos vinculados a personais
students {
  user_id: uuid (PK, FK users)
  personal_id: uuid (FK personals.user_id) not null
  name: text not null
  birth_date: date
  gender: enum('male', 'female', 'other', 'prefer_not_to_say')
  photo_url: text
  invite_code: text unique
  invite_accepted_at: timestamp
  status: enum('invited', 'active', 'paused', 'removed')
}

// anamneses — avaliação inicial (sensível, criptografar)
anamneses {
  id: uuid (PK)
  student_id: uuid (FK students.user_id)
  weight_kg: numeric(5,2)
  height_cm: numeric(5,2)
  body_fat_pct: numeric(4,2)
  goal: enum('hypertrophy', 'weight_loss', 'conditioning', 'rehab', 'general_health')
  experience_level: enum('beginner', 'intermediate', 'advanced')
  weekly_frequency: smallint
  restrictions: text[]              // ex: ['joelho_direito', 'hipertensao_controlada']
  medications: text[]
  medical_notes: text               // criptografado
  signed_at: timestamp              // assinatura digital (futuro)
}

// exercises — biblioteca de exercícios
exercises {
  id: uuid (PK)
  name: text not null
  muscle_group: text[]              // ['peito', 'triceps']
  modality: enum('academia', 'funcional', 'casa', 'natacao', 'corrida', 'laboral')[]
  equipment: text[]                 // ['halter', 'banco']
  level: enum('beginner', 'intermediate', 'advanced')
  description: text
  technique_tips: text
  contraindications: text[]
  video_url: text                   // URL Cloudflare Stream OU YouTube/Vimeo
  video_provider: enum('cloudflare', 'youtube', 'vimeo')
  stream_uid: text                  // ID no Cloudflare Stream se aplicável
  thumbnail_url: text
  source: enum('curated', 'personal', 'external_link')
  owner_id: uuid (FK personals.user_id, NULL se curated)
  is_public: boolean default false  // personal pode tornar exercício compartilhável
}

// workouts — treinos criados
workouts {
  id: uuid (PK)
  personal_id: uuid (FK)
  student_id: uuid (FK, nullable — pode ser template não atribuído)
  title: text not null
  modality: enum(...)
  estimated_duration_min: smallint
  ai_generated: boolean default false
  ai_prompt_snapshot: jsonb         // snapshot do briefing usado na IA
  status: enum('draft', 'published', 'archived')
  published_at: timestamp
}

// workout_exercises — junção com detalhes
workout_exercises {
  id: uuid (PK)
  workout_id: uuid (FK)
  exercise_id: uuid (FK)
  order: smallint not null
  sets: smallint not null
  reps: text not null               // '10-12' ou '30s' (tempo)
  load: text                        // '20kg', 'corporal', 'banda média'
  rest_seconds: smallint
  notes: text                       // observação do personal para o aluno
  tempo: text                       // '2-0-2-0' (excêntrica-pausa-concêntrica-pausa)
}

// workout_sessions — execução pelo aluno (check-in/out)
workout_sessions {
  id: uuid (PK)
  workout_id: uuid (FK)
  student_id: uuid (FK)
  started_at: timestamp not null
  ended_at: timestamp
  start_photo_url: text             // foto opcional check-in
  end_photo_url: text               // foto opcional check-out
  avg_hr_bpm: smallint              // calculado pós-sessão
  max_hr_bpm: smallint
  total_volume_kg: numeric          // soma de sets×reps×load
  rpe: smallint                     // 1-10, esforço percebido (opcional)
  student_notes: text
}

// session_exercise_logs — execução exercício a exercício
session_exercise_logs {
  id: uuid (PK)
  session_id: uuid (FK)
  workout_exercise_id: uuid (FK)
  completed_sets: smallint
  reps_per_set: smallint[]          // ex: [10, 10, 8]
  load_per_set: numeric[]           // ex: [20, 22.5, 22.5]
  skipped: boolean default false
}

// heart_rate_samples — amostras de FC do SmartWatch
heart_rate_samples {
  id: bigserial (PK)
  session_id: uuid (FK)
  timestamp: timestamptz not null
  bpm: smallint not null
}

// progress_entries — medidas e fotos periódicas
progress_entries {
  id: uuid (PK)
  student_id: uuid (FK)
  date: date not null
  weight_kg: numeric(5,2)
  body_measurements: jsonb          // { 'cintura': 80, 'braço_direito': 35, ... }
  photos: jsonb                     // { 'front': url, 'side': url, 'back': url }
  body_fat_pct: numeric(4,2)
}

// chat conversations + messages
conversations {
  id: uuid (PK)
  personal_id: uuid (FK)
  student_id: uuid (FK)
  last_message_at: timestamp
  unique(personal_id, student_id)
}

chat_messages {
  id: uuid (PK)
  conversation_id: uuid (FK)
  sender_id: uuid (FK users)
  content: text
  attachment_url: text
  type: enum('text', 'image', 'audio', 'workout_ref')
  read_at: timestamp
}

// subscriptions — controle de assinatura Mercado Pago
subscriptions {
  id: uuid (PK)
  personal_id: uuid (FK)
  plan: enum('starter', 'pro', 'elite')
  status: enum('pending', 'authorized', 'paused', 'cancelled')
  started_at: timestamp
  current_period_end: timestamp
  mp_subscription_id: text unique
  mp_preapproval_plan_id: text
  cancel_at_period_end: boolean default false
}

// ai_usage_log — tracking de custos e rate limiting
ai_usage_log {
  id: bigserial (PK)
  personal_id: uuid (FK)
  feature: enum('generate_workout', 'suggest_exercises', 'substitute', 'validate')
  model: text                       // 'gpt-4o-mini'
  tokens_input: integer
  tokens_output: integer
  tokens_cached: integer            // tokens cacheados (desconto)
  cost_usd: numeric(8,5)
  latency_ms: integer
  success: boolean
  created_at: timestamp
}

// audit_log — LGPD compliance
audit_log {
  id: bigserial (PK)
  actor_id: uuid (FK users)
  action: text                      // 'read_anamnese', 'export_student_data', etc.
  entity: text
  entity_id: uuid
  ip_address: inet
  user_agent: text
  created_at: timestamp
}

// notification_tokens — Expo Push
notification_tokens {
  user_id: uuid (FK)
  expo_token: text
  platform: enum('ios', 'android')
  last_used_at: timestamp
  unique(user_id, expo_token)
}
```

### 7.2 Row-Level Security (RLS)

Habilitar RLS em todas as tabelas com dados pessoais. Exemplos:

```sql
-- Personal só vê seus alunos
CREATE POLICY "personals_see_own_students" ON students
  FOR SELECT USING (personal_id = auth.uid());

-- Aluno só vê seus próprios dados
CREATE POLICY "student_self_access" ON anamneses
  FOR SELECT USING (
    student_id = auth.uid()
    OR student_id IN (
      SELECT user_id FROM students WHERE personal_id = auth.uid()
    )
  );

-- Workout sessions: aluno e seu personal
CREATE POLICY "session_access" ON workout_sessions
  FOR ALL USING (
    student_id = auth.uid()
    OR student_id IN (
      SELECT user_id FROM students WHERE personal_id = auth.uid()
    )
  );
```

### 7.3 Índices Críticos

```sql
CREATE INDEX idx_students_personal_id ON students(personal_id);
CREATE INDEX idx_workouts_personal_student ON workouts(personal_id, student_id);
CREATE INDEX idx_sessions_student_started ON workout_sessions(student_id, started_at DESC);
CREATE INDEX idx_hr_samples_session_time ON heart_rate_samples(session_id, timestamp);
CREATE INDEX idx_ai_usage_personal_month ON ai_usage_log(personal_id, date_trunc('month', created_at));
CREATE INDEX idx_exercises_search ON exercises USING GIN (to_tsvector('portuguese', name || ' ' || description));
```

---

## 8. APIs e Endpoints Principais

Base URL: `https://api.athletiqlab.com` (Railway). Autenticação: JWT Supabase no header `Authorization: Bearer <token>`.

### 8.1 Autenticação

| Método | Endpoint                       | Descrição                                            |
| ------ | ------------------------------ | ---------------------------------------------------- |
| POST   | `/auth/oauth/callback`         | Recebe callback OAuth do Supabase, completa cadastro |
| POST   | `/auth/personals/onboard`      | Completa perfil do personal pós-OAuth (CREF, bio)    |
| POST   | `/auth/students/accept-invite` | Aluno aceita convite com código                      |

### 8.2 Personal / Alunos

| Método | Endpoint            | Descrição                           |
| ------ | ------------------- | ----------------------------------- |
| GET    | `/personals/me`     | Perfil do personal logado           |
| PATCH  | `/personals/me`     | Atualiza perfil                     |
| GET    | `/students`         | Lista alunos do personal (paginado) |
| POST   | `/students/invites` | Gera código de convite              |
| GET    | `/students/:id`     | Detalhe do aluno                    |
| PATCH  | `/students/:id`     | Atualiza dados do aluno             |
| DELETE | `/students/:id`     | Remove vínculo (LGPD-compliant)     |

### 8.3 Anamnese

| Método | Endpoint                 | Descrição                       |
| ------ | ------------------------ | ------------------------------- |
| GET    | `/students/:id/anamnese` | Última anamnese do aluno        |
| POST   | `/students/:id/anamnese` | Cria nova anamnese (versionada) |

### 8.4 Exercícios

| Método | Endpoint                  | Descrição                                         |
| ------ | ------------------------- | ------------------------------------------------- |
| GET    | `/exercises`              | Busca: `?modality=academia&muscle=peito&q=supino` |
| POST   | `/exercises`              | Personal cria exercício próprio                   |
| POST   | `/exercises/upload-video` | Inicia upload direto ao R2 (signed URL)           |
| POST   | `/exercises/youtube`      | Cria exercício a partir de link YT/Vimeo          |
| PATCH  | `/exercises/:id`          | Atualiza (apenas dono ou admin)                   |
| DELETE | `/exercises/:id`          | Soft delete                                       |

### 8.5 Treinos

| Método | Endpoint                        | Descrição                           |
| ------ | ------------------------------- | ----------------------------------- |
| GET    | `/workouts?student_id=&status=` | Lista treinos                       |
| POST   | `/workouts`                     | Cria treino (manual)                |
| GET    | `/workouts/:id`                 | Detalhe com exercícios              |
| PATCH  | `/workouts/:id`                 | Atualiza                            |
| POST   | `/workouts/:id/publish`         | Publica para o aluno + dispara push |
| POST   | `/workouts/:id/duplicate`       | Duplica como template               |

### 8.6 IA (rate-limited por plano)

| Método | Endpoint                   | Descrição                                 |
| ------ | -------------------------- | ----------------------------------------- |
| POST   | `/ai/workouts/generate`    | Gera treino completo a partir de briefing |
| POST   | `/ai/exercises/suggest`    | Sugere exercícios por grupo/equipamento   |
| POST   | `/ai/exercises/substitute` | Sugere substituição                       |
| POST   | `/ai/workouts/validate`    | Valida e critica treino                   |
| GET    | `/ai/usage`                | Uso do mês corrente vs. limite do plano   |

### 8.7 Sessões (Execução)

| Método | Endpoint                                     | Descrição                              |
| ------ | -------------------------------------------- | -------------------------------------- |
| POST   | `/workout-sessions`                          | Aluno faz check-in (com foto opcional) |
| PATCH  | `/workout-sessions/:id`                      | Atualiza durante execução              |
| PATCH  | `/workout-sessions/:id/end`                  | Check-out final                        |
| POST   | `/workout-sessions/:id/exercises/:we_id/log` | Loga set executado                     |
| POST   | `/workout-sessions/:id/heart-rate`           | Recebe batch de amostras de FC         |

### 8.8 Progresso

| Método | Endpoint                         | Descrição                                    |
| ------ | -------------------------------- | -------------------------------------------- |
| GET    | `/students/:id/progress`         | Séries históricas (volume, frequência, peso) |
| POST   | `/students/:id/progress-entries` | Cria nova medida                             |
| GET    | `/students/:id/progress-entries` | Lista com paginação                          |

### 8.9 Chat

| Método | Endpoint                      | Descrição                                     |
| ------ | ----------------------------- | --------------------------------------------- |
| GET    | `/conversations`              | Lista conversas                               |
| GET    | `/conversations/:id/messages` | Mensagens (paginado)                          |
| POST   | `/conversations/:id/messages` | Envia mensagem (também via Supabase Realtime) |
| PATCH  | `/conversations/:id/read`     | Marca como lida                               |

### 8.10 Assinaturas / Pagamento

| Método | Endpoint                | Descrição                                     |
| ------ | ----------------------- | --------------------------------------------- |
| POST   | `/billing/checkout`     | Cria preapproval no Mercado Pago, retorna URL |
| GET    | `/billing/subscription` | Status atual                                  |
| POST   | `/billing/cancel`       | Cancela ao fim do período                     |
| POST   | `/webhooks/mercadopago` | Webhook handler (validar signature)           |

### 8.11 Push e Sistema

| Método | Endpoint               | Descrição           |
| ------ | ---------------------- | ------------------- |
| POST   | `/push/register-token` | Registra token Expo |
| DELETE | `/push/register-token` | Desregistra         |
| GET    | `/health`              | Healthcheck         |

### 8.12 Padrões de Resposta

Sucesso:

```json
{ "data": { ... } }
```

Erro:

```json
{ "error": { "code": "INVALID_INPUT", "message": "...", "details": {...} } }
```

Códigos: 200, 201, 204, 400, 401, 403, 404, 409, 422, 429 (rate limit), 500.

---

## 9. Estratégia de IA

### 9.1 Modelos

| Caso                  | Modelo padrão | Modelo premium (Elite opt-in) |
| --------------------- | ------------- | ----------------------------- |
| Gerar treino completo | gpt-4o-mini   | gpt-4o                        |
| Sugerir exercícios    | gpt-4o-mini   | gpt-4o-mini                   |
| Substituir exercício  | gpt-4o-mini   | gpt-4o-mini                   |
| Validar treino        | gpt-4o-mini   | gpt-4o                        |

### 9.2 System Prompt Base (todos os casos)

```
Você é um assistente especializado EXCLUSIVAMENTE em educação física,
treinamento desportivo e ciência do exercício.

REGRAS ABSOLUTAS:
1. Recuse educadamente qualquer pergunta fora do domínio de Ed. Física.
   Não responda sobre nutrição clínica, prescrição de medicamentos,
   diagnóstico médico, fisioterapia clínica, política, finanças, etc.
2. Suas respostas seguem princípios de Bompa (periodização), Issurin
   (treinamento em blocos), ACSM (guidelines de prescrição) e SBME.
3. SEMPRE considere: segurança, individualidade biológica, progressão
   gradual, especificidade do estímulo e contraindicações informadas.
4. NUNCA prescreva exercícios contraindicados para as restrições
   informadas pelo personal.
5. Responda SEMPRE em JSON válido conforme o schema fornecido.
   Se não conseguir responder, retorne {"refusal": "...motivo..."}.
6. Você é COPILOTO do personal trainer. Ele revisará e ajustará
   antes de enviar ao aluno final.
```

### 9.3 Caso de Uso 1 — Gerar Treino Completo

**Input** (do briefing preenchido pelo personal):

```json
{
  "student": {
    "age": 32, "gender": "female", "weight_kg": 65, "height_cm": 165,
    "goal": "hypertrophy", "experience_level": "intermediate",
    "weekly_frequency": 4, "session_duration_min": 60,
    "restrictions": ["lombar_sensivel"]
  },
  "preferences": {
    "modality": "academia",
    "equipment_available": ["barra", "halteres", "polia", "smith"],
    "focus_muscles": ["gluteo", "posterior_coxa"]
  },
  "exercise_library_ids": ["uuid1", "uuid2", ...]  // IDs disponíveis na base
}
```

**Output esperado** (validado por Zod):

```json
{
  "title": "Treino A - Inferiores (Glúteo e Posterior)",
  "modality": "academia",
  "estimated_duration_min": 55,
  "exercises": [
    {
      "exercise_id": "uuid_stiff",
      "order": 1,
      "sets": 4,
      "reps": "8-10",
      "load": "moderada-alta",
      "rest_seconds": 90,
      "notes": "Manter coluna neutra; descer até sentir alongamento posterior, não além",
      "rationale": "Stiff prioriza posterior de coxa e glúteo com baixo estresse lombar quando bem executado"
    }
  ],
  "warm_up": [...],
  "cool_down": [...],
  "safety_notes": ["Devido à sensibilidade lombar, exercícios sem compressão axial direta"]
}
```

### 9.4 Guardrails de Output

- Validação **estrita por Zod** após resposta da OpenAI.
- Se output inválido, **uma única tentativa de retry** com instrução de correção.
- Se segundo retry falhar, retornar erro `AI_OUTPUT_INVALID` ao cliente e logar para análise.
- Validação semântica adicional: garantir que todos `exercise_id` existem na biblioteca e estão na lista permitida.
- Detector de contraindicação cruzada: se aluno tem `lombar_sensivel`, marcar agachamento livre com barra como warning (não bloquear, mas avisar o personal).

### 9.5 Prompt Caching e Custos

- OpenAI cobra **50% menos** por tokens cacheados (prompts repetidos).
- Estratégia: o system prompt + biblioteca de exercícios (lista grande de IDs + nomes) é **estável**. Será incluído no início do prompt, beneficiando-se do cache automático (>1024 tokens).
- Custo estimado por geração de treino: ~3.000 tokens input + 1.500 tokens output ≈ US$ 0,0014 (R$ 0,007) por chamada.
- 200 chamadas/mês de um personal Pro = US$ 0,28 = R$ 1,40. Margem confortável.

### 9.6 Rate Limiting

Implementado na API antes da chamada à OpenAI:

- Verifica `ai_usage_log` do mês corrente do personal.
- Se ≥ limite do plano, retorna `429 RATE_LIMIT_EXCEEDED` com mensagem amigável.
- Personal pode fazer upgrade direto na UI ao receber esse erro.

### 9.7 Auditoria e Transparência

- Toda geração de IA é registrada em `ai_usage_log` com tokens, custo, latência, sucesso.
- Treinos com `ai_generated = true` mostram badge "Gerado por IA — revisado por [Personal]" para o aluno, indicando responsabilidade humana.
- Dashboard admin com custo total do mês e top usuários.

---

## 10. Integração com SmartWatches

### 10.1 iOS — Apple Watch

- **Companion app** em **Swift + SwiftUI** dentro do projeto Expo (config plugin para criar target watchOS).
- **Comunicação iPhone↔Watch**: `WatchConnectivity` framework — envia o treino atual para o watch quando o aluno inicia a sessão.
- **HealthKit**: solicitar permissão para ler `HKQuantityTypeIdentifier.heartRate` durante sessão de treino. Tipo de workout: `HKWorkoutActivityType.functionalStrengthTraining`.
- **Funcionalidades watchOS**:
  - Tela 1 (treino ativo): nome do exercício atual, série atual (X de Y), reps e carga
  - Tela 2 (timer descanso): círculo regressivo, vibração Haptic ao final
  - Tela 3 (FC ao vivo): BPM atual e zona (Z1-Z5 baseada em FC máxima estimada)
- **Sincronização de FC**: app no watch envia amostras a cada 5s para o iPhone via `WCSession.transferUserInfo`, que persiste localmente e envia em batch para a API ao final.

### 10.2 Android — Wear OS

- **Companion app** em **Kotlin + Jetpack Compose for Wear OS** dentro do projeto Expo (config plugin).
- **Comunicação phone↔watch**: `DataLayer API` (`MessageClient`, `DataClient`).
- **Health Connect**: ler `HeartRateRecord`. Requer permissão `android.permission.health.READ_HEART_RATE`.
- **Funcionalidades** análogas ao watchOS, com `Vibrator` API para feedback de fim de descanso.
- **Sincronização** análoga: amostras enviadas para o telefone via DataLayer, que repassa em batch à API.

### 10.3 Modelo de Dados de FC

```sql
heart_rate_samples (
  session_id uuid,
  timestamp timestamptz,
  bpm smallint
)
```

Inserção em batch (até 200 amostras por request) no endpoint `POST /workout-sessions/:id/heart-rate`.

### 10.4 Cálculos Pós-Sessão (Background Job)

Ao chamar `PATCH /workout-sessions/:id/end`, dispara job:

- `avg_hr_bpm = AVG(bpm)` durante sessão
- `max_hr_bpm = MAX(bpm)`
- Distribuição por zona (% tempo em Z1-Z5)
- Estimativa de calorias (fórmula Keytel, 2005, usando peso, idade, gênero, FC média, duração)

### 10.5 Fora do MVP

- Garmin Connect IQ (fase 2 — muitos triatletas usam)
- Polar API (fase 2)
- ANT+ direto (fase 3, complexo)

---

## 11. Player de Treino Estilo Reels (UX)

### 11.1 Princípios de Design

- **Tela vertical 9:16** full-screen, sem barras
- **Auto-play em loop** (sem som por padrão, com botão para áudio)
- **Texto sobre o vídeo** com gradient sutil para legibilidade
- **Swipe up** = próximo exercício, **swipe down** = anterior
- **Tap central** = play/pause; **double tap** = "concluir série"
- Tudo deve ser operável **com mão suada**, em pé na academia

### 11.2 Layout da Tela

```
┌────────────────────────────────┐
│                                │
│                                │
│      [vídeo em loop]           │
│      do exercício              │
│                                │
│                                │
│  ●●●○○  (indicador 3/5 series) │  ← topo
│                                │
│         [play/pause]            │
│                                │
│  ┌─────────────────────────┐   │
│  │ Supino reto com halter  │   │  ← overlay
│  │ 4x10 · 22kg · 90s desc. │   │
│  │ "Mantenha escápulas..."  │   │
│  └─────────────────────────┘   │
│  [✓ Concluir série] [Pular]    │
└────────────────────────────────┘
```

### 11.3 Estados do Player

1. **Pré-execução**: tela de início "Iniciar treino" + foto opcional check-in
2. **Em exercício**: vídeo + overlay + controles
3. **Descanso**: tela escurecida com timer circular grande + dica do próximo exercício
4. **Pós-exercício**: confirmação rápida (carga executada, reps reais)
5. **Final**: resumo (duração, volume total, FC média) + foto opcional check-out + envia para personal

### 11.4 Implementação Técnica

```typescript
// pseudocódigo
<FlatList
  data={exercises}
  pagingEnabled
  snapToInterval={SCREEN_HEIGHT}
  horizontal={false}
  showsVerticalScrollIndicator={false}
  renderItem={({ item, index }) => (
    <ExercisePage
      exercise={item}
      isActive={currentIndex === index}
    />
  )}
  onViewableItemsChanged={({ viewableItems }) => {
    setCurrentIndex(viewableItems[0].index);
  }}
/>
```

`ExercisePage` usa `expo-video` para o player, com `shouldPlay={isActive}` para pausar quando fora de viewport. Overlay com `react-native-reanimated` para gestos e animações suaves.

### 11.5 Performance

- Pré-carregar próximo vídeo enquanto reproduz o atual (HLS adaptativo do Cloudflare Stream cuida de bitrate)
- Thumbnails em baixa resolução geradas pelo Stream para lista
- Lazy-load de exercícios pulados (não baixar vídeo se aluno pulou)

### 11.6 Acessibilidade

- Labels para screen readers
- Botões com tamanho mínimo 48dp
- Contraste AA (texto sobre vídeo via gradient)
- Modo "sem vídeo" (apenas instruções textuais) — para alunos com conexão ruim ou preferência

---

## 12. Segurança e Conformidade LGPD

### 12.1 Princípios

Tratamos dados de saúde (anamnese, FC, peso, fotos) como **dados sensíveis** sob a LGPD (Lei 13.709/2018, art. 5º, II). Toda a arquitetura é desenhada com isso em mente.

### 12.2 Coleta e Consentimento

- **Consentimento explícito e granular** no primeiro acesso do aluno:
  - Aceito Termos de Uso (obrigatório)
  - Aceito Política de Privacidade (obrigatório)
  - Aceito coleta de dados de saúde para fins de prescrição de exercício (obrigatório)
  - Aceito uso de IA para personalização (opcional, mas necessário para acessar features de IA)
- Campos `consent_lgpd_at` e `consent_health_data_at` armazenam timestamp + versão do termo.

### 12.3 Armazenamento

- **Em trânsito**: TLS 1.3 obrigatório (HSTS habilitado)
- **Em repouso**: campos sensíveis (`medical_notes`, `restrictions`, `medications`) criptografados com `pgcrypto` (chave gerenciada via Supabase Vault / KMS)
- **Fotos**: armazenadas com URLs assinadas e curta expiração (1h)
- **Backups**: Supabase faz backup diário com retenção de 30 dias

### 12.4 Acesso

- **JWT**: tokens de 15min + refresh rotativo de 7 dias
- **RLS** em todas as tabelas com PII
- **Princípio do menor privilégio**: API usa role específica `app_service_role` com permissões mínimas
- **Auditoria**: tabela `audit_log` registra cada leitura de anamnese, exportação de dados, alteração de dados de aluno

### 12.5 Direitos do Titular (LGPD art. 18)

Implementar endpoints e UI para:

- **Acesso**: aluno pode baixar todos os seus dados em JSON (`GET /me/data-export`)
- **Correção**: aluno edita seus próprios dados de perfil/anamnese
- **Anonimização/exclusão**: `DELETE /me/account` agenda exclusão em 30 dias (período de retratação)
- **Portabilidade**: export em formato JSON estruturado
- **Revogação de consentimento**: opt-out de IA, opt-out de dados não essenciais

### 12.6 Encarregado (DPO)

- O fundador é o **Encarregado de Tratamento de Dados** no MVP.
- E-mail dedicado: `dpo@athletiqlab.com`
- Política de Privacidade publicada na landing com nome e contato do DPO.

### 12.7 Incidentes

- Plano de resposta: detecção (Sentry alerts) → contenção → notificação ANPD em 72h se houver risco a titulares.
- Logs imutáveis no Logtail por 12 meses.

### 12.8 Termos e Política

- Revisão por advogado especializado em LGPD **antes do lançamento público** (não no MVP de beta fechado).
- Versionamento dos termos com aceite re-solicitado em mudanças materiais.

### 12.9 Conformidade Adicional

- **CFM / CREF**: aplicação não substitui consulta médica nem prescrição. Texto disclaimer obrigatório em pontos-chave (anamnese, geração de IA, primeiro acesso).
- **Marketplace? Não**. Como o personal é o profissional CREF responsável e o aluno é convidado dele, o app é ferramenta profissional — não exerce prescrição direta.

---

## 13. Verificação, Testes e Lançamento

### 13.1 Estratégia de Testes

| Tipo                | Ferramenta         | Cobertura alvo                                                                         |
| ------------------- | ------------------ | -------------------------------------------------------------------------------------- |
| Unitário            | Vitest             | Lógica de domínio (cálculo de progressão, validação de treino, parser de carga) — 80%+ |
| Integração API      | Vitest + Supertest | Endpoints críticos (auth, criação de treino, IA, webhooks MP)                          |
| E2E Web             | Playwright         | Fluxos: signup → convidar aluno → criar treino → publicar                              |
| E2E Mobile          | Maestro            | Fluxos: login aluno → executar treino → check-in/out                                   |
| Manual exploratório | —                  | Cada release, foco em UX                                                               |

### 13.2 CI/CD

```
GitHub Actions:
  on push:
    - lint (eslint + prettier check)
    - typecheck (tsc --noEmit em todos pacotes)
    - test (vitest)
    - build (turbo build)
  on PR merge to main:
    - deploy web → Vercel preview → production
    - deploy api → Railway staging → production (após smoke test)
  on tag v*:
    - build mobile (EAS Build) → submit App Store + Play Store
```

### 13.3 Ambientes

- **dev local**: Supabase local (Docker), .env.local
- **staging**: Supabase staging project, Railway staging, Vercel preview
- **production**: Supabase prod, Railway prod, Vercel prod

### 13.4 Beta Fechado

- Recrutar 10-20 personais de rede de contatos
- Duração: 4 semanas (sobrepondo Sprint 10)
- Coleta: Crisp para feedback + entrevistas semanais de 15min
- Métricas: ativação, retenção D7/D14, NPS, # bugs reportados

### 13.5 Métricas de Sucesso do MVP

| Métrica                                        | Meta       |
| ---------------------------------------------- | ---------- |
| Taxa de ativação do personal (envia ≥1 treino) | ≥ 70%      |
| Retenção D30 do personal                       | ≥ 60%      |
| Taxa de execução de treino pelo aluno (D7)     | ≥ 50%      |
| NPS personal                                   | ≥ 40       |
| Churn mensal                                   | < 8%       |
| Custo IA por personal/mês                      | < US$ 0,50 |
| Tempo médio de criação de treino com IA        | < 3 min    |
| Crash-free rate (mobile)                       | ≥ 99,5%    |

### 13.6 Lançamento Soft

- Anúncio em rede pessoal + 1 post no Instagram
- Sem ads pagos no primeiro mês — foco em qualidade do produto e feedback
- Programa de indicação ativo desde o D1

---

## 14. Diretório do Projeto e Convenções

### 14.1 Setup Inicial Recomendado (Sprint 0)

```bash
# Na raiz do projeto
pnpm dlx create-turbo@latest .
# Configurar workspaces para apps/* e packages/*

# Apps
cd apps && npx create-expo-app@latest mobile --template
cd apps && npx create-next-app@latest web --typescript --tailwind --app
cd apps && pnpm create fastify api

# Packages
mkdir packages/{db,shared,ai,ui}

# DB
cd packages/db && pnpm add drizzle-orm drizzle-kit pg
```

### 14.2 Variáveis de Ambiente Esperadas

```bash
# Supabase
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=

# OpenAI
OPENAI_API_KEY=
OPENAI_MODEL_DEFAULT=gpt-4o-mini
OPENAI_MODEL_PREMIUM=gpt-4o

# Mercado Pago
MP_ACCESS_TOKEN=
MP_WEBHOOK_SECRET=

# Cloudflare
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_R2_ACCESS_KEY=
CLOUDFLARE_R2_SECRET_KEY=
CLOUDFLARE_R2_BUCKET=athletiqlab-videos
CLOUDFLARE_STREAM_TOKEN=

# App
APP_URL=https://app.athletiqlab.com
API_URL=https://api.athletiqlab.com
NODE_ENV=production

# Observability
SENTRY_DSN=
LOGTAIL_TOKEN=
POSTHOG_KEY=
```

### 14.3 Convenções

- **Branches**: `main` (production), `develop` (staging), `feature/<scope>-<descrição>`, `fix/<scope>-<descrição>`
- **Commits**: Conventional Commits (`feat(ai): add workout generation endpoint`)
- **PRs**: template obrigatório com checklist (test, types, lint, screenshot se UI)
- **Releases**: SemVer; tags `v1.0.0`, changelog gerado por release-please ou manual
- **Code style**: Prettier + ESLint padrão Airbnb adaptado, executados via Husky pre-commit
- **Documentação**: cada pacote tem seu README; APIs documentadas com OpenAPI (gerado do Fastify schemas)

### 14.4 Próximos Passos Imediatos para Claude Code

Quando este PRD for consumido por uma nova sessão de Claude Code:

1. **Validar PRD** com o usuário — confirmar que nada mudou desde a aprovação
2. **Sprint 0 — Setup do monorepo**:
   - Criar estrutura `apps/` e `packages/`
   - Configurar Turborepo, pnpm workspaces, TypeScript strict
   - Configurar ESLint, Prettier, Husky
   - Criar `packages/db` com schema inicial Drizzle (referenciar seção 7)
   - Criar `packages/shared` com tipos e validators Zod
   - Configurar GitHub Actions básico (lint + typecheck)
3. **Sprint 1 — Auth e estrutura base**:
   - Configurar projeto Supabase (DB + Auth)
   - Implementar OAuth Google + Apple
   - Criar painel web com layout base
4. **Iterar conforme roadmap** da seção 5

Cada sprint deve ser quebrado em tasks granulares via TaskCreate antes da execução.

---

## Apêndice A — Glossário

- **Personal / Personal trainer**: profissional CREF que cria os treinos (cliente pagante).
- **Aluno**: usuário final do app que executa os treinos (não pagante).
- **Anamnese**: avaliação inicial de saúde, objetivos e restrições do aluno.
- **CREF**: Conselho Regional de Educação Física, registro obrigatório dos profissionais.
- **RLS**: Row-Level Security do Postgres, isola dados por tenant/usuário.
- **HLS**: HTTP Live Streaming, formato de vídeo adaptativo usado pelo Cloudflare Stream.
- **RPE**: Rate of Perceived Exertion (1-10), métrica subjetiva de esforço.
- **Zona de FC**: faixas de frequência cardíaca usadas para prescrição (Z1 recuperação a Z5 máximo).

## Apêndice B — Referências Técnicas

- Expo: https://docs.expo.dev
- Next.js: https://nextjs.org/docs
- Fastify: https://fastify.dev
- Drizzle ORM: https://orm.drizzle.team
- Supabase: https://supabase.com/docs
- Cloudflare Stream: https://developers.cloudflare.com/stream
- OpenAI API: https://platform.openai.com/docs
- Mercado Pago Subscriptions: https://www.mercadopago.com.br/developers/pt/docs/subscriptions/landing
- LGPD: http://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/L13709.htm
- ACSM Guidelines: https://www.acsm.org/education-resources/books/guidelines-exercise-testing-prescription

---

**Fim do PRD v1.0.**
