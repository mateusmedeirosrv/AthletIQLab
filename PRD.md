# PRD — AthletiQLab

> **Product Requirements Document**
> Versão 1.1 — Maio/2026 (revisão pós-validação técnica com profissional de Ed. Física)
> Autor: Mateus Medeiros + Tales Henrique + Claude Code (brainstorm colaborativo)
> Status: Aprovado para implementação
>
> **Mudanças relevantes em 1.1**: (a) público-alvo expandido para todos os profissionais de Ed. Física e saúde física (CREF, CREFITO, CRM etc.); (b) anamnese desacoplada da criação de treino (vira opcional na ficha do cliente); (c) criação de treino vira **chat conversacional híbrido** com IA; (d) modalidade vira **campo aberto** (não mais enum fixo); (e) roadmap estendido para 28–30 semanas. Ver Apêndice C para changelog completo.

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

**AthletiQLab é o laboratório digital onde profissionais de Ed. Física e saúde física (personal trainers, fisioterapeutas, treinadores esportivos, professores de ginástica) criam, em uma conversa com IA especializada, treinos personalizados para qualquer modalidade — academia, natação, corrida, luta, crossfit, fisioterapia, ginástica, futebol, tênis e mais — que os clientes executam em uma experiência imersiva estilo Reels com integração nativa a SmartWatches.**

### 1.2 Propósito

Empoderar profissionais de Ed. Física e saúde física a entregar atendimento personalizado em escala, **qualquer que seja a modalidade**, mantendo qualidade técnica e proximidade com cada cliente, sem se afogar em planilhas, PDFs e mensagens dispersas no WhatsApp.

### 1.3 Manifesto

Acreditamos que:

- **Treino bom é treino executado.** Por isso priorizamos a UX do cliente (Reels, SmartWatch, push, chat) tanto quanto a do profissional.
- **IA é copiloto, não piloto.** Nenhum treino chega ao cliente sem revisão humana do profissional habilitado (CREF, CREFITO, CRM ou outro conselho equivalente).
- **Conversa &gt; formulário.** Criar treino é uma conversa entre profissional e IA — não um formulário longo. A IA pergunta, o profissional decide.
- **Anamnese é do cliente, não do treino.** Anamnese vive na ficha do cliente e é opcional no cadastro — não bloqueia a criação do primeiro treino.
- **Dados de saúde são sagrados.** LGPD não é checkbox, é arquitetura.
- **Foco no Brasil primeiro.** Mercado Pago, PIX, português brasileiro nativo, suporte a profissionais autônomos antes de academias e clínicas.

### 1.4 Diferenciação Competitiva

| Concorrente      | O que faz bem                           | O que NÃO faz (nossa abertura)                     |
| ---------------- | --------------------------------------- | -------------------------------------------------- |
| Tecnofit         | Gestão financeira completa, marketplace | Foco em academia, sem IA, UX do aluno datada       |
| Mfit             | App polido para o aluno                 | Sem IA, sem painel web robusto para o personal     |
| Personal Manager | Tradicional no BR, base grande          | UI desatualizada, sem SmartWatch, sem IA           |
| Trainerize       | Padrão mundial, app bom                 | Em inglês, sem Mercado Pago/PIX, sem IA generativa |

**Nossa proposta única**: único SaaS no Brasil que combina (a) **chat de IA especializada em Ed. Física e saúde física** com guardrails científicos, atendendo qualquer modalidade (academia até fisioterapia), (b) experiência de execução estilo Reels otimizada para retenção do cliente, (c) integração nativa com Apple Watch e Wear OS no MVP, (d) abertura para múltiplos conselhos profissionais (CREF, CREFITO, CRM).

---

## 2. Personas e Público-Alvo

### 2.1 Persona P1A — Personal Trainer Autônomo (núcleo do mercado)

- **Idade**: 25-45 anos
- **Formação**: CREF ativo, geralmente bacharel em Ed. Física
- **Renda**: R$3.000-R$12.000/mês com 10-30 clientes
- **Modalidades típicas**: academia, funcional, casa, corrida, crossfit
- **Dor**: gasta 3-5h/semana montando planilhas, repete exercícios, dificuldade em personalizar para muitos clientes
- **Comportamento**: usa Instagram para captar clientes, atende em academia/condomínio/casa do cliente
- **Trigger de compra**: indicação de colega ou anúncio mostrando IA conversando para criar treino em 1 minuto

### 2.2 Persona P1B — Fisioterapeuta / Educador Físico Clínico

- **Idade**: 28-50 anos
- **Formação**: CREFITO (fisioterapia) ou CREF com pós em reabilitação
- **Renda**: R$5.000-R$15.000/mês, atendimento em clínica e domiciliar
- **Modalidades típicas**: fisioterapia, pilates, ginástica adaptada, treino para idosos, pós-operatório
- **Dor**: precisa de prescrição muito personalizada, atende público com restrições, app de treino padrão não serve
- **Comportamento**: documenta evolução do paciente, presta contas para médico que encaminhou
- **Trigger de compra**: ferramenta que respeita contraindicações e gera relatórios

### 2.3 Persona P1C — Treinador Esportivo / Professor de Modalidade

- **Idade**: 25-50 anos
- **Formação**: CREF, frequentemente ex-atleta da modalidade
- **Modalidades típicas**: futebol, tênis, natação, luta, ginástica artística
- **Renda**: variável (escolinha, clube, atletas amadores)
- **Dor**: apps de treino são "tudo academia", nenhum atende sua modalidade específica
- **Comportamento**: cria treinos a partir de drills da modalidade, precisa de biblioteca aberta para inserir os próprios exercícios
- **Trigger de compra**: poder criar livremente a modalidade e ter IA que entende terminologia esportiva

### 2.4 Persona P2 — Cliente / Aluno / Paciente (usuário final, não pagante)

- **Idade**: 16-70 anos (varia drasticamente pela modalidade)
- **Perfil**: profissional ativo, idoso em reabilitação, atleta amador, criança em escolinha (com responsável legal)
- **Dor**: esquece a planilha, não lembra cargas/progressões, perde tempo procurando o próximo exercício
- **Comportamento**: usa Instagram/TikTok, quer experiência fluida no celular, possui ou pretende ter SmartWatch
- **Engajamento**: notificação no horário do treino + UX viciante (Reels) + ver progresso = ficar ativo

