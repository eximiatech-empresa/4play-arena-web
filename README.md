# 4Play Arena — Hora Carteira

Sistema de gestão de créditos de horas (Plays) para aulas de tênis. Alunos mantêm um saldo de Plays que é consumido ao confirmar presença em aulas. O consumo é calculado dinamicamente com base em três fatores: **professor**, **plano do aluno** e **horário da aula**.

---

## Stack

| Camada | Tecnologia | Versão |
|---|---|---|
| Framework | Next.js (App Router) | 16.2.1 |
| Linguagem | TypeScript | 5+ |
| Banco de Dados / Auth | Firebase / Firestore | 12+ |
| Estilização | Tailwind CSS v4 | 4+ |
| Componentes UI | shadcn/ui (radix-nova, zinc base) | – |
| Ícones | lucide-react · react-icons | – |
| Server state | TanStack Query | v5 |
| Formulários | React Hook Form + @hookform/resolvers | v7 |
| Validação | Zod | v4 |
| Datas | date-fns · react-day-picker | – |
| Gráficos | Recharts | v3 |
| Animações | GSAP | v3 |
| Toasts | Sonner | v2 |
| Temas | next-themes | – |
| Testes | Vitest | v4 |

> **Nota Tailwind v4:** Não existe `tailwind.config.*`. Toda a configuração (tokens, dark mode) vive em `app/globals.css` via `@theme {}`. Dark mode é ativado pela classe `.dark`. Importe componentes com `@import`, não com `@tailwind`.

---

## Comandos

```bash
npm run dev          # Servidor de desenvolvimento
npm run build        # Build de produção
npm run start        # Iniciar servidor de produção
npm run lint         # ESLint
npm run test         # Vitest
npm run seed:plans   # Popular coleção `plans` no Firestore
```

---

## Regras de Negócio

### Moeda: Plays (não Reais)

Após a compra do plano, o sistema opera em **Plays**, não em R$. Cada Play tem um valor monetário fixado no momento da compra (`playValue`) e não muda durante a vigência do plano.

### Cálculo de Consumo

O consumo de uma aula depende de três variáveis:

1. **Professor** — taxa base em Plays (ex: Paulinho: 0.90 Play/aula, Marília: 1.35 Play/aula)
2. **Horário** — desconto off-peak de ×0.95 para aulas antes das 18h ou após 20h
3. **Titularidade** — alunos *reserva* (não titulares) pagam +10%

### Arredondamento

| Professor | Regra |
|---|---|
| Marília | Sempre arredonda para **cima** (ceiling) |
| Demais | Arredondamento matemático padrão |

### Acesso e Check-in

- **Level gate:** nível do aluno ≥ nível da aula para poder se inscrever
- **T−24h:** abertura exclusiva para alunos titulares da turma
- **T−6h:** vagas ociosas liberadas para qualquer aluno elegível

### Planos

Planos são documentos Firestore (coleção `plans`). Os planos estáticos de referência (`PLAN_CONFIGS`) são mantidos em `core/constants/plan-pricing.ts`.

| ID | Label | Plays | Validade | Preço | Play Value |
|---|---|---|---|---|---|
| `mensal` | Mensal | 80 | 30 dias | R$ 410 | R$ 5,125 |
| `trimestral` | Trimestral | 240 | 90 dias | R$ 1.140 | R$ 4,75 |
| `semestral` | Semestral | 480 | 180 dias | R$ 2.070 | R$ 4,3125 |

---

## Arquitetura de Pastas

