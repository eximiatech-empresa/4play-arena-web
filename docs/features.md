# Features por Role

Cada feature é um vertical slice em `src/features/<role>/<domínio>/`. Contém `components/` e `hooks/` próprios. Componentes importam apenas de seus hooks, de `core/entities/` e de `components/`.

---

## Admin

### `/painel` — Painel Executivo

**Rota:** `app/painel/`
**Feature:** `features/admin/dashboard/`

KPIs em tempo real (pacotes vendidos, ocupação, cancelamentos, receita estimada) e agenda do dia com todas as aulas. Dados lidos diretamente do Firestore via `use-admin-dashboard.ts`.

**Hook:** `use-admin-dashboard.ts`
- Queries: `admin-transactions`, `lessons` do dia, `users` (alunos)
- Funções: `getAdminTransactions()` de `lib/firebase/admin-transactions.ts`

---

### `/admin-lessons` — Gestão de Aulas

**Rota:** `app/admin-lessons/`
**Feature:** `features/admin/aulas/`

Criar aulas (avulsa ou recorrente), visualizar grade por dia, gerenciar chamada de presença (marcar presente/ausente por aluno).

**Componentes:**
- `admin-lessons-content.tsx` — grade por dia com day selector
- `create-lesson-modal.tsx` — formulário de criação (RHF + `CreateLessonSchema`)
- `day-detail-modal.tsx` — lista de alunos inscritos + chamada

**Hooks:**
- `use-admin-lessons.ts` — CRUD de aulas, leitura por data
- `use-attendance-manager.ts` — marcar presente/ausente, finalizar aula

---

### `/admin-plans` — Planos e Pacotes

**Rota:** `app/admin-plans/`
**Feature:** `features/admin/planos/`

CRUD de planos de assinatura e pacotes extras de Plays.

**Componentes:**
- `plan-form-modal.tsx` — criar/editar plano
- `package-form-modal.tsx` — criar/editar pacote
- `delete-confirm-dialog.tsx` — confirmação de exclusão

**Hooks:** `use-admin-plans.ts`
- Mutations: `useCreatePlan`, `useUpdatePlan`, `useDeletePlan`
- Mutations: `useCreatePlayPackage`, `useUpdatePlayPackage`, `useDeletePlayPackage`
- `usePlayPackages` re-exportado de `features/shared/planos-data/`

---

### `/users-management` — Usuários

**Rota:** `app/users-management/`
**Feature:** `features/admin/usuarios/`

Listagem de todos os usuários. Operações: ativar/desativar, alterar nível (aluno), editar preço de aula (professor), criar novos usuários (TEACHER ou ADMIN).

**Componentes:**
- `users-management-content.tsx` — tabela com filtros
- `users-details-modal.tsx` — detalhes e ações por usuário
- `create-user-modal.tsx` — formulário de criação

**Hooks:**
- `use-users.ts` — listagem com `getAllUsers()`, mutações de status e role
- `use-students.ts` — listagem filtrada de alunos

---

## Professor

### `/class-management` — Chamada por Aula

**Rota:** `app/class-management/`
**Feature:** `features/teacher/gestao/`

Professor visualiza suas aulas do dia e marca presença/ausência de alunos inscritos.

**Componentes:**
- `class-management-content.tsx` — lista de aulas do dia
- `class-management-modal.tsx` — chamada de alunos por aula

**Hook:** `use-class-management.ts`
- Busca aulas do professor por data
- `markStudentAttendance()` de `lib/firebase/booking.ts`

---

### `/gestao-turma` — Turma

**Rota:** `app/gestao-turma/`
**Feature:** `features/teacher/turma/`

Professor gerencia a lista de alunos titulares e reservas de sua turma fixa.

**Componente:** `teacher-roster-content.tsx`
**Hook:** `use-teacher-class.ts`
- Lê/escreve `teacherClasses/{teacherId}` via `getTeacherClass` / `upsertTeacherClass`

---

### `/carteira-professor` — Carteira do Professor

**Rota:** `app/carteira-professor/`
**Feature:** `features/teacher/carteira/`

Extrato de ganhos do professor: saldo atual, histórico de transações, insights (top alunos, comparativo mensal, ganho anual).

