# 4Play Arena — System Design & Study Guide

> Elaborado com base na análise dos arquivos `blueprint.md`, `project.md`, `CLAUDE.md` e da árvore completa do `src/`.

---

## 1. 🏗️ VISÃO ARQUITETURAL E MODELO MENTAL

### O Problema que a Arquitetura Resolve

Antes de falar de pastas, entenda o *porquê* das escolhas. O 4Play Arena tem dois mundos que precisam ser rigorosamente separados:

1. **O mundo dos cálculos** — matemática de horas que nunca muda: desconto de off-peak, arredondamento Marília, hierarquia de níveis. É lógica de negócio pura.
2. **O mundo da apresentação** — React, hooks, queries, animações, UI. Muda com frequência, depende de ambiente.

A arquitetura existe para que o mundo 1 *nunca* contamine o mundo 2 — e vice-versa.

### A Divisão Fundamental: Domínio vs. Entrega

```
┌─────────────────────────────────────────────────────────────┐
│                        NAVEGADOR                            │
│  src/app/   →   src/features/   →   src/components/         │
│  (Rotas)        (Fatias Verticais)  (UI Reutilizável)       │
└──────────────────────────┬──────────────────────────────────┘
                           │ importa de baixo para cima
┌──────────────────────────▼──────────────────────────────────┐
│                     DOMÍNIO (src/core/)                     │
│   entities/ ←→ math/ ←→ constants/                         │
│   Zero React. Zero Next.js. Zero Supabase.                  │
└─────────────────────────────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                  INFRAESTRUTURA (src/lib/)                   │
│   Adaptadores: Supabase, Auth (mock ↔ real)                 │
└─────────────────────────────────────────────────────────────┘
```

**A regra de ouro da dependência:** As camadas de cima importam das de baixo. Nunca o contrário. O `core/` não sabe que o Next.js existe.

### Next.js como Plataforma de Entrega, Não como Framework de Negócio

O App Router do Next.js tem dois papéis neste projeto:

**Frontend (React):**
`app/dashboard/page.tsx` é um Server Component que não faz nada além de renderizar um Client Component de feature. É um *thin wrapper* — uma folha em branco que delega para `features/`.

**Backend Seguro (API Routes):**
`app/api/checkin/route.ts` (a implementar) será onde a regra de negócio *executa com autoridade*. O fluxo planejado é:

```
Cliente → POST /api/checkin
             ↓
         Valida JWT (Supabase middleware)
             ↓
         Valida payload (Zod schema de core/entities/)
             ↓
         Executa calculateConsumption() (core/math/)
             ↓
         Debita wallet (Supabase transaction)
             ↓
         Retorna resultado
```

O ponto crítico: `calculateConsumption()` roda *tanto no servidor* (API route, onde tem autoridade real) *quanto no cliente* (preview no modal, para mostrar o custo antes do check-in). Isso só é possível porque a função é pura — sem dependências de ambiente.

### Vertical Slices: `src/features/` vs. `src/core/`

**`src/core/`** é horizontal — serve a todos. É a gramática do negócio.

**`src/features/`** é vertical — cada pasta é uma fatia completa de uma funcionalidade, com seus próprios components, hooks, mock-data e utils, sem depender de outros features.

```
features/
├── booking/           ← Fatia de "Aulas"
│   ├── components/    ← UI específica desta feature
│   ├── hooks/         ← Data fetching desta feature
│   └── mock-data.ts   ← Dados que serão substituídos por Supabase
├── wallet/            ← Fatia de "Carteira"
│   ├── components/
│   ├── hooks/
│   └── utils/         ← Lógica de apresentação (não de domínio)
└── profile/           ← Fatia de "Perfil"
```

A vantagem: quando você deletar `features/wallet/`, o resto do app não quebra. Quando o Supabase for integrado, você substitui `mock-data.ts` por um hook real sem tocar em nada mais.

---

## 2. 🧠 O CORE DOMAIN — O Motor do Negócio

### A Carteira de Horas como Conceito Central