```
src/
├── app/                        # Roteamento Next.js (App Router, flat routing)
│   ├── actions/                # Server Actions (Next.js)
│   ├── layout.tsx              # Layout raiz (providers, fonts)
│   ├── page.tsx                # Redirect para /login ou /dashboard
│   │
│   ├── login/                  # Autenticação — STUDENT · TEACHER · ADMIN
│   ├── register/               # Cadastro de aluno
│   ├── force-password-change/  # Troca obrigatória de senha
│   │
│   ├── dashboard/              # Painel do aluno (próximas aulas)
│   ├── aulas/                  # Grade de aulas disponíveis + check-in
│   ├── carteira/               # Carteira do aluno (saldo, transações, recarga)
│   ├── historico/              # Histórico de aulas do aluno
│   ├── plano/                  # Assinatura e histórico de planos
│   ├── perfil/                 # Perfil compartilhado (STUDENT · TEACHER)
│   │
│   ├── class-management/       # Professor — gerenciar chamada por aula
│   ├── carteira-professor/     # Professor — ganhos e transações
│   ├── historico-professor/    # Professor — histórico de aulas ministradas
│   ├── gestao-turma/           # Professor — turma titular + reserva
│   │
│   ├── painel/                 # Admin — painel executivo (KPIs, agenda, logs)
│   ├── admin-lessons/          # Admin — criar e gerenciar aulas
│   ├── admin-plans/            # Admin — planos e pacotes de Plays extras
│   └── users-management/       # Admin — usuários, níveis, ativação
│
├── components/
│   ├── ui/                     # Componentes shadcn/ui (add: npx shadcn add <c>)
│   ├── layout/                 # Shell do dashboard, Sidebar
│   └── shared/                 # Componentes compartilhados entre roles
│
├── core/                       # Domínio puro — sem React, sem Firebase
│   ├── entities/               # Schemas Zod + tipos TypeScript (fonte de verdade)
│   │   ├── attendance.ts       # AttendanceStudent, AttendanceSummary
│   │   ├── audit-log.ts        # AuditLogDocument
│   │   ├── auth.ts             # Login, Register, Onboarding, PasswordChange
│   │   ├── lesson.ts           # LessonDocument, Lesson, LessonGridTemplate
│   │   ├── notification.ts     # Notification
│   │   ├── plan-config.ts      # PlanConfig (documento Firestore `plans`)
│   │   ├── play-package.ts     # PlayPackage (documento Firestore `play-packages`)
│   │   ├── subscription.ts     # SubscriptionDocument
│   │   ├── teacher-class.ts    # TeacherClass (documento Firestore `teacherClasses`)
│   │   ├── teacher-wallet.ts   # TeacherTransaction, TeacherWallet, insights
│   │   ├── user.ts             # AdminUser, TeacherUser, StudentUser, UserSummary
│   │   └── wallet.ts           # Transaction, Wallet
│   │
│   ├── math/                   # Funções puras e testáveis (motor de regras)
│   │   ├── consumption.ts      # Cálculo base de Plays por aula
│   │   ├── financial-engine.ts # Receita do professor e arena por check-in
│   │   ├── resolve-play-value.ts # Resolução do playValue com fallbacks em cadeia
│   │   ├── wallet-math.ts      # Operações de saldo
│   │   ├── wallet-balance.ts   # Métricas de carteira
│   │   ├── booking-rules.ts    # Janelas T-24h / T-6h
│   │   ├── lesson-eligibility.ts # Level gate + disponibilidade
│   │   ├── lesson-display.ts   # Labels e badges de aula para UI
│   │   ├── attendance-calculator.ts # Contadores de presença/ausência
│   │   ├── teacher-insights.ts # Insights de alunos do professor
│   │   ├── teacher-stats.ts    # Estatísticas mensais do professor
│   │   └── operational-radar.ts # KPIs do painel executivo admin
│   │
│   ├── mappers/                # Transformam dados brutos do Firestore em view models
│   │   ├── lesson.mapper.ts    # Firestore doc → Lesson (com campos computados)
│   │   ├── lesson-history.mapper.ts  # doc → LessonHistoryEntry
│   │   └── teacher-history.mapper.ts # doc → TeacherLessonHistoryEntry
│   │
│   ├── usecases/               # Casos de uso (orquestração de regras de domínio)
│   │   ├── booking/            # check-in, check-out
│   │   ├── lessons/            # create-lesson
│   │   ├── wallet/             # purchase-plan, purchase-package, wallet-metrics
│   │   ├── subscriptions/      # cancel-subscription
│   │   └── admin-plans/        # validate-plan-form, validate-package-form
│   │
│   ├── constants/              # Constantes de domínio
│   │   ├── plan-pricing.ts     # PLAN_CONFIGS (valores de referência estáticos)
│   │   ├── professors.ts       # Mapa de professores e taxas base
│   │   ├── booking-rules.ts    # Janelas de check-in em ms
│   │   ├── lesson-labels.ts    # Labels de nível e status
│   │   └── recharge-packages.ts # Pacotes de recarga disponíveis
│   │
│   ├── errors/                 # Erros de domínio
│   │   ├── erros.ts            # Mensagens de erro (strings)
│   │   ├── exceptions.ts       # Exceções tipadas (classes de erro)
│   │   └── failure.ts          # Tipo de resultado Failure
│   │
│   └── services/
│       └── expiration-service.ts # Lógica de expiração de planos
│
├── features/                   # Vertical slices por papel (role-based)
│   ├── admin/
│   │   ├── aulas/              # Criar/editar aulas, chamada de presença
│   │   ├── dashboard/          # KPIs, agenda do dia, logs de auditoria
│   │   ├── planos/             # CRUD de planos e pacotes extras
│   │   └── usuarios/           # Listagem, ativação, nível, criação de usuários
│   │
│   ├── teacher/
│   │   ├── gestao/             # Chamada por aula (marcar presente/ausente)
│   │   ├── turma/              # Gerenciar titulares e reservas da turma
│   │   ├── carteira/           # Extrato de ganhos do professor
│   │   ├── historico/          # Histórico de aulas ministradas
│   │   └── dashboard/          # Visão geral do professor
│   │
│   ├── student/
│   │   ├── aulas/              # Grade de aulas, check-in, cancelamento
│   │   ├── carteira/           # Saldo, transações, recarga de pacotes
│   │   ├── dashboard/          # Próximas aulas
│   │   ├── historico/          # (via aulas/student-history)
│   │   └── plano/              # Assinatura ativa e histórico
│   │
│   ├── shared/
│   │   ├── auth/               # Login, register, onboarding, troca de senha
│   │   ├── perfil/             # Edição de perfil (compartilhado entre roles)
│   │   ├── dashboard/          # Componentes de dashboard compartilhados
│   │   └── planos-data/        # Hooks de leitura de planos e pacotes (shared)
│   │
│   └── debug/                  # DevTools internos (role switcher, terminal)
│
└── lib/                        # Infraestrutura (Firebase, Auth, utilitários)
    ├── firebase/               # Repositórios Firestore por coleção
    │   ├── app.ts              # Inicialização do Firebase
    │   ├── firestore.ts        # Users CRUD, getAllUsers, db export
    │   ├── booking.ts          # Lessons, check-in/out, cancel, finish, reschedule
    │   ├── admin-lessons.ts    # Queries de aulas para admin
    │   ├── admin-transactions.ts # Queries de transações para admin (KPIs)
    │   ├── audit-logs.ts       # Logs de auditoria
    │   ├── plans.ts            # CRUD de planos
    │   ├── play-packages.ts    # CRUD de pacotes extras
    │   ├── subscription.ts     # Assinaturas do aluno
    │   ├── teacher-class.ts    # Turma do professor (titulares/reservas)
    │   ├── teacher-wallet.ts   # Carteira e transações do professor
    │   ├── transactions.ts     # Transações do aluno
    │   ├── users.ts            # Operações específicas de usuário
    │   ├── auth.ts             # Firebase Auth wrapper
    │   └── functions.ts        # Chamadas a Cloud Functions
    │
    ├── firebase-admin/         # Firebase Admin SDK (server-side)
    │
    ├── auth/                   # Camada de autenticação
    │   ├── firebase.ts         # Cliente Firebase Auth
    │   ├── login-service.ts    # Login + resolução de redirect por role
    │   ├── password-service.ts # Troca de senha
    │   ├── types.ts            # Tipos de auth
    │   └── index.ts            # Barrel export (authService)
    │
    ├── notifications/
    │   └── notifications-service.ts # Leitura de notificações do usuário
    │
    ├── utils/
    │   └── date.ts             # Formatadores de data (BRT-aware)
    │
    └── utils.ts                # cn() helper (clsx + tailwind-merge)
```

