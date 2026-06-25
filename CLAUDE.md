# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> Source of truth for product and technical decisions: `PRD.md`. Update CLAUDE.md only for dev-workflow guidance.

## O que é o projeto

SaaS B2B para profissionais de Ed. Física e saúde física (personal trainers CREF, fisioterapeutas CREFITO, treinadores esportivos, professores de ginástica etc.) criarem treinos personalizados em **conversa com IA** e disponibilizarem para clientes via app mobile estilo Reels, com integração SmartWatch. Solo developer + Claude Code. Idioma do projeto: **português brasileiro** (código em inglês, mensagens/UI em pt-BR).

## Arquitetura

Monorepo Turborepo com `apps/{mobile,web,api}` e `packages/{db,shared,ai,ui}`:

- `apps/mobile` — React Native (Expo SDK 52) com expo-router 4; targets watchOS (Swift/SwiftUI) e Wear OS (Kotlin/Compose)
- `apps/web` — Next.js 15 App Router; painel web do personal (Tailwind + shadcn/ui)
- `apps/api` — Fastify + Zod; autenticação via JWT Supabase; serve todos os clientes
- `packages/db` — Drizzle ORM schema + migrations; único lugar de definição das tabelas
- `packages/shared` — tipos TypeScript + validators Zod + constantes (`PLAN_LIMITS`) compartilhados
- `packages/ai` — toda integração com OpenAI; prompts, workflows, guardrails — **nunca chamar OpenAI fora daqui**
- `packages/ui` — tokens de design compartilhados

Serviços externos: Supabase (Postgres + Auth + Realtime + Storage), Cloudflare R2/Stream (vídeo), OpenAI gpt-4o-mini, Mercado Pago (assinaturas), Expo Push.

## Comandos

```bash
pnpm install
docker compose up -d        # Supabase local
pnpm db:migrate             # aplica migrations Drizzle
pnpm db:seed                # popula biblioteca de exercícios
pnpm dev                    # todos os apps em paralelo (Turbo)

pnpm build                  # build de produção
pnpm lint                   # ESLint + Prettier check
pnpm typecheck              # tsc --noEmit em todos os pacotes
pnpm test                   # Vitest (todos os pacotes)
pnpm test --filter=api      # testes apenas no app/pacote api

pnpm db:generate            # gera migration a partir do schema Drizzle
pnpm db:studio              # abre Drizzle Studio

# Rodar um único arquivo de teste:
pnpm --filter=<package> exec vitest run src/path/to/test.spec.ts
```

Testes: **Vitest** para unitário e integração de API; **Playwright** para E2E web; **Maestro** para E2E mobile.

## Estado atual — Sprints 1–14 concluídos (MVP completo)

O que está implementado:

- Auth (Supabase, Google OAuth + magic link), onboarding do profissional, middleware de rotas
- Dashboard web: lista de alunos, lista/detalhe/criação de treinos, configurações, billing
- API Fastify: rotas `/auth`, `/personals`, `/students`, `/exercises`, `/workouts`, `/ai/workout-chat`, `/workout-sessions`, `/progress`, `/conversations`, `/notifications`, `/billing`, `/webhooks`, `/feedback`
- AI single-shot: generate, suggest-exercises, substitute, validate — tudo em `packages/ai`
- AI multi-turn: chat conversacional para criação de treino (`/ai/workout-chat`) com estado persistido
- AI web: botão "Validar com IA" e "Substituir" inline no detalhe do treino
- App mobile (Expo SDK 52): auth Google, lista de treinos, player Reels, check-in/out de sessão, set logger, rest timer
- SmartWatch: watchOS companion app (Swift/SwiftUI), Wear OS companion app (Kotlin/Compose), WatchConnectivity bridge
- Health Connect (Android): leitura de FC pós-sessão + gráfico SVG
- Progresso: gráfico de barras semanal (frequência + volume) + histórico de sessões
- Chat profissional–cliente via Supabase Realtime (web + mobile) + push notifications (Expo Push)
- Billing: Mercado Pago Checkout Pro, assinaturas recorrentes, webhook handler, tela de planos
- Plan gating: `PLAN_LIMITS` + check em upload de vídeo (402 se plano insuficiente)
- NPS: widget mobile pós-sessão + `POST /feedback/nps` + tabela `nps_responses`
- Analytics: PostHog (web via `posthog-js`; mobile via fetch direto)
- Suporte: Crisp chat widget no dashboard web com user context pré-preenchido
- SEO/OG: metadata completo, `robots.txt`, `sitemap.xml`
- EAS Build: `eas.json` + GitHub Actions release workflow para App Store + Play Store
- E-mails transacionais: boas-vindas (onboarding), falha de pagamento (webhook `paused`) e cancelamento (webhook `cancelled`) via Resend em `apps/api/src/lib/email.ts`
- Schema Drizzle completo + migrations com RLS (4 migrations)