O modelo de negócio é uma *tokenização de tempo*. O aluno compra um plano em reais, mas o ativo que recebe são horas. Essas horas são consumidas a taxas variáveis. Isso é o que torna o domínio não-trivial e justifica um `core/` dedicado.

### Dissecação dos Artefatos de Domínio

**Entidades (`core/entities/`) — O que o sistema conhece**

São schemas Zod que definem a forma e as invariantes dos dados. A escolha do Zod é deliberada: o mesmo schema valida dados de entrada (API routes) e infere tipos TypeScript (uso em componentes). Um schema, dois propósitos.

```typescript
// core/entities/lesson.ts
export const LessonSchema = z.object({
  levelIndex: z.number().int().min(0).max(6), // invariante: 7 níveis, não mais
  checkInStatus: CheckInStatusSchema,          // tipo discriminado, não string livre
  previewConsumption: z.number().nonnegative(),// invariante: nunca negativo
})
```

`CheckInStatus` é um exemplo de *Objeto de Valor* em DDD: não tem identidade própria, é definido pelos seus valores, e o conjunto de valores possíveis é fechado (`z.enum`).

**Constantes (`core/constants/professors.ts`) — O que nunca muda sem decisão de negócio**

A tabela de professores × planos × consumo. Se Marília aumentar o preço, muda aqui. Nenhum componente codifica `1.50` em seu JSX — eles buscam de `PROFESSORS`.

**Serviços de Domínio (`core/math/`) — O que o sistema sabe fazer**

Aqui está a lógica mais importante do projeto. São funções puras — dado o mesmo input, sempre o mesmo output, sem efeitos colaterais:

```typescript
// Lê-se como um pipeline de transformação:
calculateConsumption({ professorId, plan, date })
  → getProfessorById(professorId)          // busca tabela
  → professor.consumption[plan]            // seleciona base
  → isOffPeak(date) ? base * 0.95 : base  // aplica multiplicador
  → professor.isPremium                    // seleciona arredondamento
    ? Math.ceil(x * 100) / 100            // Marília: teto
    : Math.round(x * 100) / 100           // demais: padrão
```

`isOffPeak`, `calculateConsumption`, `isLevelEligible`, `getCheckInStatus` e `computeLessonEligibility` são a alma do sistema. São testáveis com Jest sem precisar montar nenhum componente React.

### Por que `computeLessonEligibility` pertence ao `core/`?

Antes de ser extraída, essa função estava no componente `LessonDetailsModal`. Isso violava dois princípios:

1. **SRP** — o componente respondia pela lógica de elegibilidade *e* pela renderização
2. **Testabilidade** — você não consegue testar a regra "saldo insuficiente bloqueia check-in" sem renderizar um modal

Agora em `core/math/lesson-eligibility.ts`, ela é uma função pura com um contrato claro:

```typescript
computeLessonEligibility(lesson, studentLevelIndex, walletBalance)
→ { spotsLeft, hasSpot, isLevelBlocked, hasBalance, isDone, isActionable }
```

---

## 3. 📂 DISSECAÇÃO DOS MÓDULOS E PASTAS

### Mapa de Responsabilidades

```
src/
├── app/                    ROTEAMENTO E ENTREGA
├── core/                   DOMÍNIO PURO
├── features/               FATIAS VERTICAIS
├── components/             UI REUTILIZÁVEL
│   ├── ui/                 PRIMITIVOS (shadcn)
│   └── shared/             COMPOSTOS CROSS-FEATURE
├── lib/                    ADAPTADORES DE INFRAESTRUTURA
├── hooks/                  HOOKS GLOBAIS
├── utils/                  FORMATADORES PUROS
└── types/                  CONTRATOS TYPESCRIPT GLOBAIS
```

---

### `src/app/` — Roteamento, Nada Mais

**Responsabilidade:** Definir rotas, layouts, metadata e delegar para features.

**O que você verá em cada `page.tsx`:**

```tsx
// app/dashboard/page.tsx
import { DashboardPageContent } from "@/features/dashboard"
export default function Page() { return <DashboardPageContent /> }
```