**Componente:** `teacher-wallet-page-content.tsx`
**Hook:** `use-teacher-wallet.ts`

---

### `/historico-professor` — Histórico de Aulas

**Rota:** `app/historico-professor/`
**Feature:** `features/teacher/historico/`

Lista de todas as aulas ministradas (finalizadas ou canceladas) com contagem de presentes, ausentes e ganho total.

**Componente:** `teacher-history.tsx`
**Hook:** `use-teacher-history.ts`
- `getTeacherLessonHistory(teacherId)` de `lib/firebase/booking.ts`

---

## Aluno

### `/dashboard` — Dashboard

**Rota:** `app/dashboard/`
**Feature:** `features/student/dashboard/`

Próximas aulas do aluno com contagem de inscritos.

**Componente:** `upcoming-lessons-section.tsx`
**Hook:** `use-dashboard.ts`

---

### `/aulas` — Grade de Aulas

**Rota:** `app/aulas/`
**Feature:** `features/student/aulas/`

Grade de aulas disponíveis com filtros, check-in e cancelamento.

**Componentes:**
- `lessons-page-content.tsx` — layout principal com view toggle (grid/list)
- `lesson-details-modal.tsx` — detalhes e botão de check-in/cancelamento
- `cancel-confirmation-modal.tsx` — confirmação de cancelamento
- `student-history.tsx` — histórico de aulas do aluno

**Hooks:**
- `use-lessons.ts` — fetch de aulas por dia/semana com filtros
- `use-lesson-cancel-flow.ts` — cancelamento de inscrição
- `use-lesson-card-state.ts` — estado do card (check-in disponível, custo, status)
- `use-lesson-filters.ts` — filtros de professor e nível
- `use-lesson-grid-animation.ts` — animações GSAP da grade
- `use-student-history.ts` — histórico de aulas passadas

---

### `/carteira` — Carteira do Aluno

**Rota:** `app/carteira/`
**Feature:** `features/student/carteira/`

Saldo de Plays, métricas (consumo médio, dias restantes), histórico de transações e recarga via pacotes extras.

**Componentes:**
- `wallet-page-content.tsx` — layout principal
- `balance-hero.tsx` — saldo em destaque
- `metric-cards.tsx` — consumo médio, dias até expiração
- `transaction-list.tsx` — histórico de transações
- `recharge-section.tsx` — pacotes extras disponíveis para compra

**Hook:** `use-wallet.ts`

---

### `/plano` — Assinatura

**Rota:** `app/plano/`
**Feature:** `features/student/plano/`

Plano ativo do aluno e histórico de assinaturas.

**Componentes:**
- `payment-modal.tsx` — confirmar compra de plano
- `subscription-history.tsx` — histórico de assinaturas

**Hook:** `use-subscription.ts`

---

## Shared

### `/perfil` — Perfil

**Rota:** `app/perfil/`
**Feature:** `features/shared/perfil/`

Edição de dados pessoais (nome, telefone) e troca de senha. Compartilhado entre STUDENT e TEACHER.

**Componente:** `profile-page-content.tsx`
**Hooks:** `use-update-profile.ts`, `use-change-password.ts`

---

### Auth

**Feature:** `features/shared/auth/`

Páginas de login, cadastro, onboarding e force-password-change.

**Componentes:** `login-page-content.tsx`, `register-page-content.tsx`, `force-password-change-content.tsx`
**Hooks:** `use-onboarding.ts`, `use-force-password-change.ts`, `use-teachers.ts`

---

### Shared Planos Data

**Feature:** `features/shared/planos-data/`

Hooks de leitura de planos e pacotes extras. Compartilhados entre features sem duplicação.

| Hook | Query Key | Descrição |
|---|---|---|
| `usePlans()` | `["plans"]` | Lista de planos do Firestore |
| `usePlayPackages()` | `["play-packages"]` | Lista de pacotes extras |

---

### Debug

**Feature:** `features/debug/`

Ferramentas de desenvolvimento (role switcher para testar diferentes papéis, terminal interno com logs). Presente apenas em ambiente de desenvolvimento.