---

## Coleções Firestore

| Coleção | Entidade | Arquivo de entidade |
|---|---|---|
| `users` | `User` (discriminated union por role) | `core/entities/user.ts` |
| `lessons` | `LessonDocument` | `core/entities/lesson.ts` |
| `transactions` | `Transaction` | `core/entities/wallet.ts` |
| `teacher_transactions` | `TeacherTransaction` | `core/entities/teacher-wallet.ts` |
| `plans` | `PlanConfig` | `core/entities/plan-config.ts` |
| `play-packages` | `PlayPackage` | `core/entities/play-package.ts` |
| `teacherClasses` | `TeacherClass` | `core/entities/teacher-class.ts` |
| `subscriptions` | `SubscriptionDocument` | `core/entities/subscription.ts` |
| `notifications` | `Notification` | `core/entities/notification.ts` |
| `audit_logs` | `AuditLogDocument` | `core/entities/audit-log.ts` |
| `configs/lessonGrid` | `LessonGridTemplate` | `core/entities/lesson.ts` |

> Todos os documentos Firestore são validados com `ZodSchema.safeParse()` ao serem lidos — nunca com cast direto (`as Type`).

---

## Roles e Rotas

| Role | Rotas de acesso | Redirect pós-login |
|---|---|---|
| `STUDENT` | `/dashboard`, `/aulas`, `/carteira`, `/historico`, `/plano`, `/perfil` | `/dashboard` |
| `TEACHER` | `/class-management`, `/carteira-professor`, `/historico-professor`, `/gestao-turma`, `/perfil` | `/class-management` |
| `ADMIN` | `/painel`, `/admin-lessons`, `/admin-plans`, `/users-management` | `/painel` |