Dois imports, uma linha de JSX. Isso é intencional.

**Nunca coloque aqui:**
- Lógica de negócio (`if (balance < consumption)`)
- Chamadas diretas ao Supabase
- Estado local de componente (`useState`, `useEffect`)
- Componentes com mais de ~10 linhas de JSX

**Por que layouts por rota em vez de route groups?**
A estrutura atual tem `app/dashboard/layout.tsx`, `app/aulas/layout.tsx` etc. (sem `(dashboard)/`). Isso foi uma decisão arquitetural deliberada: cada rota declara explicitamente seu próprio `DashboardShell`, tornando o nesting de layouts óbvio ao ler o arquivo — sem mágica implícita de grupos.

---

### `src/core/` — O Coração Imutável

**Responsabilidade:** Expressar o negócio em código livre de dependências externas.

**Regra de dependência:** `core/` só importa de `core/`. Nunca de `features/`, `lib/`, `components/` ou qualquer pacote com efeitos colaterais.

**Nunca coloque aqui:**
- `import { useEffect } from 'react'` — qualquer coisa React
- `import { createClient } from '@supabase/supabase-js'`
- Lógica de formatação visual (`toLocaleDateString`, `toFixed` para exibição)
- Chamadas de API ou fetch

**O teste do `core/`:** Você deve conseguir rodar todos os arquivos de `core/` com Node.js puro, sem Next.js, sem browser, sem variáveis de ambiente.

---

### `src/features/` — Fatias Verticais

**Responsabilidade:** Implementar uma capability completa do produto — da UI ao acesso a dados — de forma autocontida.

**Estrutura interna de uma feature:**

```
features/booking/
├── components/          ← UI que só existe nesta feature
│   ├── lesson-card.tsx
│   ├── lesson-details-modal.tsx
│   └── lessons-page-content.tsx
├── hooks/
│   └── use-lessons.ts   ← TanStack Query: fetch + mutations
├── mock-data.ts         ← Substituído por hook real no Supabase
└── index.ts             ← Barrel export: o contrato público da feature
```

**A regra de cruzamento entre features:** Features não importam umas das outras. Se `dashboard` precisa mostrar aulas, ele usa o componente `LessonCard` *exportado* de `booking/index.ts` (contrato público), nunca importa direto de `booking/components/lesson-card.tsx`.

**Nunca coloque aqui:**
- Lógica de cálculo matemático (pertence a `core/math/`)
- Schemas Zod de entidades (pertencem a `core/entities/`)
- Componentes que são usados por mais de uma feature (pertencem a `components/shared/`)

---

### `src/components/shared/` — Compostos Cross-Feature

**Responsabilidade:** Componentes React que são reutilizados por duas ou mais features, mas que têm comportamento (não são primitivos).

Exemplos: `Sidebar` (conhece rotas, usuário, tema), `LevelBadge` (conhece a hierarquia de níveis), `DashboardShell` (compõe layout + sidebar).

**Diferença de `components/ui/`:**
`ui/` contém primitivos agnósticos de domínio (`Button`, `Input`, `Dialog`). `shared/` contém componentes que conhecem o domínio do 4Play Arena.

**Nunca coloque aqui:**
- Componentes que pertencem a uma única feature (ficam em `features/xxx/components/`)
- Lógica de negócio — no máximo consumo de `core/` para derivar props visuais

---

### `src/lib/` — Adaptadores de Infraestrutura

**Responsabilidade:** Implementar interfaces que isolam o código de aplicação de fornecedores externos.

O exemplo mais sofisticado do projeto é `lib/auth/`:

```
lib/auth/
├── types.ts     ← IAuthService: o contrato que NUNCA muda
├── mock.ts      ← Implementação fake para desenvolvimento
└── index.ts     ← Ponto de troca: exporta authService
```

`index.ts` faz:

```typescript
export const authService: IAuthService = process.env.NODE_ENV === 'test'
  ? new MockAuthService()
  : supabaseAuthAdapter   // a implementar
```

