# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> Source of truth for product and technical decisions: `PRD.md`. Update CLAUDE.md only for dev-workflow guidance.

## O que é o projeto

SaaS B2B para personal trainers criarem treinos personalizados (com IA) e disponibilizarem para alunos via app mobile estilo Reels, com integração SmartWatch. Solo developer + Claude Code. Idioma do projeto: **português brasileiro** (código em inglês, mensagens/UI em pt-BR).

## Arquitetura

Monorepo Turborepo com `apps/{mobile,web,api}` e `packages/{db,shared,ai,ui}`:

- `apps/mobile` — React Native (Expo SDK 51) com expo-router; bundle único aluno + personal; inclui targets watchOS (Swift/SwiftUI) e Wear OS (Kotlin/Compose)
- `apps/web` — Next.js 15 App Router; landing page + painel web do personal (Tailwind + shadcn/ui)
- `apps/api` — Fastify + Zod; autenticação via JWT Supabase; serve todos os clientes
- `packages/db` — Drizzle ORM schema + migrations; único lugar de definição das tabelas
- `packages/shared` — tipos TypeScript + validators Zod compartilhados entre apps e api
- `packages/ai` — toda integração com OpenAI; prompts, workflows, guardrails — **nunca chamar OpenAI fora daqui**
- `packages/ui` — tokens de design (cores, tipografia, spacing) compartilhados

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
```

Testes: **Vitest** para unitário e integração de API; **Playwright** para E2E web; **Maestro** para E2E mobile. Para rodar um único arquivo de teste: `pnpm --filter=<package> exec vitest run src/path/to/test.spec.ts`.

## Convenções críticas

- **TypeScript strict** em todos os pacotes. Sem `any`.
- **Zod em todas as fronteiras**: input de API, output de API, output da IA.
- **Drizzle ORM** para schema/queries — SQL cru apenas em migrations específicas (RLS, índices GIN).
- **RLS obrigatório** em toda tabela com `personal_id` ou `student_id`. Toda nova tabela precisa de policy criada na migration.
- **Conventional Commits**: `feat(scope):`, `fix(scope):`, `chore:`, `refactor:`.
- **i18n preparado**: strings de UI passam por `t()` mesmo no MVP (facilita adicionar `en` futuramente).

## Domínio — vocabulário

- `personal` — personal trainer (cliente pagante, role: `personal`)
- `student` — aluno (usuário convidado, role: `student`)
- `workout` — treino (template ou atribuído)
- `session` — execução de um treino pelo aluno (check-in/out)
- `anamnese` — avaliação física inicial (dados de saúde sensíveis — LGPD)

## Regras de IA

1. Toda chamada à OpenAI passa por `packages/ai` — nunca chamar diretamente do front ou da api.
2. System prompt base (PRD seção 9.2) é fixo — não modificar sem revisão.
3. Output da IA **sempre validado com Zod**. Se inválido: 1 retry; se falhar novamente: erro `AI_OUTPUT_INVALID`.
4. Toda chamada registra em `ai_usage_log` (tokens, custo, latência, sucesso).
5. Verificar rate limit por plano via `ai_usage_log` **antes** da chamada à OpenAI; retornar `429` se excedido.

## LGPD — não-negociáveis

- Campos `medical_notes`, `medications`, `restrictions` em `anamneses` criptografados com `pgcrypto`.
- Toda leitura de anamnese loga em `audit_log`.
- `DELETE /me/account` agenda exclusão em 30 dias (soft delete via `deleted_at`), não apaga imediatamente.
- URLs de fotos com expiração curta (1h) via URLs assinadas.

## Padrões de API

Respostas de sucesso: `{ "data": { ... } }`. Erros: `{ "error": { "code": "...", "message": "...", "details": {...} } }`. Códigos: 200, 201, 204, 400, 401, 403, 404, 409, 422, 429, 500.

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

## Roadmap macro

Sprint atual: **Sprint 0 (setup)** — projeto ainda não inicializado. Ver `PRD.md` seção 5 para o roadmap completo de 24 semanas.

## O que NÃO fazer

- Não criar `.md` adicionais sem pedido explícito (PRD e CLAUDE.md são suficientes no MVP)
- Não adicionar features fora do roadmap sem alinhar com o usuário
- Não pular validações LGPD "por ser MVP"
- Não criar tabela com PII sem RLS
- Não chamar OpenAI fora de `packages/ai`
- Não commitar `.env*`
