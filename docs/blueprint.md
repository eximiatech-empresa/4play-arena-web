# 4Play Arena — Blueprint de Desenvolvimento

## Visão Geral

Plataforma de gestão de aulas de tênis baseada em uma **Carteira de Horas** dinâmica. O diferencial é o Motor de Cálculo que determina o custo de cada aula em horas, não em reais, com base em três variáveis: Professor × Plano do Aluno × Horário.

---

## Stack Tecnológica

| Camada | Tecnologia | Versão |
|---|---|---|
| Framework | Next.js (App Router) | 16.2.x |
| Linguagem | TypeScript | 5.x |
| Banco / Auth | Supabase (PostgreSQL + JWT + RLS) | — |
| Estilização | Tailwind CSS v4 | 4.x |
| Componentes | shadcn/ui (radix-nova, zinc base) | — |
| Validação | Zod | 4.x |
| Formulários | React Hook Form + @hookform/resolvers | 7.x / 5.x |
| Server State | TanStack Query | 5.x |
| Ícones | lucide-react | 1.x |

---

## Arquitetura (DDD + Vertical Slices)

```
src/
├── app/                          # Roteamento Next.js (App Router)
│   ├── (auth)/                   # Rotas não autenticadas (URL invisível)
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (dashboard)/              # Rotas protegidas (URL invisível)
│   │   ├── layout.tsx            # Layout com sidebar
│   │   └── dashboard/
│   │       ├── page.tsx          # Visão geral (Wallet + Aulas + Histórico)
│   │       └── _components/      # Componentes privados da rota
│   └── api/
│       └── checkin/route.ts      # POST /api/checkin (a implementar)
├── core/                         # DOMÍNIO — puro, sem React/Next
│   ├── constants/
│   │   └── professors.ts         # Tabela de preços, níveis, planos
│   ├── math/
│   │   └── consumption.ts        # calculateConsumption(), isOffPeak(), getCheckInStatus()
│   └── entities/
│       ├── auth.ts               # Zod: LoginSchema, RegisterSchema
│       ├── wallet.ts             # Zod: WalletSchema, TransactionSchema
│       └── lesson.ts             # Zod: LessonSchema, CheckInStatusSchema
├── features/                     # Vertical Slices por domínio
│   ├── wallet/mock-data.ts       # → será substituído por hooks Supabase
│   ├── booking/mock-data.ts      # → será substituído por hooks Supabase
│   └── profile/mock-data.ts      # → será substituído por hooks Supabase
├── lib/
│   ├── auth/
│   │   ├── types.ts              # IAuthService interface (espelha Supabase Auth)
│   │   ├── mock.ts               # Mock implementation
│   │   └── index.ts              # Ponto de troca: mock → Supabase
│   └── utils.ts                  # cn() — clsx + tailwind-merge
├── hooks/
│   └── use-auth.ts               # useLogin(), useRegister() (React Query mutations)
├── components/
│   ├── ui/                       # Componentes base (shadcn-style)
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   └── label.tsx
│   ├── shared/                   # Componentes reutilizáveis entre features
│   │   ├── auth-brand-panel.tsx  # Painel verde das telas de auth
│   │   ├── sidebar.tsx           # Navegação lateral do dashboard
│   │   └── level-badge.tsx       # Badge de nível do aluno
│   └── providers.tsx             # QueryClientProvider
├── types/                        # Tipos TypeScript globais
└── utils/                        # Formatadores (data, moeda)
```

---

## Regras de Negócio Core

### Motor de Cálculo (`core/math/consumption.ts`)

```
C_final = round(C_base × multiplier)

multiplier:
  peak (18h–20h)    → 1.00 (sem desconto)
  off-peak          → 0.95 (5% de desconto)

round:
  Marília (isPremium) → Math.ceil(x * 100) / 100
  Demais              → Math.round(x * 100) / 100
```

### Tabela de Consumo Base (`core/constants/professors.ts`)