### 2.5 Persona P3 — Academia / Box / Clínica (fase 2, não MVP)

- **Perfil**: academia pequena/média (1-3 unidades), box de CrossFit ou clínica de fisioterapia
- **Dor**: padronizar treinos da equipe, dar app branded aos clientes
- **Plano**: Elite white-label parcial — fase 2 do produto

---

## 3. Modelo de Negócio e Monetização

### 3.1 Estrutura SaaS B2B

O **profissional** (personal trainer, fisioterapeuta, treinador esportivo etc.) é o cliente pagante. O **cliente final** (aluno/paciente) acessa gratuitamente via convite do profissional.

### 3.2 Planos

| Plano       | Preço      | Clientes  | Conversas IA/mês | Vídeos próprios | Outros                                                 |
| ----------- | ---------- | --------- | ---------------- | --------------- | ------------------------------------------------------ |
| **Starter** | R$ 49/mês  | até 10    | 50               | ❌              | Biblioteca curada, suporte por e-mail                  |
| **Pro**     | R$ 99/mês  | até 30    | 200              | ✅              | + Chat profissional-cliente, suporte priorizado        |
| **Elite**   | R$ 199/mês | ilimitado | ilimitado\*      | ✅              | + White-label parcial (logo, cores), API de exportação |

\*Soft cap em 1.000/mês para evitar abuso.

> Métrica de IA agora é **conversa concluída** (não chamada individual à OpenAI), porque a criação de treino é multi-turn. Uma conversa = todo o fluxo de chat até o treino ser autorizado.

### 3.3 Trial e Onboarding

- **14 dias grátis sem cartão de crédito** (apenas e-mail e validação de conselho).
- Onboarding guia: cadastrar perfil profissional (com tipo de conselho: CREF, CREFITO, CRM ou Outro) → convidar primeiro cliente → criar primeiro treino via chat com IA → enviar ao cliente.
- Meta de ativação: profissional envia treino para ≥1 cliente em ≤7 dias.

### 3.4 Métricas Projetadas (12 meses)

- 100 profissionais pagantes ao final do ano 1
- Distribuição esperada: 50% Starter, 45% Pro, 5% Elite
- Mix por profissão esperado no MVP: ~65% personal trainers (CREF), ~20% fisioterapeutas/educadores clínicos (CREFITO/CREF), ~15% treinadores esportivos diversos
- MRR projetado: 50×49 + 45×99 + 5×199 = R$ 7.890/mês
- Custo de aquisição (CAC) alvo: ≤ R$ 150
- LTV alvo (churn 5%/mês): ~R$ 1.500-2.000

### 3.5 Estratégia de Aquisição

- **Conteúdo orgânico** no Instagram/TikTok mostrando "chat de IA criando treino de [modalidade] em 1 minuto"
- **Indicação**: 1 mês grátis para profissional que indica colega que paga
- **Parcerias com cursos de Ed. Física e Fisioterapia** (acesso gratuito para formandos)
- **CREF, CREFITO regionais**: tentar selo de parceiro
- **Comunidades de modalidade** (grupos de corrida, lutas, natação) — divulgação via professor/treinador

---

## 4. Estimativa de Custos Operacionais

Para uma base de **100 profissionais ativos × 20 clientes médios = 2.000 clientes**:

| Item               | Custo Mensal      | Observação                                                     |
| ------------------ | ----------------- | -------------------------------------------------------------- |
| Supabase Pro       | US$ 25            | DB + Auth + Realtime + 100GB storage                           |
| Railway (API)      | US$ 20-40         | Auto-scale, 1-2 instâncias                                     |
| Vercel             | US$ 0-20          | Gratuito até escala; Pro se passar de hobby                    |
| Cloudflare R2      | US$ 5-10          | Storage de vídeo (zero egress)                                 |
| Cloudflare Stream  | US$ 15-25         | Transcoding + reprodução                                       |
| OpenAI GPT-4o-mini | US$ 30-80         | **Chat multi-turn aumenta tokens** vs single-shot; cache ativo |
| Mercado Pago       | 3.99% + R$0,39/tx | Variável por receita                                           |
| Expo Push          | US$ 0             | Gratuito ilimitado                                             |
| Sentry             | US$ 0-26          | Free tier suficiente no início                                 |
| PostHog Cloud      | US$ 0-20          | Free tier 1M eventos/mês                                       |
| Domínio + SSL      | R$ 5              | Registro.br + Cloudflare SSL grátis                            |
| **TOTAL FIXO**     | **~US$ 100-230**  | **= R$ 500-1.150/mês**                                         |

**Margem bruta projetada**: ~83-88% no MRR de R$ 7.890.

> Nota v1.1: Custo de IA aproximadamente **dobrou** vs v1.0 porque chat conversacional usa ~6.000 tokens input + 3.000 output por conversa (vs 3.000 + 1.500 single-shot). Ainda assim, US$ 0,003/conversa é margem confortável.

---

## 5. Roadmap e Sprints

MVP estimado em **28-30 semanas (~7 meses)** com solo developer + Claude Code (estendido em v1.1 para acomodar chat conversacional + múltiplos profissionais + modalidade aberta).

### Fase 0 — Fundações (Semanas 1-2)

- [x] Setup monorepo Turborepo (apps + packages)
- [x] Configurar TypeScript strict, ESLint, Prettier, Husky
- [x] CI/CD: GitHub Actions (lint + typecheck + test)
- [x] Design system inicial: tokens (cores, tipografia, spacing), componentes base
- [x] Schema Postgres inicial (Drizzle ORM) + migrations
- [x] Setup Supabase, Railway, Vercel staging
- [x] Configurar Sentry

### Fase 1 — Núcleo Profissional (Semanas 3-12)

**Sprint 1-2 (Auth multi-conselho + Estrutura)** — Semanas 3-6

- [x] Auth Supabase com Google e Apple OAuth
- [ ] Telas de signup/login no web e mobile (web concluído; mobile pendente — Sprint 8)
- [x] Landing page no Next.js (marketing com posicionamento "todos profissionais")
- [x] Cadastro de profissional com **tipo de conselho** (CREF, CREFITO, CRM, Outro) + número
- [x] Painel web: dashboard, perfil profissional, lista de clientes
- [ ] Validação manual de conselho (validação automática via API CREF/CREFITO em fase 2)