**Atenção — divergência de nomenclatura:** O PRD v1.1 renomeou `personals`→`professionals` e `students`→`clients`, mas o código ainda usa os nomes antigos (`personals`, `students`). Ao tocar código existente, usar os nomes do código; ao criar tabelas/rotas novas, usar os nomes do PRD v1.1. Sincronizar em refactor dedicado.

## Arquitetura do API (Fastify)

```
apps/api/src/
├── index.ts          # entry: PORT 3001, HOST 0.0.0.0, carrega .env.local
├── app.ts            # buildApp(): CORS, rate-limit 100req/min, plugins, rotas
├── lib/
│   └── push.ts       # sendPushToUser(): envia Expo push notification
├── plugins/
│   ├── auth.ts       # decorates fastify.authenticate + request.userId/userRole
│   └── supabase.ts   # lazy-init supabase admin e user clients
└── routes/
    ├── auth.ts        # /auth/personals/onboard
    ├── personals.ts   # /personals (GET/PATCH)
    ├── students.ts    # /students (CRUD + invites + /invites/accept)
    ├── exercises.ts   # /exercises (busca + upload-video com plan check 402)
    ├── workouts.ts    # /workouts (CRUD + /validate + /suggest-exercises + substitute)
    ├── sessions.ts    # /workout-sessions (check-in/out + exercise log + heart-rate)
    ├── progress.ts    # /progress/summary + /progress/sessions/:id
    ├── conversations.ts # /conversations (chat profissional-cliente + Realtime)
    ├── notifications.ts # /notifications/push-token (registro Expo)
    ├── billing.ts     # /billing/subscription + /checkout + /cancel
    ├── webhooks.ts    # /webhooks/mercadopago (HMAC-SHA256 + status sync)
    ├── feedback.ts    # /feedback/nps (NPS score 0-10)
    └── ai-chat.ts     # /ai/workout-chat (start, message, authorize, discard, refine)
```

Todas as rotas usam `preHandler: [fastify.authenticate]`. Adicionar nova rota: registrar em `app.ts`.

## Padrões de API

Respostas de sucesso: `{ "data": { ... } }`. Erros: `{ "error": { "code": "...", "message": "...", "details": {...} } }`. Códigos: 200, 201, 204, 400, 401, 403, 404, 409, 422, 429, 500.

## Schema do banco (Drizzle)

```
packages/db/src/schema/
├── users.ts          # users + enums userRoleEnum, oauthProviderEnum
├── personals.ts      # personals + personalInvites
├── students.ts       # students
├── exercises.ts      # exercises + enums
├── workouts.ts       # workouts + workoutExercises
├── ai-usage.ts       # aiUsageLog
├── ai-chat.ts        # workoutCreationConversations + aiChatMessages (multi-turn)
├── sessions.ts       # workoutSessions + sessionExerciseLogs + heartRateSamples
├── progress.ts       # progressEntries
├── chat.ts           # conversations + chatMessages (profissional-cliente)
├── notifications.ts  # notificationTokens
├── subscriptions.ts  # subscriptions
├── feedback.ts       # npsResponses
└── ...               # anamneses, audit
```

Migrations: `0000_great_kid_colt` → `0001_rls_and_triggers` → `0002_ai_chat_conversations` → `0003_nps_responses`.

- `modality` em `exercises` é `text[]` (JSONB) — campo aberto, não enum.
- `workouts.aiGenerated` (bool) + `aiPromptSnapshot` (JSONB) rastreiam origem da IA.
- `workoutCreationConversations.status`: `in_progress` | `awaiting_authorization` | `authorized` | `discarded`.
- `workoutCreationConversations.proposedWorkout` (JSONB): snapshot do treino proposto antes de autorizar.
- Toda nova tabela com `personalId` ou `studentId` precisa de RLS na migration.

