# Entidades do Domínio

Todos os schemas Zod vivem em `src/core/entities/`. A camada de infraestrutura (`lib/firebase/`) importa daqui — nunca define contratos de domínio localmente. Leituras do Firestore usam `Schema.safeParse()` + `flatMap` para descartar documentos inválidos silenciosamente.

> **Próximo passo:** quando todas as entidades estiverem estabilizadas, migrar para uma pasta `src/core/schema/`.

---

## User (`core/entities/user.ts`)

Coleção Firestore: `users`

Union discriminada por `role`:

### BaseUser (campos comuns)

| Campo | Tipo | Observação |
|---|---|---|
| `uid` | `string` | ID do Firebase Auth |
| `name` | `string` | Nome completo |
| `email` | `string` | E-mail válido |
| `role` | `"ADMIN" \| "TEACHER" \| "STUDENT"` | – |
| `createdAt` | `string` | ISO 8601 |
| `isActive` | `boolean` | Padrão `true` |
| `mustChangePassword` | `boolean` | Padrão `false` |
| `phone` | `string \| null \| undefined` | Opcional |

### AdminUser

Somente campos base com `role = "ADMIN"`.

### TeacherUser

Campos base +

| Campo | Tipo | Observação |
|---|---|---|
| `lessonPrice` | `number` | Taxa base de Plays por aula |
| `earningsBalance` | `number` | Saldo de ganhos em R$ |

### StudentUser

Campos base +

| Campo | Tipo | Observação |
|---|---|---|
| `level` | `string` | Nível de jogo (padrão: "Iniciante") |
| `walletBalance` | `number` | Saldo de Plays |
| `originalTeacherId` | `string` | Professor principal |
| `currentPlanId` | `string` | ID do plano ativo |
| `planExpiresAt` | `string` | ISO 8601 |
| `planPlayValue` | `number?` | Valor monetário do Play (legado) |

### UserSummary

View-model de listagem admin (leitura lenient com `.catch()`):

`uid`, `name`, `email`, `role`, `isActive`, `level?`, `walletBalance?`, `lessonPrice?`, `earningsBalance?`, `createdAt?`, `planExpiresAt?`

---

## Lesson (`core/entities/lesson.ts`)

### LessonDocument

Coleção Firestore: `lessons`

| Campo | Tipo | Observação |
|---|---|---|
| `id` | `string` | – |
| `professorId` | `string` | UID do professor |
| `professorName` | `string` | Desnormalizado |
| `level` | `string` | Nível da aula |
| `levelIndex` | `number` | 0–6 para ordenação |
| `dateTime` | `string` | ISO 8601 |
| `court` | `string` | Quadra |
| `totalSpots` | `number` | Vagas totais |
| `enrolledStudentIds` | `string[]` | Alunos inscritos |
| `checkedInStudentIds` | `string[]` | Presença confirmada |
| `absentStudentIds` | `string[]` | Marcados ausentes |
| `status` | `"scheduled" \| "finished" \| "cancelled"` | – |
| `titularIds` | `string[]` | Titulares da turma |
| `reservaIds` | `string[]` | Reservas |
| `wasRescheduled` | `boolean` | Reagendada após inscrições |
| `cancellationReason` | `string \| null?` | Motivo do cancelamento |
| `rescheduledToId` | `string?` | ID da nova aula (reagendamento) |
| `rescheduledFromId` | `string?` | ID da aula original |
| `professorBasePlays` | `number?` | Snapshot da taxa do professor |
| `professorRoundingRule` | `"round" \| "ceil"?` | Snapshot da regra |
| `professorSharePct` | `number?` | % do professor (0–1) |
| `arenaSharePct` | `number?` | % da arena (0–1) |
| `description` | `string?` | Descrição livre |

### Lesson (View Model)

Campos do `LessonDocument` +

| Campo | Tipo | Observação |
|---|---|---|
| `enrolledCount` | `number` | Calculado |
| `isEnrolled` | `boolean` | Para o aluno atual |
| `checkInStatus` | `CheckInStatus` | Estado da janela |
| `previewConsumption` | `number` | Plays a ser debitados |
| `isPeak` | `boolean` | Horário de pico? |
| `isReserva` | `boolean` | Aluno é reserva? |

### LessonGridTemplate

Coleção Firestore: `configs/lessonGrid` (documento de configuração estático)

Campos de template da grade semanal: `dayOfWeek`, `brtHour`, `court`, `professorId`, `professorName`, `level`, `levelIndex`, `totalSpots`, `titularIds`, `reservaIds`, `description?`

---

## Wallet & Transaction (`core/entities/wallet.ts`)

Coleção Firestore: `transactions`

### Transaction

| Campo | Tipo | Observação |
|---|---|---|
| `id` | `string` | – |
| `walletId` | `string` | UID do aluno |
| `studentId` | `string` | UID do aluno |
| `lessonId` | `string \| null` | null para créditos avulsos |
| `type` | `TransactionType` | Ver abaixo |
| `amount` | `number` | Negativo para débitos |
| `balanceAfter` | `number` | Saldo após transação |
| `professorName` | `string \| null` | – |
| `classLevel` | `string \| null` | – |
| `isPeak` | `boolean \| null?` | Horário de pico? |
| `isReserva` | `boolean \| null?` | Aluno era reserva? |
| `playValue` | `number \| null?` | Valor monetário do Play |
| `createdAt` | `string` | ISO 8601 |