| Professor | Mensal | Trimestral | Semestral | Regra |
|---|---|---|---|---|
| Paulinho | 0.90h | 0.85h | 0.80h | Padrão |
| Biel | 1.05h | 1.00h | 0.95h | Padrão |
| Pepe | 1.10h | 1.05h | 1.00h | Padrão |
| Marília | 1.50h | 1.42h | 1.35h | **Teto** |

### Planos

| Plano | Horas | Preço | Validade |
|---|---|---|---|
| Mensal | 8h | R$ 449 | 30 dias |
| Trimestral | 24h | R$ 1.269 | 90 dias |
| Semestral | 48h | R$ 2.369 | 180 dias |

### Check-in Timeline

```
T - 24h → Abre para alunos titulares (enrolled_only)
T - 6h  → Abre para todos os elegíveis (open / mar aberto)
T + 0   → Encerrado (closed)
```

### Hierarquia de Níveis

`Principiante < Iniciante < Nível D < Nível C < Nível B < Nível A < Profissional`

Regra: `student.levelIndex >= class.levelIndex` para inscrição.

---

## Fases de Desenvolvimento

### Fase 1 — Foundation (COMPLETO)
- [x] Setup Next.js 16 + src/ structure
- [x] Tailwind v4 + shadcn/ui configurados
- [x] Design tokens: brand green palette
- [x] DDD folder structure

### Fase 2 — Auth UI (COMPLETO)
- [x] Telas de Login e Cadastro (split layout)
- [x] IAuthService interface (Supabase-compatible)
- [x] Mock auth service com seed user
- [x] useLogin / useRegister hooks (React Query)

### Fase 3 — Dashboard (COMPLETO)
- [x] Sidebar com navegação
- [x] Wallet card com progress circular
- [x] Próximas aulas com check-in mock
- [x] Histórico de transações
- [x] Level card com hierarquia visual
- [x] Core math functions (calculateConsumption, isOffPeak, getCheckInStatus)
- [x] Entidades Zod (Wallet, Lesson, Professor)
- [x] Constantes de professores e planos

### Fase 4 — Backend (A FAZER)
- [ ] Supabase setup (ver docs/supabase-integration.md)
- [ ] Schema + migrações (profiles, wallets, lessons, enrollments, transactions)
- [ ] RLS policies
- [ ] `POST /api/checkin` route (valida, calcula, debita)
- [ ] `POST /api/wallet/recharge` route
- [ ] Supabase auth adapter (substituir mock)

### Fase 5 — Features Completas (A FAZER)
- [ ] Página de Carteira (/wallet): histórico completo, compra de plano
- [ ] Página de Aulas (/lessons): filtros, busca, todas as aulas disponíveis
- [ ] Página de Perfil (/profile): dados pessoais, nível, histórico
- [ ] Confirmação de presença pelo professor (admin view)
- [ ] Expiração automática de horas (cron/edge function)
- [ ] Notificações de check-in

### Fase 6 — Polish (A FAZER)
- [ ] Testes unitários do core/math (Jest)
- [ ] Middleware de autenticação (Next.js middleware.ts)
- [ ] Loading skeletons
- [ ] Error boundaries
- [ ] PWA (manifest, service worker para check-in offline)

---

## API Endpoints Planejados

| Método | Rota | Descrição |
|---|---|---|
| POST | /api/checkin | Valida elegibilidade, calcula consumo, debita wallet |
| POST | /api/wallet/recharge | Processa compra de plano, credita horas |
| GET | /api/lessons | Lista aulas disponíveis com status de check-in |
| PATCH | /api/lessons/[id]/confirm | Professor confirma presença (admin) |

---

## Variáveis de Ambiente

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=   # Apenas server-side (API routes)
```

---

## Padrões de Código

- **Business math:** SEMPRE em `core/math/` — nunca em componentes ou API routes
- **Validação:** Zod schemas em `core/entities/` — validar na entrada das API routes
- **Data fetch:** Hooks customizados via TanStack Query — componentes nunca chamam Supabase diretamente
- **Auth:** Toda interação via `authService` de `lib/auth/index.ts`
- **Estilos:** `cn()` para composição de classes — nunca concatenação de strings