## Arquitetura de IA (packages/ai)

```
packages/ai/src/
├── client.ts                            # lazy OpenAI init; getOpenAIClient()
├── prompts/system.ts                    # SYSTEM_PROMPT (base fixo) + buildChatSystemPrompt(params) (dinâmico)
├── guardrails/
│   ├── validate-output.ts               # callWithValidation(): rate-limit de chamada + retry + log
│   ├── call-chat-turn.ts                # callChatTurn(): para cada turno do chat; loga em aiUsageLog
│   └── check-chat-rate-limit.ts         # checkChatRateLimit(): rate-limit por conversa (não por chamada)
└── workflows/
    ├── chat-workout-creation.ts         # startConversation(), continueConversation(), proposeWorkout()
    ├── generate-workout.ts
    ├── suggest-exercises.ts
    ├── substitute-exercise.ts
    └── validate-workout.ts
```

**Dois sistemas de rate-limit distintos:**

- `callWithValidation()` — conta chamadas individuais à OpenAI por mês (single-shot workflows)
- `checkChatRateLimit()` — conta conversas `authorized` ou `discarded` por mês (chat workflow)

`callWithValidation()` em `guardrails/validate-output.ts` é o ponto de chamada para workflows single-shot:

1. Verifica rate limit (conta chamadas no mês via `aiUsageLog`)
2. Chama OpenAI com `response_format: { type: "json_object" }`
3. Valida output com Zod; se inválido, 1 retry com hint de correção
4. Loga tokens, custo e latência em `aiUsageLog`
5. Lança `AiRateLimitError` ou `AiOutputInvalidError` em caso de falha

Todos os schemas de output da IA ficam em `packages/shared/src/validators/ai.ts`.

## Regras de IA

1. Toda chamada à OpenAI passa por `packages/ai` — nunca chamar diretamente do front ou da api.
2. `SYSTEM_PROMPT` em `packages/ai/src/prompts/system.ts` é fixo — não modificar sem revisão. O `buildChatSystemPrompt(params)` o estende dinamicamente com a biblioteca de exercícios e tipo de profissional.
3. Criação de treino via chat é **multi-turn**: estado em `workoutCreationConversations` + `aiChatMessages`. Treino só entra em `workouts` após `POST /ai/workout-chat/:id/authorize`.
4. **Sentinelas do chat**: a IA emite `[READY_TO_PROPOSE]` quando tem informação suficiente para propor; e `<!--QR:[...]-->` no final de mensagens para quick-replies sugeridos.
5. Output validado com Zod. Se inválido: 1 retry; se falhar, erro `AI_OUTPUT_INVALID`.
6. Toda chamada à OpenAI registra em `ai_usage_log` com `conversation_id` quando aplicável.
7. Rate limit por plano: `PLAN_LIMITS` em `packages/shared/src/constants/plans.ts`.

## Arquitetura web (Next.js)

```
apps/web/src/
├── middleware.ts      # redireciona /dashboard→/login se não autenticado; /onboarding→/dashboard se já onboardado
├── lib/
│   ├── posthog.ts     # initPostHog(), trackEvent(), trackPageView()
│   └── api.ts         # apiFetch helper tipado
├── components/
│   ├── posthog-provider.tsx  # pageview automático via usePathname
│   └── crisp-chat.tsx        # widget Crisp com user context
└── app/
    ├── layout.tsx     # OG/Twitter metadata + PostHogProvider
    ├── (auth)/        # /login, /onboarding, /callback
    ├── (dashboard)/
    │   ├── layout.tsx # Sidebar + CrispChat
    │   └── dashboard/
    │       ├── students/      # lista + detalhe (com chat-section)
    │       ├── workouts/
    │       │   ├── chat/      # /dashboard/workouts/chat (UI de criação via chat)
    │       │   ├── new/
    │       │   └── [id]/      # detalhe + AiValidate + AiSubstituteButton
    │       ├── billing/       # tela de planos + PlanCards client component
    │       └── settings/
    └── (marketing)/   # landing page
```

Auth via `@supabase/ssr` (SSR-safe). State management: Zustand + TanStack Query. Forms: react-hook-form + Zod.

## Convenções críticas

