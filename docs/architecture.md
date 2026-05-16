# Decisões de Arquitetura

## Princípio Central: Clean Architecture

O projeto segue Clean Architecture com três camadas bem separadas:

```
┌─────────────────────────────┐
│  Apresentação                │  components/, features/ (React, Next.js)
│  Infraestrutura              │  lib/firebase/, lib/auth/
├─────────────────────────────┤
│  Aplicação                   │  core/usecases/
├─────────────────────────────┤
│  Domínio (Core)              │  core/entities/, core/math/, core/mappers/
└─────────────────────────────┘
```

**Regra de dependência:** camadas internas não conhecem as externas. `core/` não importa de `lib/` nem de `features/`. `lib/` importa de `core/`. `features/` importa de `lib/` e `core/`.

---

## Domínio Puro em `core/`

`core/` não contém nenhuma dependência de React, Next.js ou Firebase. É JavaScript/TypeScript puro, testável com Vitest sem mocks.

### `core/entities/`

Schemas Zod como fonte de verdade para todos os contratos de dados. Regra: se um dado existe no Firestore, existe uma entidade Zod aqui.

**Por que Zod e não só TypeScript interfaces?**
- TypeScript types são apagados em runtime. Zod valida em runtime.
- Dados do Firestore entram como `unknown`. Sem Zod, um campo ausente ou mal-tipado chega silenciosamente na UI.
- `.safeParse()` permite descartar documentos corrompidos sem quebrar a listagem.

### `core/math/`

Funções puras. Sem efeitos colaterais. Sem dependências de framework. Entram dados, saem dados.

**Exemplos:**
- `consumption.ts` — cálculo de Plays por aula
- `financial-engine.ts` — split de receita professor/arena
- `resolve-play-value.ts` — resolução do playValue com fallback em cadeia
- `lesson-eligibility.ts` — level gate + janela de check-in
- `operational-radar.ts` — KPIs do painel executivo

### `core/mappers/`

Transformam documentos Firestore crus (com Timestamps, campos extras, campos faltando) em view-models limpos para a UI. Não fazem chamadas ao banco.

---

## Features como Vertical Slices por Role

Cada feature é uma unidade fechada com seus próprios `components/` e `hooks/`. Organização por papel do usuário (`admin/`, `teacher/`, `student/`, `shared/`) em vez de por tipo técnico (todos os hooks juntos, todos os componentes juntos).

**Consequência:** para entender "como funciona a carteira do aluno", você abre `features/student/carteira/` e encontra tudo que precisa.

### Hierarquia de imports dentro de features

```
features/*/components/*.tsx
  → features/*/hooks/*.ts         (estado remoto via React Query)
  → core/entities/                (tipos)
  → lib/firebase/                 (via hooks, nunca direto do componente)
  → components/ui/                (shadcn/ui)
  → components/shared/            (componentes compartilhados)
```

Componentes nunca importam de `lib/firebase/` diretamente. Sempre via hook.

---

## React Query como Única Fonte de Estado Remoto

Nenhum componente usa `useEffect + fetch`. Todo dado remoto passa por `useQuery` ou `useMutation`.

**Query keys como constantes exportadas:**
```typescript
export const ADMIN_PLANS_KEY = ["admin-plans"] as const
export const PLAY_PACKAGES_QUERY_KEY = ["play-packages"] as const
```

Isso garante que `invalidateQueries` após uma mutação acerte o cache certo em qualquer feature que consuma aquele dado.

**Regra anti-duplicação:** se dois lugares precisam do mesmo dado, um hook compartilhado vive em `features/shared/planos-data/hooks/` e é importado pelos dois. Nunca defina o mesmo `useQuery` duas vezes.

---

## Validação Firestore: safeParse + flatMap

Padrão adotado em todas as leituras:

```typescript
return snap.docs.flatMap((d) => {
  const result = EntitySchema.safeParse({ id: d.id, ...d.data() })
  return result.success ? [result.data] : []
})
```

**Por que `flatMap` e não `filter`?**
- `flatMap` com array vazio descarta o item sem necessidade de predicado de tipo.
- Documentos corrompidos ou incompletos são silenciosamente ignorados — a lista não quebra.
- Em caso de dados críticos (onde um documento inválido deveria ser reportado), o `console.warn` pode ser adicionado no branch `!result.success`.

**Proibido:** `d.data() as SomeType`. Isso é um cast que silencia o TypeScript mas não valida o runtime.

---

## Routing: Flat (sem Route Groups)

O projeto usa roteamento flat no App Router. Não há `(auth)/` ou `(dashboard)/` como grupos de rota. O controle de acesso é feito por middleware ou redirect no layout.

**Rotas existentes:**
```
/login, /register, /force-password-change   ← autenticação
/dashboard, /aulas, /carteira, /historico   ← aluno
/plano, /perfil                              ← aluno + professor
/class-management, /carteira-professor      ← professor
/historico-professor, /gestao-turma         ← professor
/painel, /admin-lessons, /admin-plans       ← admin
/users-management                            ← admin
```

---

## Tailwind CSS v4

Não existe `tailwind.config.*`. Toda configuração de design tokens vive em `app/globals.css`:

```css
@import "tailwindcss";

@theme {
  --color-primary: oklch(...);
  /* ... */
}
```

Dark mode via classe `.dark` no `<html>`, gerenciado pelo `next-themes`.

---

## Firebase Auth + Firestore (não Supabase)

O projeto tem dependências do Supabase no `package.json` (resquício de versão anterior), mas **toda a autenticação e persistência usa Firebase**.

- Auth: `lib/auth/firebase.ts` — wrapper sobre `firebase/auth`
- Firestore: `lib/firebase/*.ts` — um arquivo por coleção/domínio
- Admin SDK: `lib/firebase-admin/` — para operações server-side (Server Actions)

---

## Princípios SOLID no Contexto React

| Princípio | Aplicação |
|---|---|
| **S** — Single Responsibility | Cada hook tem uma responsabilidade. Componentes apenas renderizam — não fazem fetch. |
| **O** — Open/Closed | Novos professores e regras de arredondamento: estende `core/constants/professors.ts`, não modifica o motor. |
| **L** — Liskov Substitution | Componentes shadcn/ui aceitam todos os props HTML nativos. |
| **I** — Interface Segregation | Componentes recebem apenas os campos que consomem, não o objeto inteiro. |
| **D** — Dependency Inversion | Componentes dependem de hooks (abstrações), não de Firebase diretamente. |
