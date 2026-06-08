# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> Source of truth for product and technical decisions: `PRD.md`. Update CLAUDE.md only for dev-workflow guidance.

## O que é o projeto

SaaS B2B para profissionais de Ed. Física e saúde física (personal trainers CREF, fisioterapeutas CREFITO, treinadores esportivos, professores de ginástica etc.) criarem treinos personalizados em **conversa com IA** e disponibilizarem para clientes via app mobile estilo Reels, com integração SmartWatch. Solo developer + Claude Code. Idioma do projeto: **português brasileiro** (código em inglês, mensagens/UI em pt-BR).

## Arquitetura

Monorepo Turborepo com `apps/{mobile,web,api}` e `packages/{db,shared,ai,ui}`:

- `apps/mobile` — React Native (Expo SDK 51) com expo-router; targets watchOS (Swift/SwiftUI) e Wear OS (Kotlin/Compose)
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

## Estado atual — Sprints 1–4 concluídos

O que está implementado:

- Auth (Supabase, Google OAuth + magic link), onboarding do profissional, middleware de rotas
- Dashboard web: lista de alunos, lista/detalhe/criação de treinos, configurações
- API Fastify: rotas `/auth`, `/personals`, `/students`, `/exercises`, `/workouts`
- AI (single-shot): generate, suggest-exercises, substitute, validate — tudo em `packages/ai`
- Schema Drizzle completo + migrations com RLS

**Atenção — divergência de nomenclatura:** O PRD v1.1 renomeou `personals`→`professionals` e `students`→`clients`, mas o código ainda usa os nomes antigos (`personals`, `students`). Ao tocar código existente, usar os nomes do código; ao criar tabelas/rotas novas, usar os nomes do PRD v1.1. Sincronizar em refactor dedicado.

Próximos sprints: chat multi-turn com IA, app mobile, SmartWatch, billing (Mercado Pago), sessões de treino.

## Arquitetura do API (Fastify)

```
apps/api/src/
├── index.ts          # entry: PORT 3001, HOST 0.0.0.0, carrega .env.local
├── app.ts            # buildApp(): CORS, rate-limit 100req/min, plugins, rotas
├── plugins/
│   ├── auth.ts       # decorates fastify.authenticate + request.userId/userRole
│   └── supabase.ts   # lazy-init supabase admin e user clients
└── routes/
    ├── auth.ts        # /auth/personals/onboard
    ├── personals.ts   # /personals (GET/PATCH)
    ├── students.ts    # /students (CRUD + invites)
    ├── exercises.ts   # /exercises (busca com filtros)
    └── workouts.ts    # /workouts (CRUD + /generate + /validate + /suggest-exercises + /:id/exercises/:id/substitute)
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
└── ...               # anamneses, chat, progress, sessions, subscriptions, audit, notifications
```

- `modality` em `exercises` é `text[]` (JSONB) — campo aberto, não enum.
- `workouts.aiGenerated` (bool) + `aiPromptSnapshot` (JSONB) rastreiam origem da IA.
- Toda nova tabela com `personalId` ou `studentId` precisa de RLS na migration.

## Arquitetura de IA (packages/ai)

```
packages/ai/src/
├── client.ts                       # lazy OpenAI init; getOpenAIClient()
├── prompts/system.ts               # system prompt base — não modificar sem revisão
├── guardrails/validate-output.ts   # callWithValidation(): rate-limit + retry + log
└── workflows/
    ├── generate-workout.ts
    ├── suggest-exercises.ts
    ├── substitute-exercise.ts
    └── validate-workout.ts
```

`callWithValidation()` em `guardrails/validate-output.ts` é o único ponto de chamada à OpenAI:

1. Verifica rate limit (conta chamadas no mês via `aiUsageLog`)
2. Chama OpenAI com `response_format: { type: "json_object" }`
3. Valida output com Zod; se inválido, 1 retry com hint de correção
4. Loga tokens, custo e latência em `aiUsageLog`
5. Lança `AiRateLimitError` ou `AiOutputInvalidError` em caso de falha

Todos os schemas de output da IA ficam em `packages/shared/src/validators/ai.ts`.

## Regras de IA

1. Toda chamada à OpenAI passa por `packages/ai` — nunca chamar diretamente do front ou da api.
2. System prompt base (`packages/ai/src/prompts/system.ts`) é fixo — não modificar sem revisão.
3. Criação de treino via chat é **multi-turn**: estado em `workout_creation_conversations` + `ai_chat_messages`. Treino só entra em `workouts` após `POST /ai/workout-chat/:conv_id/authorize`.
4. Output validado com Zod. Se inválido: 1 retry; se falhar, erro `AI_OUTPUT_INVALID`.
5. Toda chamada à OpenAI registra em `ai_usage_log` com `conversation_id` quando aplicável.
6. Rate limit por plano: `PLAN_LIMITS` em `packages/shared/src/constants/plans.ts`.

## Arquitetura web (Next.js)

```
apps/web/src/
├── middleware.ts      # redireciona /dashboard→/login se não autenticado; /onboarding→/dashboard se já onboardado
└── app/
    ├── (auth)/        # /login, /onboarding, /callback
    ├── (dashboard)/   # /dashboard e sub-rotas (students, workouts, settings)
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
SUPABASE_URL=, SUPABASE_ANON_KEY=, SUPABASE_SERVICE_ROLE_KEY=, DATABASE_URL=
OPENAI_API_KEY=, OPENAI_MODEL_DEFAULT=gpt-4o-mini, OPENAI_MODEL_PREMIUM=gpt-4o
MP_ACCESS_TOKEN=, MP_WEBHOOK_SECRET=
CLOUDFLARE_ACCOUNT_ID=, CLOUDFLARE_R2_ACCESS_KEY=, CLOUDFLARE_R2_SECRET_KEY=
CLOUDFLARE_R2_BUCKET=athletiqlab-videos, CLOUDFLARE_STREAM_TOKEN=
APP_URL=, API_URL=, SENTRY_DSN=, LOGTAIL_TOKEN=, POSTHOG_KEY=
```

## O que NÃO fazer

- Não criar `.md` adicionais sem pedido explícito
- Não adicionar features fora do roadmap sem alinhar com o usuário
- Não pular validações LGPD "por ser MVP"
- Não criar tabela com PII sem RLS
- Não chamar OpenAI fora de `packages/ai`
- Não commitar `.env*`
- Não usar enum fechado para `modality` — sempre `text` ou `text[]`