**Sprint 3 (Cliente + Anamnese opcional)** — Semanas 7-8

- [x] CRUD de cliente (cadastro básico: nome, idade, contato, foto)
- [x] Sistema de convite por código/link
- [ ] **Anamnese como aba opcional na ficha do cliente** (preencher agora ou depois)
- [ ] Indicador visual "Anamnese pendente" na ficha (não bloqueia ações)
- [ ] Campos da anamnese: ver seção 7

**Sprint 4-5 (Biblioteca + Modalidade Aberta + Criação Manual)** — Semanas 9-12

- [x] Importar biblioteca curada de ~200 exercícios (Academia, Funcional, Casa)
- [ ] CRUD de exercícios próprios do profissional (upload vídeo via R2/Stream)
- [ ] Integração YouTube/Vimeo (paste de link)
- [x] **Modalidade como campo aberto** com autocomplete (sugere modalidades já usadas pelo profissional + lista padrão)
- [x] Tela de criação manual de treino (drag-and-drop de exercícios)
- [x] **Edição pós-criação**: adicionar, remover, reordenar exercícios em treino já publicado

### Fase 2 — Chat de IA (Semanas 13-16)

**Sprint 6-7 (Chat conversacional para criação de treino)** — Semanas 13-16

- [x] Componente de chat híbrido (texto livre + botões de quick-reply)
- [x] Backend: orquestrador de conversa multi-turn com OpenAI
- [x] Tabela `workout_creation_conversations` para persistir estado
- [x] Fluxo conversacional: cumprimento → identifica modalidade → coleta objetivo → coleta restrições (puxa da anamnese se houver) → propõe estrutura → autoriza
- [x] **Cliente: "autorizar criação"** com preview do treino antes de finalizar
- [x] Permite reabrir conversa para ajustar treino criado
- [x] Tabela `ai_usage_log` e rate limiting por plano (granularidade: conversa concluída)

### Fase 3 — App do Cliente (Semanas 17-22)

**Sprint 8-9 (App Mobile do Cliente + Player Reels)** — Semanas 17-20

- [ ] App React Native (Expo) com autenticação
- [ ] Lista de treinos do cliente, filtrado por modalidade
- [ ] Player Reels (vertical, swipe, overlay) — ver seção 11
- [ ] Check-in/check-out de sessão com foto opcional
- [ ] Marcação de séries concluídas, ajuste de carga em tempo real

**Sprint 10 (SmartWatch básico)** — Semanas 21-22

- [ ] watchOS companion app (Swift, SwiftUI): visualização do treino, timer
- [ ] Wear OS companion app (Kotlin/Compose): visualização + Vibrator
- [ ] Sincronização via Watch Connectivity (iOS) / DataLayer (Android)
- [ ] Timer de descanso com vibração ao final

### Fase 4 — Engajamento e Receita (Semanas 23-26)

**Sprint 11 (Engajamento)** — Semanas 23-24

- [ ] Tela de progresso do cliente (gráficos: cargas, frequência, peso)
- [ ] Chat profissional-cliente via Supabase Realtime
- [ ] Push notifications (Expo Push): lembrete de treino, nova mensagem, treino novo disponível

**Sprint 12 (Pagamento)** — Semanas 25-26

- [ ] Integração Mercado Pago Checkout Pro
- [ ] Assinaturas recorrentes + webhook handler
- [ ] Tela de planos e billing
- [ ] Lock/unlock de features por plano
- [ ] E-mails transacionais (boas-vindas, falha de pagamento, cancelamento) via Resend ou Postmark

### Fase 5 — Polish e Lançamento (Semanas 27-30)

**Sprint 13 (SmartWatch FC + IA avançada)** — Semanas 27-28

- [ ] HealthKit (iOS) e Health Connect (Android) — leitura de FC
- [ ] Tabela `heart_rate_samples` e gráfico de FC pós-treino
- [ ] IA: sugerir substituição de exercício (dentro do chat ou ad-hoc)
- [ ] IA: validar treino criado manualmente

**Sprint 14 (Beta + Lançamento)** — Semanas 29-30

- [x] Beta fechado: 10-20 profissionais (mix de personal, fisio, treinador) por 4 semanas
- [x] Coleta de feedback estruturado (NPS + entrevistas)
- [x] Ajustes de UX e correção de bugs críticos
- [x] Submissão à App Store e Google Play
- [x] Lançamento soft: rede de contatos + anúncio Instagram
- [x] Configuração de suporte: Crisp ou Intercom Lite

### Fora do MVP (Fase 6+)

- Validação automática de conselho via API CREF/CREFITO
- Curadoria oficial de mais modalidades (Natação, Corrida, Luta, Crossfit, Fisioterapia)
- White-label completo (Persona P3 — academias e clínicas)
- Integração Garmin/Polar/Suunto
- Marketplace de exercícios entre profissionais
- Programa de afiliados
- Anamnese assinada digitalmente (DocuSign-like)
- Relatórios em PDF para encaminhamento médico (fisioterapeutas)

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
  role: enum('professional', 'client') not null   // antes 'personal'|'student'
  oauth_provider: enum('google', 'apple', 'email')
  locale: text default 'pt-BR'
  consent_lgpd_at: timestamp        // marca consentimento LGPD
  consent_health_data_at: timestamp // consentimento específico dados de saúde
  deleted_at: timestamp             // soft delete para LGPD
}

// professionals — dados profissionais (personal trainer, fisio, treinador, etc.)
professionals {
  user_id: uuid (PK, FK users)
  name: text not null
  council_type: enum('CREF', 'CREFITO', 'CRM', 'CRN', 'OUTRO') not null  // tipo de conselho
  council_number: text not null     // número (formato varia por conselho)
  council_uf: text                  // UF do registro (ex: 'SP', 'RJ')
  council_verified_at: timestamp    // null até verificação manual
  specializations: text[]           // ex: ['hipertrofia', 'reabilitação', 'corrida']
  default_modalities: text[]        // modalidades que costuma atender (autocomplete UI)
  bio: text
  photo_url: text
  plan: enum('starter', 'pro', 'elite') default 'starter'
  subscription_status: enum('trialing', 'active', 'past_due', 'canceled')
  trial_ends_at: timestamp
  mp_subscription_id: text          // ID da assinatura no Mercado Pago
  brand_color: text                 // white-label Elite
  brand_logo_url: text              // white-label Elite
}