- **TypeScript strict** em todos os pacotes. Sem `any`.
- **Zod em todas as fronteiras**: input de API, output de API, output da IA.
- **Drizzle ORM** para schema/queries — SQL cru apenas em migrations específicas (RLS, índices GIN).
- **RLS obrigatório** em toda tabela com `professional_id` ou `client_id`. Toda nova tabela precisa de policy criada na migration.
- **Conventional Commits**: `feat(scope):`, `fix(scope):`, `chore:`, `refactor:`.
- **i18n preparado**: strings de UI passam por `t()` mesmo no MVP.

## Domínio — vocabulário

- `professional` (PRD v1.1) / `personal` (código atual) — profissional pagante. Conselhos: CREF, CREFITO, CRM, CRN, OUTRO.
- `client` (PRD v1.1) / `student` (código atual) — cliente final (aluno/paciente). UI usa "aluno" ou "paciente" conforme modalidade.
- `workout` — treino (template ou atribuído). `created_via`: `'manual'` ou `'ai_chat'`.
- `workout_creation_conversation` — conversa multi-turn com IA até autorização do profissional.
- `session` — execução de um treino pelo cliente (check-in/out).
- `anamnese` — avaliação inicial **opcional**. NÃO bloqueia criação de treino. Campos sensíveis criptografados com pgcrypto.
- `modality` — campo aberto (text), com autocomplete via `modalities_catalog`. NÃO usar enum fechado.

## LGPD — não-negociáveis

- Campos `medical_notes`, `medications`, `restrictions` em `anamneses` criptografados com `pgcrypto`.
- Toda leitura de anamnese loga em `audit_log`.
- `DELETE /me/account` agenda exclusão em 30 dias (soft delete via `deleted_at`), não apaga imediatamente.
- URLs de fotos com expiração curta (1h) via URLs assinadas.

## Branches e PRs

- Branches: `feature/<scope>-<descrição>`, `fix/<scope>-<descrição>`
- PR sempre com: problema → solução → como testar
- Pre-commit roda lint + typecheck via Husky — **nunca pular com `--no-verify`**
- CI precisa estar verde para merge

## Variáveis de ambiente esperadas

```bash
# Supabase / DB
SUPABASE_URL=, SUPABASE_ANON_KEY=, SUPABASE_SERVICE_ROLE_KEY=, DATABASE_URL=

# OpenAI
OPENAI_API_KEY=, OPENAI_MODEL_DEFAULT=gpt-4o-mini, OPENAI_MODEL_PREMIUM=gpt-4o

# Mercado Pago
MP_ACCESS_TOKEN=, MP_WEBHOOK_SECRET=

# Cloudflare
CLOUDFLARE_ACCOUNT_ID=, CLOUDFLARE_R2_ACCESS_KEY=, CLOUDFLARE_R2_SECRET_KEY=
CLOUDFLARE_R2_BUCKET=athletiqlab-videos, CLOUDFLARE_STREAM_TOKEN=

# App
APP_URL=, API_URL=, SENTRY_DSN=, LOGTAIL_TOKEN=

# E-mail (Resend)
RESEND_API_KEY=, RESEND_FROM_EMAIL=AthletiQLab <no-reply@athletiqlab.com>

# Analytics / Suporte (web: NEXT_PUBLIC_*, mobile: EXPO_PUBLIC_*)
NEXT_PUBLIC_POSTHOG_KEY=, NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
NEXT_PUBLIC_CRISP_WEBSITE_ID=
EXPO_PUBLIC_POSTHOG_KEY=, EXPO_PUBLIC_POSTHOG_HOST=https://app.posthog.com
EXPO_PUBLIC_APP_VERSION=1.0.0

# EAS / GitHub Actions secrets (não entram no .env, só em CI)
# EXPO_TOKEN, APPLE_ID, ASC_APP_ID, APPLE_TEAM_ID, GOOGLE_SERVICE_ACCOUNT_KEY_PATH
```

## O que NÃO fazer

- Não criar `.md` adicionais sem pedido explícito
- Não adicionar features fora do roadmap sem alinhar com o usuário
- Não pular validações LGPD "por ser MVP"
- Não criar tabela com PII sem RLS
- Não chamar OpenAI fora de `packages/ai`
- Não commitar `.env*`
- Não usar enum fechado para `modality` — sempre `text` ou `text[]`
