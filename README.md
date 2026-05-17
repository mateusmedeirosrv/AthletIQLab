# AthletiQLab

SaaS B2B para personal trainers criarem treinos personalizados com IA e disponibilizarem para alunos via app mobile estilo Reels, com integração SmartWatch.

## Pré-requisitos

- Node.js >= 20
- pnpm >= 9
- Docker (para Supabase local)

## Setup local

```bash
pnpm install
cp .env.example .env.local   # preencha as variáveis
docker compose up -d         # sobe Supabase local
pnpm db:migrate              # aplica migrations
pnpm db:seed                 # popula biblioteca de exercícios
pnpm dev                     # todos os apps em paralelo
```

## Comandos

| Comando            | Descrição                                  |
| ------------------ | ------------------------------------------ |
| `pnpm dev`         | Todos os apps em paralelo (Turbo)          |
| `pnpm build`       | Build de produção                          |
| `pnpm lint`        | ESLint em todos os pacotes                 |
| `pnpm typecheck`   | TypeScript em todos os pacotes             |
| `pnpm test`        | Vitest em todos os pacotes                 |
| `pnpm db:generate` | Gera migrations Drizzle a partir do schema |
| `pnpm db:migrate`  | Aplica migrations                          |
| `pnpm db:seed`     | Popula banco com exercícios curados        |
| `pnpm db:studio`   | Abre Drizzle Studio                        |

## Estrutura

```
apps/
  mobile/   React Native (Expo) — aluno + personal + watchOS/Wear OS
  web/      Next.js 15 — landing + painel web do personal
  api/      Fastify — API REST
packages/
  db/       Drizzle ORM schema + migrations
  shared/   Tipos TypeScript + Zod validators
  ai/       Integração OpenAI (workflows de geração de treino)
  ui/       Design tokens (cores, tipografia, spacing)
```

## Documentação

- `PRD.md` — Product Requirements Document (source of truth)
- `CLAUDE.md` — Guia para Claude Code