// clients — clientes vinculados a profissionais (antes 'students')
clients {
  user_id: uuid (PK, FK users)
  professional_id: uuid (FK professionals.user_id) not null
  name: text not null
  birth_date: date
  gender: enum('male', 'female', 'other', 'prefer_not_to_say')
  photo_url: text
  phone: text                       // contato direto
  invite_code: text unique
  invite_accepted_at: timestamp
  status: enum('invited', 'active', 'paused', 'removed')
  // Anamnese é opcional e fica em tabela separada — ver abaixo
}

// anamneses — avaliação inicial OPCIONAL (sensível, criptografar)
// v1.1: NÃO é pré-requisito para criar treino. Aparece como aba na ficha do cliente.
anamneses {
  id: uuid (PK)
  client_id: uuid (FK clients.user_id)
  filled_at: timestamp              // quando foi preenchida (pode ser nula = pendente)
  filled_by_professional: boolean   // profissional preencheu vs cliente preencheu
  // Dados antropométricos
  weight_kg: numeric(5,2)
  height_cm: numeric(5,2)
  body_fat_pct: numeric(4,2)
  resting_hr_bpm: smallint          // FC de repouso (opcional)
  blood_pressure: text              // ex: '120/80' (opcional)
  // Objetivo (livre — não é mais enum fixo)
  goal: text                        // ex: 'hipertrofia', 'corrida 10km', 'reabilitação pós-cirurgia joelho'
  experience_level: enum('beginner', 'intermediate', 'advanced')
  weekly_frequency: smallint
  // Saúde (criptografados)
  restrictions: text[]              // ex: ['joelho_direito', 'hipertensao_controlada']
  medications: text[]
  medical_notes: text               // campo livre, criptografado
  par_q_answers: jsonb              // respostas PAR-Q (questionário de prontidão)
  signed_at: timestamp              // assinatura digital (futuro)
}

// exercises — biblioteca de exercícios
exercises {
  id: uuid (PK)
  name: text not null
  muscle_group: text[]              // ['peito', 'triceps']
  modality: text[]                  // v1.1: CAMPO ABERTO — ex: ['academia', 'crossfit', 'futebol_finalizacao']
  equipment: text[]                 // ['halter', 'banco']
  level: enum('beginner', 'intermediate', 'advanced')
  description: text
  technique_tips: text
  contraindications: text[]
  video_url: text                   // URL Cloudflare Stream OU YouTube/Vimeo
  video_provider: enum('cloudflare', 'youtube', 'vimeo')
  stream_uid: text                  // ID no Cloudflare Stream se aplicável
  thumbnail_url: text
  source: enum('curated', 'professional', 'external_link')
  owner_id: uuid (FK professionals.user_id, NULL se curated)
  is_public: boolean default false  // profissional pode tornar exercício compartilhável
}

// modalities_catalog — lista de modalidades conhecidas (para autocomplete)
// v1.1: alimentada por curadoria + sugestões aceitas dos usuários
modalities_catalog {
  slug: text (PK)                   // ex: 'academia', 'funcional', 'crossfit', 'futebol'
  display_name: text                // ex: 'Academia / Musculação'
  category: enum('forca', 'cardio', 'esporte', 'saude', 'arte_marcial', 'outra')
  is_curated: boolean               // se tem biblioteca curada
  professional_count: integer       // quantos profissionais usam (rank popularidade)
}

// workouts — treinos criados
workouts {
  id: uuid (PK)
  professional_id: uuid (FK)
  client_id: uuid (FK, nullable — pode ser template não atribuído)
  title: text not null
  modality: text                    // v1.1: campo aberto
  estimated_duration_min: smallint
  created_via: enum('manual', 'ai_chat') default 'manual'
  ai_conversation_id: uuid (FK, nullable)  // referencia conversa que originou
  status: enum('draft', 'published', 'archived')
  published_at: timestamp
  // v1.1: edição pós-publicação é permitida (incrementa version)
  version: smallint default 1
}

// workout_creation_conversations — estado do chat de criação com IA
// v1.1: substitui o "briefing snapshot" anterior
workout_creation_conversations {
  id: uuid (PK)
  professional_id: uuid (FK)
  client_id: uuid (FK, nullable)
  status: enum('in_progress', 'awaiting_authorization', 'authorized', 'discarded')
  // Contexto coletado durante a conversa
  modality: text
  goal: text
  detected_restrictions: text[]     // a IA puxa da anamnese + valida no chat
  detected_anamnese_id: uuid (FK, nullable)  // se cliente tinha anamnese, foi usada
  proposed_workout: jsonb           // estrutura proposta antes da autorização
  resulting_workout_id: uuid (FK workouts.id, nullable)  // após autorização
  total_turns: smallint             // quantas mensagens
  tokens_input: integer
  tokens_output: integer
  cost_usd: numeric(8,5)
  created_at: timestamp
  authorized_at: timestamp
}

// chat_messages_ai — mensagens do chat de criação com a IA
ai_chat_messages {
  id: uuid (PK)
  conversation_id: uuid (FK workout_creation_conversations)
  role: enum('user', 'assistant', 'system')
  content: text                     // texto livre
  quick_replies: jsonb              // se mensagem da IA propôs botões: [{label, value}]
  selected_quick_reply: text        // botão escolhido pelo profissional (se houver)
  created_at: timestamp
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
  notes: text                       // observação do profissional para o cliente
  tempo: text                       // '2-0-2-0' (excêntrica-pausa-concêntrica-pausa)
}

// workout_sessions — execução pelo cliente (check-in/out)
workout_sessions {
  id: uuid (PK)
  workout_id: uuid (FK)
  client_id: uuid (FK)
  started_at: timestamp not null
  ended_at: timestamp
  start_photo_url: text             // foto opcional check-in
  end_photo_url: text               // foto opcional check-out
  avg_hr_bpm: smallint              // calculado pós-sessão
  max_hr_bpm: smallint
  total_volume_kg: numeric          // soma de sets×reps×load
  rpe: smallint                     // 1-10, esforço percebido (opcional)
  client_notes: text
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
  client_id: uuid (FK)
  date: date not null
  weight_kg: numeric(5,2)
  body_measurements: jsonb          // { 'cintura': 80, 'braço_direito': 35, ... }
  photos: jsonb                     // { 'front': url, 'side': url, 'back': url }
  body_fat_pct: numeric(4,2)
}