Quando o Supabase for integrado, você cria `lib/auth/supabase.ts` implementando `IAuthService` e muda *uma linha* em `index.ts`. O resto do app não sabe da diferença — `use-auth.ts` chama `authService.signIn()`, não importa quem implementa.

**Nunca coloque aqui:**
- Componentes React
- Lógica de negócio (regras de consumo, elegibilidade)
- Schemas de entidades

---

### `src/utils/` — Formatadores de Apresentação

**Responsabilidade:** Transformações puras de dados para exibição — sem estado, sem efeitos.

```typescript
// utils/formatters.ts
formatCurrency(449)     → "R$ 449,00"
formatDate(isoString)   → "sáb., 5 de abr."
formatHours(8.5)        → "8,5h"
```

**Diferença de `core/math/`:**
`core/math/` calcula. `utils/` formata para humanos. `calculateConsumption` retorna `0.855`. `formatHours(0.855)` retorna `"0,85h"`. São responsabilidades distintas.

---

## 4. 🛡️ PADRÕES SOLID E CLEAN CODE APLICADOS

### S — Single Responsibility Principle

**Onde ver:** Cada arquivo tem exatamente uma razão para mudar.

| Arquivo | Muda quando |
|---|---|
| `consumption.ts` | A regra de cálculo muda |
| `LessonCard` | O design do card muda |
| `use-lessons.ts` | A estratégia de fetching muda |
| `professors.ts` | A tabela de preços muda |

**Violação evitada:** Antes de extrair `computeLessonEligibility`, o `LessonDetailsModal` tinha duas responsabilidades — calcular elegibilidade *e* renderizar o modal. O code-reviewer identificou isso como violação de SRP.

### O — Open/Closed Principle

**Onde ver:** `IAuthService` em `lib/auth/types.ts`.

O sistema está *fechado para modificação* (você não toca nos callers) mas *aberto para extensão* (você adiciona `SupabaseAuthAdapter implements IAuthService`). Os hooks `useLogin` e `useRegister` continuam idênticos.

### L — Liskov Substitution Principle

**Onde ver:** `MockAuthService` e o futuro `SupabaseAuthAdapter` são intercambiáveis porque ambos satisfazem `IAuthService`. Você pode substituir um pelo outro sem que nenhum teste quebre.

### I — Interface Segregation Principle

**Onde ver:** `IAuthService` declara apenas os métodos necessários (`signInWithPassword`, `signUp`, `signOut`, `getUser`). Não há um `IService` genérico com dezenas de métodos irrelevantes.

### D — Dependency Inversion Principle

**Onde ver:** A camada de aplicação (`hooks/use-auth.ts`) depende da abstração `IAuthService`, não de `@supabase/supabase-js` diretamente. O detalhe (Supabase) é injetado via `lib/auth/index.ts`.

```
hooks/use-auth.ts
    ↓ depende de
lib/auth/types.ts (IAuthService)  ← abstração
    ↑ implementado por
lib/auth/mock.ts | lib/auth/supabase.ts  ← detalhe
```

### Clean Code Aplicado

**Funções puras e nomes expressivos:**

```typescript
isOffPeak(date)               // lê-se como inglês
isLevelEligible(student, cls) // revela intenção
getCheckInStatus(...)         // retorna o que o nome promete
```

**Sem números mágicos:**

```typescript
// ❌ if (hour >= 18 && hour < 20)

// ✅
const PEAK_WINDOW = { startHour: 18, endHour: 20 }
if (hour < PEAK_WINDOW.startHour || hour >= PEAK_WINDOW.endHour)
```

**Barrel exports como API pública:**
`features/booking/index.ts` exporta apenas o que outras partes do app podem consumir. Implementações internas ficam ocultas — encapsulamento no nível de módulo.

---

## 5. 🗺️ TRILHA DE ESTUDOS — Do Coração para a Superfície

A regra da trilha: sempre leia de baixo (domínio) para cima (UI). Entenda o "o quê" antes do "como mostrar".

---

### Passo 1 — O Negócio (2–3h)

**Leia em ordem:**

