# Schema do Firestore

Mapeamento de todas as coleções e seus campos. Para os schemas Zod completos, veja [entities.md](./entities.md).

> Todas as leituras usam `Schema.safeParse()` — documentos que falham na validação são silenciosamente descartados com `flatMap`.

---

## `users`

Um documento por usuário. `id = uid do Firebase Auth`.

```
users/{uid}
  uid: string
  name: string
  email: string
  role: "ADMIN" | "TEACHER" | "STUDENT"
  isActive: boolean
  mustChangePassword: boolean
  createdAt: string (ISO)
  phone?: string

  // STUDENT apenas:
  level: string
  walletBalance: number
  originalTeacherId: string
  currentPlanId: string
  planExpiresAt: string (ISO)
  planPlayValue?: number       ← legado; usar wallet.playValue quando possível

  // TEACHER apenas:
  lessonPrice: number
  earningsBalance: number
```

---

## `lessons`

Uma documento por aula agendada ou histórica.

```
lessons/{lessonId}
  id: string
  professorId: string
  professorName: string
  level: string
  levelIndex: number (0-6)
  dateTime: string (ISO)
  court: string
  totalSpots: number
  enrolledStudentIds: string[]
  checkedInStudentIds: string[]
  absentStudentIds: string[]
  titularIds: string[]
  reservaIds: string[]
  status: "scheduled" | "finished" | "cancelled"
  wasRescheduled: boolean
  description?: string
  cancellationReason?: string | null
  rescheduledToId?: string
  rescheduledFromId?: string

  // Snapshot de precificação (desnormalizado na criação)
  professorBasePlays?: number
  professorRoundingRule?: "round" | "ceil"
  professorSharePct?: number
  arenaSharePct?: number
```

---

## `transactions`

Transações de Plays do aluno (débitos, créditos, recargas).

```
transactions/{txId}
  id: string
  walletId: string          ← uid do aluno
  studentId: string
  lessonId: string | null
  type: "debit" | "credit" | "expiration" | "adjustment" | "purchase" | "package"
  amount: number            ← negativo para débitos
  balanceAfter: number
  professorName: string | null
  classLevel: string | null
  isPeak?: boolean | null
  isReserva?: boolean | null
  playValue?: number | null
  createdAt: string (ISO)

  // Legado (documentos antigos):
  isOffPeak?: boolean | null
```

---

## `teacher_transactions`

Créditos de receita do professor por check-in.

```
teacher_transactions/{txId}
  id: string
  teacherId: string
  studentId: string
  studentName?: string
  lessonId?: string | null
  type: "CHECK_IN_CREDIT" | "LATE_CANCELLATION_CREDIT" | "EXPIRED_PLAN_TRANSFER"
  amount: number            ← crédito em R$
  playsConsumed?: number
  playValue?: number
  rsBruto?: number
  arenaCredit?: number
  createdAt: string (ISO)
```

---

## `plans`

Planos de assinatura configuráveis pelo admin.

```
plans/{planId}
  id: string              ← ex: "mensal", "trimestral", "semestral"
  label: string
  totalPlays: number
  validityDays: number
  priceInCents: number
  playValue: number
  popular?: boolean
```

---

## `play-packages`

Pacotes extras de Plays (add-on sem alterar plano ativo).

```
play-packages/{packageId}
  id: string
  label: string
  plays: number
  priceInCents: number
  popular?: boolean
```

---

## `teacherClasses`

Um documento por professor com a turma fixa (titulares e reservas).

```
teacherClasses/{teacherId}
  teacherId: string
  titularIds: string[]
  reservaIds: string[]
  classSize: number         ← padrão: 4
  updatedAt?: string (ISO)
```

---

## `subscriptions`

Assinaturas de plano dos alunos.

```
subscriptions/{subscriptionId}
  id: string
  studentId: string
  planId: string
  status: "active" | "trialing" | "past_due" | "canceled"
  currentPeriodStart: string (ISO)
  currentPeriodEnd: string (ISO)
  cancelAtPeriodEnd: boolean
  provider: string
  autoRenew: boolean
  cardBrand?: string
  cardLast4?: string        ← 4 dígitos
  startedAt: string (ISO)
  nextBillingDate?: string (ISO)
  canceledAt?: string (ISO)
  createdAt: string (ISO)
  updatedAt: string (ISO)
```

---

## `notifications`

Notificações push para alunos (aula cancelada, reagendada, finalizada).

```
notifications/{notifId}
  id: string
  userId: string
  type: "lesson_cancelled" | "lesson_rescheduled" | "lesson_finished"
  title?: string
  message: string
  lessonId: string
  read: boolean
  createdAt: string (ISO)
```

---

## `audit_logs`

Logs de auditoria de ações administrativas (ex: alteração de nível).

```
audit_logs/{logId}
  id: string
  type: "level_change"
  actorId: string
  actorName: string
  targetId: string
  targetName: string
  previousValue: string
  newValue: string
  createdAt: string (ISO)
```

---

## `configs/lessonGrid`

Documento único (sub-coleção `configs`, doc `lessonGrid`). Grade semanal configurada pelo admin.

```
configs/lessonGrid
  entries: LessonGridTemplate[]  ← array de templates

  // Cada LessonGridTemplate:
  dayOfWeek: number (1=Seg, 7=Dom)
  brtHour: number (0-23)
  court: string
  professorId: string
  professorName: string
  level: string
  levelIndex: number
  totalSpots: number
  titularIds: string[]
  reservaIds: string[]
  description?: string
```

---

## Índices compostos necessários

| Coleção | Campos | Tipo | Usado em |
|---|---|---|---|
| `lessons` | `dateTime` | ASC | getLessonsByDate |
| `teacher_transactions` | `teacherId`, `type` | – | getTeacherLessonHistory |
| `transactions` | `studentId`, `type` | – | getStudentLessonHistory |
| `audit_logs` | `createdAt` | DESC | getRecentAuditLogs |

> Índices criados automaticamente pelo Firestore na primeira query que os exige, ou via `firestore.indexes.json`.