**TransactionType:** `"debit" | "credit" | "expiration" | "adjustment" | "purchase" | "package"`

---

## TeacherWallet & TeacherTransaction (`core/entities/teacher-wallet.ts`)

Coleção Firestore: `teacher_transactions`

### TeacherTransaction

| Campo | Tipo | Observação |
|---|---|---|
| `id` | `string` | – |
| `teacherId` | `string` | UID do professor |
| `studentId` | `string` | – |
| `studentName` | `string?` | Desnormalizado |
| `lessonId` | `string \| null?` | – |
| `type` | `TeacherTransactionType` | Ver abaixo |
| `amount` | `number` | Crédito em R$ |
| `playsConsumed` | `number?` | Plays debitados do aluno |
| `playValue` | `number?` | Valor monetário do Play |
| `rsBruto` | `number?` | Receita bruta do check-in |
| `arenaCredit` | `number?` | Parte da arena em R$ |
| `createdAt` | `string` | ISO 8601 |

**TeacherTransactionType:** `"CHECK_IN_CREDIT" | "LATE_CANCELLATION_CREDIT" | "EXPIRED_PLAN_TRANSFER"`

---

## PlanConfig (`core/entities/plan-config.ts`)

Coleção Firestore: `plans`

| Campo | Tipo |
|---|---|
| `id` | `string` |
| `label` | `string` |
| `totalPlays` | `number` (inteiro positivo) |
| `validityDays` | `number` (inteiro positivo) |
| `priceInCents` | `number` (inteiro positivo) |
| `playValue` | `number` (positivo) |
| `popular` | `boolean?` |

---

## PlayPackage (`core/entities/play-package.ts`)

Coleção Firestore: `play-packages`

| Campo | Tipo |
|---|---|
| `id` | `string` |
| `label` | `string` |
| `plays` | `number` (inteiro positivo) |
| `priceInCents` | `number` (inteiro positivo) |
| `popular` | `boolean?` |

---

## TeacherClass (`core/entities/teacher-class.ts`)

Coleção Firestore: `teacherClasses` (um documento por professor, `id = teacherId`)

| Campo | Tipo | Observação |
|---|---|---|
| `teacherId` | `string` | UID do professor |
| `titularIds` | `string[]` | UIDs dos alunos titulares |
| `reservaIds` | `string[]` | UIDs dos alunos reserva |
| `classSize` | `number` | Vagas fixas (padrão: 4) |
| `updatedAt` | `string?` | ISO 8601, atualizado no upsert |

---

## SubscriptionDocument (`core/entities/subscription.ts`)

Coleção Firestore: `subscriptions`

| Campo | Tipo |
|---|---|
| `id` | `string` |
| `studentId` | `string` |
| `planId` | `string` |
| `status` | `"active" \| "trialing" \| "past_due" \| "canceled"` |
| `currentPeriodStart` | `string` |
| `currentPeriodEnd` | `string` |
| `cancelAtPeriodEnd` | `boolean` |
| `provider` | `string` |
| `autoRenew` | `boolean` |
| `cardBrand` | `string?` |
| `cardLast4` | `string?` (regex `/^\d{4}$/`) |
| `startedAt` | `string` |
| `nextBillingDate` | `string?` |
| `canceledAt` | `string?` |
| `createdAt` | `string` |
| `updatedAt` | `string` |

---

## Notification (`core/entities/notification.ts`)

Coleção Firestore: `notifications`

| Campo | Tipo |
|---|---|
| `id` | `string` |
| `userId` | `string` |
| `type` | `"lesson_cancelled" \| "lesson_rescheduled" \| "lesson_finished"` |
| `title` | `string?` |
| `message` | `string` |
| `lessonId` | `string` |
| `read` | `boolean` |
| `createdAt` | `string` |

---

## AuditLogDocument (`core/entities/audit-log.ts`)

Coleção Firestore: `audit_logs`

| Campo | Tipo | Observação |
|---|---|---|
| `id` | `string` | – |
| `type` | `"level_change"` | Literal |
| `actorId` | `string` | Quem executou a ação |
| `actorName` | `string` | Desnormalizado |
| `targetId` | `string` | Aluno afetado |
| `targetName` | `string` | Desnormalizado |
| `previousValue` | `string` | Nível anterior |
| `newValue` | `string` | Novo nível |
| `createdAt` | `string` | ISO 8601 |

---

## AttendanceStudent / AttendanceSummary (`core/entities/attendance.ts`)

View-models de chamada. Não persistidos no Firestore.

| Schema | Campos |
|---|---|
| `AttendanceStudent` | `id`, `name`, `status: "present" \| "absent" \| "pending"` |
| `AttendanceSummary` | `presentCount`, `absentCount`, `pendingCount` |

---

## Schemas de Auth (`core/entities/auth.ts`)

Schemas de formulário — não persistidos como documentos Firestore.

| Schema | Uso |
|---|---|
| `LoginSchema` | Formulário de login |
| `RegisterSchema` | Cadastro de aluno |
| `OnboardingSchema` | Fluxo de onboarding (nome + plano + professor) |
| `PasswordChangeSchema` | Troca de senha (mín. 6 chars, maiúscula, número) |