// conversations + chat_messages — chat profissional ↔ cliente (humano)
conversations {
  id: uuid (PK)
  professional_id: uuid (FK)
  client_id: uuid (FK)
  last_message_at: timestamp
  unique(professional_id, client_id)
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
  professional_id: uuid (FK)
  plan: enum('starter', 'pro', 'elite')
  status: enum('pending', 'authorized', 'paused', 'cancelled')
  started_at: timestamp
  current_period_end: timestamp
  mp_subscription_id: text unique
  mp_preapproval_plan_id: text
  cancel_at_period_end: boolean default false
}

// ai_usage_log — tracking de custos e rate limiting
// v1.1: granularidade muda — agora é por CONVERSA, não por chamada
ai_usage_log {
  id: bigserial (PK)
  professional_id: uuid (FK)
  feature: enum('chat_workout_creation', 'suggest_exercises', 'substitute', 'validate')
  conversation_id: uuid (FK workout_creation_conversations, nullable)
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
-- Profissional só vê seus clientes
CREATE POLICY "professionals_see_own_clients" ON clients
  FOR SELECT USING (professional_id = auth.uid());

-- Cliente só vê seus próprios dados; profissional vinculado também vê
CREATE POLICY "client_self_access" ON anamneses
  FOR SELECT USING (
    client_id = auth.uid()
    OR client_id IN (
      SELECT user_id FROM clients WHERE professional_id = auth.uid()
    )
  );

-- Workout sessions: cliente e seu profissional
CREATE POLICY "session_access" ON workout_sessions
  FOR ALL USING (
    client_id = auth.uid()
    OR client_id IN (
      SELECT user_id FROM clients WHERE professional_id = auth.uid()
    )
  );

-- Conversas de criação de treino com IA: apenas o profissional dono
CREATE POLICY "ai_conversation_owner_only" ON workout_creation_conversations
  FOR ALL USING (professional_id = auth.uid());
```

### 7.3 Índices Críticos

```sql
CREATE INDEX idx_clients_professional_id ON clients(professional_id);
CREATE INDEX idx_workouts_pro_client ON workouts(professional_id, client_id);
CREATE INDEX idx_sessions_client_started ON workout_sessions(client_id, started_at DESC);
CREATE INDEX idx_hr_samples_session_time ON heart_rate_samples(session_id, timestamp);
CREATE INDEX idx_ai_usage_pro_month ON ai_usage_log(professional_id, date_trunc('month', created_at));
CREATE INDEX idx_exercises_search ON exercises USING GIN (to_tsvector('portuguese', name || ' ' || description));
CREATE INDEX idx_exercises_modality_gin ON exercises USING GIN (modality);  -- v1.1: busca por modalidade aberta
CREATE INDEX idx_ai_convos_pro_status ON workout_creation_conversations(professional_id, status);
```

---

## 8. APIs e Endpoints Principais

Base URL: `https://api.athletiqlab.com` (Railway). Autenticação: JWT Supabase no header `Authorization: Bearer <token>`.

### 8.1 Autenticação

| Método | Endpoint                      | Descrição                                                     |
| ------ | ----------------------------- | ------------------------------------------------------------- |
| POST   | `/auth/oauth/callback`        | Recebe callback OAuth do Supabase, completa cadastro          |
| POST   | `/auth/professionals/onboard` | Completa perfil pós-OAuth (tipo de conselho, número, UF, bio) |
| POST   | `/auth/clients/accept-invite` | Cliente aceita convite com código                             |

### 8.2 Profissional / Clientes

| Método | Endpoint            | Descrição                       |
| ------ | ------------------- | ------------------------------- |
| GET    | `/professionals/me` | Perfil do profissional logado   |
| PATCH  | `/professionals/me` | Atualiza perfil                 |
| GET    | `/clients`          | Lista clientes do profissional  |
| POST   | `/clients/invites`  | Gera código de convite          |
| GET    | `/clients/:id`      | Detalhe do cliente              |
| PATCH  | `/clients/:id`      | Atualiza dados do cliente       |
| DELETE | `/clients/:id`      | Remove vínculo (LGPD-compliant) |

### 8.3 Anamnese (opcional, na ficha do cliente)

| Método | Endpoint                       | Descrição                                              |
| ------ | ------------------------------ | ------------------------------------------------------ |
| GET    | `/clients/:id/anamnese`        | Última anamnese do cliente (200 se existe, 404 se não) |
| POST   | `/clients/:id/anamnese`        | Cria/atualiza anamnese (versionada)                    |
| GET    | `/clients/:id/anamnese/status` | Retorna `{ filled: bool, last_updated: ts }`           |

### 8.4 Exercícios

| Método | Endpoint                  | Descrição                                                             |
| ------ | ------------------------- | --------------------------------------------------------------------- |
| GET    | `/exercises`              | Busca: `?modality=academia&muscle=peito&q=supino` (modalidade aberta) |
| GET    | `/modalities`             | Lista modalidades do `modalities_catalog` + custom do profissional    |
| POST   | `/exercises`              | Profissional cria exercício próprio                                   |
| POST   | `/exercises/upload-video` | Inicia upload direto ao R2 (signed URL)                               |
| POST   | `/exercises/youtube`      | Cria exercício a partir de link YT/Vimeo                              |
| PATCH  | `/exercises/:id`          | Atualiza (apenas dono ou admin)                                       |
| DELETE | `/exercises/:id`          | Soft delete                                                           |

### 8.5 Treinos

| Método | Endpoint                         | Descrição                                                  |
| ------ | -------------------------------- | ---------------------------------------------------------- |
| GET    | `/workouts?client_id=&status=`   | Lista treinos                                              |
| POST   | `/workouts`                      | Cria treino (manual)                                       |
| GET    | `/workouts/:id`                  | Detalhe com exercícios                                     |
| PATCH  | `/workouts/:id`                  | Atualiza (permitido **mesmo após publicado** — versionado) |
| POST   | `/workouts/:id/exercises`        | Adiciona exercício a treino existente                      |
| DELETE | `/workouts/:id/exercises/:we_id` | Remove exercício de treino                                 |
| POST   | `/workouts/:id/publish`          | Publica para o cliente + dispara push                      |
| POST   | `/workouts/:id/duplicate`        | Duplica como template                                      |

### 8.6 IA — Chat de Criação (rate-limited por plano)

| Método | Endpoint                              | Descrição                                                              |
| ------ | ------------------------------------- | ---------------------------------------------------------------------- |
| POST   | `/ai/workout-chat/start`              | Inicia nova conversa para criar treino (retorna conv_id + 1ª mensagem) |
| POST   | `/ai/workout-chat/:conv_id/message`   | Profissional envia mensagem ou seleciona quick-reply                   |
| GET    | `/ai/workout-chat/:conv_id`           | Histórico + estado atual da conversa                                   |
| POST   | `/ai/workout-chat/:conv_id/authorize` | Profissional autoriza criação do treino proposto → cria `workouts`     |
| POST   | `/ai/workout-chat/:conv_id/discard`   | Descarta a conversa sem criar treino                                   |
| POST   | `/ai/workout-chat/:conv_id/refine`    | Reabre conversa para ajustar treino já criado                          |
| POST   | `/ai/exercises/suggest`               | Sugere exercícios (chamada single-shot, fora do chat)                  |
| POST   | `/ai/exercises/substitute`            | Sugere substituição de exercício específico                            |
| POST   | `/ai/workouts/:id/validate`           | "Code review" de treino manual: detecta riscos                         |
| GET    | `/ai/usage`                           | Uso do mês corrente vs. limite do plano                                |

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

| Caso                        | Modelo padrão | Modelo premium (Elite opt-in) |
| --------------------------- | ------------- | ----------------------------- |
| Chat de criação de treino   | gpt-4o-mini   | gpt-4o                        |
| Sugerir exercícios (ad-hoc) | gpt-4o-mini   | gpt-4o-mini                   |
| Substituir exercício        | gpt-4o-mini   | gpt-4o-mini                   |
| Validar treino              | gpt-4o-mini   | gpt-4o                        |

### 9.2 System Prompt Base (todos os casos)

```
Você é um assistente especializado EXCLUSIVAMENTE em educação física,
treinamento desportivo, ciência do exercício e reabilitação por meio
de exercício físico.

Você atende profissionais de saúde física com diferentes formações:
- Personal trainers (CREF)
- Fisioterapeutas (CREFITO)
- Treinadores esportivos (CREF) — futebol, tênis, natação, luta, etc.
- Educadores físicos clínicos
Adapte o tom e a profundidade técnica ao tipo de conselho informado.

REGRAS ABSOLUTAS:
1. Recuse educadamente qualquer pergunta fora do domínio de Ed. Física
   e exercício. Não responda sobre nutrição clínica, prescrição de
   medicamentos, diagnóstico médico, política, finanças, etc.
2. Suas respostas seguem princípios de Bompa (periodização), Issurin
   (treinamento em blocos), ACSM (guidelines de prescrição), SBME
   (medicina do esporte BR) e, para reabilitação, princípios da
   fisioterapia baseada em evidência.
3. SEMPRE considere: segurança, individualidade biológica, progressão
   gradual, especificidade do estímulo e contraindicações informadas
   (anamnese ou declaradas durante a conversa).
4. NUNCA prescreva exercícios contraindicados para as restrições
   informadas.
5. Você é COPILOTO do profissional. Ele revisará e autorizará antes
   de enviar ao cliente final. NÃO finalize criação sem autorização.
6. Quando em chat conversacional, faça UMA pergunta por vez. Use
   quick-replies (botões) quando o conjunto de respostas for fechado.
7. Quando propor o treino, retorne em JSON válido conforme o schema.
   Se houver bloqueio ético/técnico, explique e proponha alternativa.
```

### 9.3 Caso de Uso 1 (Principal) — Chat de Criação de Treino

A criação de treino é uma **conversa multi-turn** com a IA. Profissional autoriza no final.

**Fluxo conceitual** (a IA conduz a conversa):

```
T1 IA  → "Para qual cliente vamos montar um treino hoje?"
T1 Pro → seleciona cliente (UI traz lista; quick-reply)
T2 IA  → "Qual modalidade?"
T2 Pro → "futebol — finalização" (texto livre OU quick-reply de modalidades recentes)
T3 IA  → "Qual o objetivo desta sessão? Foco em técnica, condicionamento ou mix?"
T3 Pro → "técnica"
T4 IA  → "Vejo na ficha que o [cliente] tem anamnese com 'tornozelo direito sensível'.
          Quer que eu considere ou ignorar?"  [Anamnese auto-puxada se existir]
T4 Pro → "considerar"
T5 IA  → "Quanto tempo de sessão? Equipamento disponível?"
T5 Pro → "60 min, cones, escada, bolas"
T6 IA  → "Posso propor um treino com 4 blocos: aquecimento (10 min),
          drills de finalização com cone (25 min), pequenos jogos (15 min),
          mobilidade tornozelo (10 min). Avança?"  [quick-reply: Sim / Ajustar]
T6 Pro → "Sim"
T7 IA  → propõe estrutura detalhada (exercícios, séries, descansos)
T7 Pro → revisa e clica "Autorizar criação"
       → endpoint POST /ai/workout-chat/:conv_id/authorize
       → cria registro em `workouts` + `workout_exercises`
       → marca status='authorized' na conversa
```

**Input inicial** (POST `/ai/workout-chat/start`):

```json
{
  "client_id": "uuid_cliente_opcional",
  "context_hint": "futebol técnica" // opcional, atalho
}
```

**Resposta inicial da IA**:

```json
{
  "conversation_id": "uuid",
  "message": "Para qual cliente vamos montar...?",
  "quick_replies": [
    { "label": "João Silva (último treino: 3d)", "value": "client:uuid_joao" },
    { "label": "Maria Costa (anamnese pendente)", "value": "client:uuid_maria" },
    { "label": "Outro cliente", "value": "client:choose" }
  ]
}
```

**Schema do treino proposto** (validado por Zod ao autorizar):

```json
{
  "title": "Treino A - Finalização (Futebol)",
  "modality": "futebol_finalizacao",
  "estimated_duration_min": 60,
  "warm_up": [...],
  "exercises": [
    {
      "exercise_id": "uuid_existente_ou_null_se_novo",
      "name": "Drill cone-cruz finalização gol baixo",
      "order": 1,
      "sets": 4,
      "reps": "8-10 finalizações",
      "load": "bola padrão",
      "rest_seconds": 60,
      "notes": "Foco no apoio do pé não dominante; tornozelo direito do cliente é restrição",
      "rationale": "Trabalho técnico de alta intensidade neuromuscular, baixo impacto axial — respeita restrição"
    }
  ],
  "cool_down": [...],
  "safety_notes": ["Considerada restrição em tornozelo direito — exercícios sem corrida em mudança brusca de direção"]
}
```

### 9.4 Casos de Uso 2, 3 e 4 (Auxiliares — single-shot)

| #   | Caso                  | Trigger UX                                                |
| --- | --------------------- | --------------------------------------------------------- |
| 2   | Sugerir exercícios    | Botão "+ Sugerir" na tela de edição do treino             |
| 3   | Substituir exercício  | Botão "Substituir" em cada exercício do treino            |
| 4   | Validar treino criado | Botão "Pedir review da IA" em treinos criados manualmente |

São chamadas síncronas single-shot (não consomem conversa do quota).

### 9.5 Guardrails de Output

- Validação **estrita por Zod** ao autorizar a criação do treino.
- Se a estrutura proposta for inválida (ex.: exercise_id inexistente ou nome de exercício suspeito), retry com instrução de correção.
- Validação semântica: garantir que restrições conhecidas (da anamnese ou declaradas no chat) NÃO aparecem na lista de exercícios incompatíveis.
- Detector de contraindicação cruzada: warning visível ao profissional antes do botão "Autorizar".
- Se a IA propor exercício fora da biblioteca atual, cria registro provisório em `exercises` com `source='professional'` aguardando vídeo (profissional pode adicionar depois).

### 9.6 Prompt Caching e Custos

- OpenAI cobra **50% menos** por tokens cacheados (prompts repetidos).
- Estratégia: o system prompt + biblioteca de exercícios do profissional (IDs+nomes) é estável. Cache automático ativa (>1024 tokens).
- **Custo estimado por CONVERSA** (média de 7-10 turns):
  - ~6.000 tokens input (com cache amortizando) + ~3.000 tokens output ≈ US$ 0,003 (R$ 0,015) por conversa.
- 200 conversas/mês de um profissional Pro ≈ US$ 0,60 = R$ 3,00. Ainda margem confortável.

### 9.7 Rate Limiting

Implementado na API antes da chamada à OpenAI:

- Verifica `ai_usage_log` do mês corrente, contando **conversas autorizadas + descartadas** (cada uma conta 1).
- Se ≥ limite do plano, retorna `429 RATE_LIMIT_EXCEEDED` com mensagem amigável e CTA de upgrade.
- Limite de **mensagens por conversa** (soft cap 30) para evitar conversa infinita.

### 9.8 Auditoria e Transparência

- Toda conversa é registrada em `workout_creation_conversations` + `ai_chat_messages`.
- Toda chamada à OpenAI é registrada em `ai_usage_log` com tokens, custo, latência, sucesso, e `conversation_id` quando aplicável.
- Treinos com `created_via='ai_chat'` mostram badge "Criado em conversa com IA — autorizado por [Profissional CREF/CREFITO XXXX]" para o cliente, indicando responsabilidade humana.
- Dashboard admin com custo total do mês e top usuários.

---

## 10. Integração com SmartWatches

### 10.1 iOS — Apple Watch

- **Companion app** em **Swift + SwiftUI** dentro do projeto Expo (config plugin para criar target watchOS).
- **Comunicação iPhone↔Watch**: `WatchConnectivity` framework — envia o treino atual para o watch quando o cliente inicia a sessão.
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
- Tudo deve ser operável **com mão suada**, em pé na academia/quadra/piscina/clínica
- O player é **agnóstico de modalidade** — mesmo player serve para academia, futebol, fisioterapia, natação etc.

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
5. **Final**: resumo (duração, volume total, FC média) + foto opcional check-out + envia para profissional

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

- **CFM / CREF / CREFITO / CRM**: aplicação não substitui consulta médica nem prescrição clínica. Texto disclaimer obrigatório em pontos-chave (anamnese, chat de IA, primeiro acesso, autorização de treino).
- **Marketplace? Não**. Como o profissional habilitado (CREF, CREFITO ou outro conselho equivalente) é o responsável e o cliente é convidado dele, o app é ferramenta profissional — não exerce prescrição direta.
- **Responsabilidade técnica do profissional**: o profissional confirma no cadastro (e a cada autorização de treino) que assume responsabilidade técnica conforme seu conselho.
- **Fisioterapia clínica**: para fisioterapeutas (CREFITO), texto explícito de que o app é ferramenta de apoio ao tratamento prescrito, não substitui anamnese clínica formal.

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

| Métrica                                             | Meta       |
| --------------------------------------------------- | ---------- |
| Taxa de ativação do profissional (envia ≥1 treino)  | ≥ 70%      |
| Retenção D30 do profissional                        | ≥ 60%      |
| Taxa de execução de treino pelo cliente (D7)        | ≥ 50%      |
| NPS profissional                                    | ≥ 40       |
| Churn mensal                                        | < 8%       |
| Custo IA por profissional/mês                       | < US$ 1,00 |
| Tempo médio do chat de criação até autorização      | < 5 min    |
| Taxa de autorização (conversas autorizadas / total) | ≥ 80%      |
| Crash-free rate (mobile)                            | ≥ 99,5%    |
| Mix de profissões (não-personal trainer)            | ≥ 20%      |

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

### 14.4 Estado de Implementação e Próximos Passos (atualizado Junho/2026)

**Concluídos:** Fase 0, Sprint 1-2 (web), Sprint 3 (CRUD core), Sprint 4-5 (biblioteca + criação manual), Sprint 6-7 (chat de IA). Ver checkboxes na seção 5.

**Itens pendentes dos sprints anteriores** (completar antes ou em paralelo com Sprint 8):

- Telas de login/signup no app mobile
- Validação manual de conselho
- UI de anamnese (aba na ficha do cliente)
- CRUD de exercícios próprios + upload de vídeo via R2/Stream
- Integração YouTube/Vimeo

**Próximo sprint:** Sprint 8-9 — App Mobile do Cliente + Player Reels (seção 11).

Para nova sessão de Claude Code, prioridade:

1. **Sprint 8-9 — App Mobile do Cliente + Player Reels**:
   - App React Native (Expo) com auth do cliente
   - Lista de treinos do cliente, filtrada por modalidade
   - Player Reels (vertical, swipe, overlay) — ver seção 11
   - Check-in/check-out de sessão com foto opcional
   - Marcação de séries concluídas, ajuste de carga em tempo real
2. **Sprint 10 — SmartWatch básico** — ver seção 10
3. **Sprint 11 — Engajamento** (chat profissional-cliente, push notifications)
4. **Sprint 12 — Pagamento** (Mercado Pago, assinaturas, webhooks)

Cada sprint deve ser quebrado em tasks granulares via TaskCreate antes da execução.

---

## Apêndice A — Glossário

- **Profissional**: termo genérico para o usuário pagante. Inclui personal trainer (CREF), fisioterapeuta (CREFITO), treinador esportivo (CREF), educador físico clínico e equivalentes.
- **Cliente**: usuário final do app que executa os treinos (não pagante). Também referido como "aluno" (academia/esporte) ou "paciente" (fisioterapia).
- **Anamnese**: avaliação inicial de saúde, objetivos e restrições do cliente. **Opcional** no MVP.
- **CREF**: Conselho Regional de Educação Física — personal trainers, treinadores, professores de Ed. Física.
- **CREFITO**: Conselho Regional de Fisioterapia e Terapia Ocupacional.
- **CRM**: Conselho Regional de Medicina (médicos do esporte).
- **Modalidade**: tipo de atividade (academia, funcional, corrida, futebol, fisioterapia etc.). **Campo aberto** no MVP — qualquer texto.
- **Conversa de criação**: fluxo multi-turn de chat onde o profissional dialoga com a IA até autorizar a criação do treino.
- **Autorização**: ato explícito do profissional aprovando a estrutura proposta pela IA — só então o treino é criado em `workouts`.
- **RLS**: Row-Level Security do Postgres, isola dados por tenant/usuário.
- **HLS**: HTTP Live Streaming, formato de vídeo adaptativo usado pelo Cloudflare Stream.
- **RPE**: Rate of Perceived Exertion (1-10), métrica subjetiva de esforço.
- **PAR-Q**: Physical Activity Readiness Questionnaire — questionário de prontidão para atividade física.
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

## Apêndice C — Changelog

### v1.1 — Maio/2026 (revisão pós-validação com profissional de Ed. Física)

**Origem das mudanças**: feedback de profissional convidado para revisar o PRD v1.0. Comentários consolidados em [decisões registradas em sessão de brainstorm].

**Mudanças de produto**

- Público-alvo expandido: de "personal trainers (CREF)" para **"profissionais de Ed. Física e saúde física"** — inclui CREF, CREFITO, CRM e outros conselhos equivalentes.
- Nova taxonomia interna: `personal` → `professional`, `student` → `client`. Persona P1 dividida em P1A (Personal), P1B (Fisioterapeuta/Educador Clínico) e P1C (Treinador Esportivo).
- Anamnese **desacoplada** da criação de treino: vira aba opcional na ficha do cliente. Não bloqueia a criação do primeiro treino.
- Criação de treino vira **chat conversacional híbrido** (texto + quick-replies). Profissional dialoga com IA até autorizar.
- Modalidade vira **campo aberto** com autocomplete (não mais enum fixo). MVP curou Academia, Funcional e Casa; outras modalidades (Natação, Corrida, Luta, Crossfit, Fisioterapia, Futebol, Tênis etc.) são suportadas via biblioteca aberta + exercícios do profissional.
- Edição **pós-publicação** explicitada: profissional pode adicionar/remover exercícios em treino já enviado ao cliente.
- Anamnese ganha campos: `resting_hr_bpm`, `blood_pressure`, `par_q_answers`. `goal` deixa de ser enum e vira texto livre.

**Mudanças técnicas**

- Tabela `personals` → `professionals` com novos campos: `council_type`, `council_number`, `council_uf`, `specializations`, `default_modalities`.
- Tabela `students` → `clients`. Todos os FKs renomeados em cascata.
- Tabela `exercises.modality` muda de `enum[]` para `text[]` aberto.
- Nova tabela `modalities_catalog` para autocomplete e ranking de popularidade.
- Novas tabelas `workout_creation_conversations` e `ai_chat_messages` para persistir estado do chat de criação.
- Tabela `workouts` ganha `created_via`, `ai_conversation_id`, `version`.
- Anamnese `client_id` sem NOT NULL no fluxo de treino — anamnese é independente.
- Endpoints `/personals/*` → `/professionals/*`; `/students/*` → `/clients/*`; `/ai/workouts/generate` substituído por `/ai/workout-chat/*` (start, message, authorize, refine, discard).
- System prompt da IA reescrito para reconhecer múltiplas formações profissionais.
- Granularidade do `ai_usage_log` muda de "chamada" para "conversa".

**Mudanças de roadmap**

- MVP estendido de **22-24 semanas** para **28-30 semanas** (~7 meses).
- Adicionado Sprint 3 dedicado a "Cliente + Anamnese opcional".
- Sprint 6-7 totalmente novo: "Chat conversacional para criação de treino".
- Sprint 1-2 ganha validação de múltiplos conselhos.
- Sprint 4-5 inclui modalidade como campo aberto.
- Custo de OpenAI no estimado mensal sobe de US$ 15-50 para US$ 30-80 (chat multi-turn usa ~2x mais tokens).

**O que NÃO mudou**

- Stack técnica (React Native + Next.js + Fastify + Supabase + Cloudflare R2/Stream + Mercado Pago).
- Modelo de monetização SaaS B2B (preços R$ 49/99/199 mantidos).
- UX do Player Reels e integração com SmartWatch.
- Princípios LGPD e arquitetura de segurança.
- Princípios técnicos da IA (Bompa, Issurin, ACSM, SBME) — apenas estendidos para reabilitação.

### v1.0 — Maio/2026

Versão inicial do PRD após brainstorm de produto. Cobertura: 13 seções (negócio + técnica), MVP de 22-24 semanas, foco em personal trainer com CREF, anamnese acoplada à criação do treino, 3 módulos fixos (Academia / Funcional / Casa).

---

**Fim do PRD v1.1.**