---

## Padrões de Engenharia

### Entidades como Fonte de Verdade

Todos os schemas Zod vivem em `core/entities/`. A camada de infraestrutura (`lib/firebase/`) importa os schemas do domínio — nunca os define localmente. Isso garante que mudanças no contrato do Firestore se propagam automaticamente para toda a aplicação.

### Lógica de Negócio em `core/math/`

Funções como `calculateCheckinRevenue()` e `resolvePlayValue()` são funções puras (sem efeitos colaterais, sem dependências de framework). Qualquer lógica financeira ou de regras de negócio deve estar aqui — não em componentes React nem em repositórios Firestore.

### Features como Vertical Slices por Role

Cada feature é organizada por papel do usuário (`admin/`, `teacher/`, `student/`, `shared/`). Dentro de cada slice: `components/` + `hooks/` + opcionalmente `utils/`, `constants/`, `schemas/`. Lógica compartilhada entre roles fica em `shared/`.

### React Query como Única Fonte de Estado Remoto

Nenhum componente faz fetch direto. Todos os dados remotos passam por hooks TanStack Query. Query keys são constantes exportadas dos hooks (`ADMIN_PLANS_KEY`, `PLAY_PACKAGES_QUERY_KEY`) para garantir invalidação correta entre features.

---

## Desenvolvimento

### Adicionar componente shadcn/ui

```bash
npx shadcn add <component>
```

### Variáveis de ambiente

Crie `.env.local` na raiz com as chaves Firebase:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=
```

### Popular planos no Firestore

```bash
npm run seed:plans
```