```
project.md                          ← Entenda a regra de negócio em português
blueprint.md                        ← Veja como ela se transforma em código
src/core/constants/professors.ts    ← A tabela de preços como código
src/core/entities/lesson.ts         ← O que é uma Aula para o sistema
src/core/entities/wallet.ts         ← O que é uma Carteira
src/core/math/consumption.ts        ← O motor de cálculo
src/core/math/lesson-eligibility.ts ← As regras de acesso ao check-in
```

> **Pergunta para se fazer:** "Se eu precisar testar a regra do arredondamento da Marília, o que eu importo e como?"

---

### Passo 2 — Os Adaptadores (1–2h)

**Leia em ordem:**

```
src/lib/auth/types.ts    ← O contrato IAuthService
src/lib/auth/mock.ts     ← A implementação fake
src/lib/auth/index.ts    ← O ponto de troca
src/hooks/use-auth.ts    ← Como hooks consomem a interface
```

> **Pergunta para se fazer:** "O que muda quando Supabase for integrado? O que *não* muda?"

---

### Passo 3 — As Fatias Verticais (2–3h)

**Leia uma feature completa, da base para o topo:**

```
src/features/booking/mock-data.ts          ← Dados de exemplo (shape real)
src/features/booking/hooks/use-lessons.ts  ← TanStack Query: fetch + mutation
src/features/booking/components/lesson-card.tsx
src/features/booking/components/lesson-details-modal.tsx  ← mais complexo
src/features/booking/index.ts              ← API pública da feature
```

> **Pergunta para se fazer:** "Quando o Supabase for integrado, qual arquivo muda? Qual não muda?"

---

### Passo 4 — O Roteamento (1h)

**Leia em ordem:**

```
src/app/layout.tsx                ← Root layout + FOUT script
src/app/dashboard/layout.tsx      ← DashboardShell
src/app/dashboard/page.tsx        ← Thin wrapper (2 linhas)
src/app/aulas/page.tsx            ← Outro thin wrapper
```

> **Perceba:** pages são propositalmente vazias. A complexidade está nas features.

---

### Passo 5 — A UI Compartilhada (1–2h)

**Leia em ordem:**

```
src/components/ui/button.tsx           ← CVA: variantes como tipos
src/components/ui/dialog.tsx           ← showClose prop: extensão sem modificação
src/components/shared/level-badge.tsx  ← Componente que conhece o domínio
src/components/shared/sidebar.tsx      ← GSAP + estado de tema + navegação
src/app/globals.css                    ← Design tokens OKLch + tema laranja
```

---

### Passo 6 — O Dashboard como Síntese (1h)

O `DashboardPageContent` é o arquivo que *usa tudo*: importa de `core/`, de `features/`, de `components/shared/`. Leia-o por último para ver como as peças se encaixam.

```
src/features/dashboard/components/dashboard-page-content.tsx
src/features/dashboard/components/upcoming-lessons-section.tsx
```

---

### Mapa Visual da Trilha

```
Semana 1                    Semana 2                    Semana 3
──────────────────────────────────────────────────────────────────
core/constants/             lib/auth/ (IAuthService)    app/ (rotas)
core/entities/          →   hooks/use-auth.ts       →   components/shared/
core/math/                  features/booking/           dashboard (síntese)
```

---

### Sinais de que você entendeu a arquitetura

**Teste 1 — Novo professor:**
Quando alguém pedir para adicionar "Rafael" com consumo `1.20h` e arredondamento padrão, você saberá que o **único** lugar a editar é `core/constants/professors.ts`. Nenhum componente, hook ou page precisa mudar. O `calculateConsumption` passará a calcular corretamente para Rafael automaticamente.

**Teste 2 — Migração para Supabase:**
Quando chegar a hora de integrar o banco real, você saberá que:

1. Cria `lib/auth/supabase.ts` implementando `IAuthService`
2. Substitui `mock-data.ts` nas features por hooks que chamam Supabase
3. O `core/` não toca em nada
4. Os componentes não sabem da diferença

Esse isolamento não é burocracia — é o que permite que o projeto cresça sem que a complexidade cresça junto.
