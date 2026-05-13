import {
  doc,
  collection,
  runTransaction,
  writeBatch,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  arrayUnion,
  arrayRemove,
  increment,
} from "firebase/firestore"
import { db } from "./firestore"
import { mapRawDocToLesson } from "@/core/mappers/lesson.mapper"
import { mapRawDocToLessonHistory } from "@/core/mappers/lesson-history.mapper"
import { mapRawDocToTeacherHistory } from "@/core/mappers/teacher-history.mapper"
import {
  UserNotFoundError,
  LessonNotFoundError,
  LessonFullError,
  AlreadyEnrolledError,
  InsufficientBalanceError,
} from "@/core/errors/exceptions"
import { ERROS } from "@/core/errors/erros"
import { PLAN_CONFIGS } from "@/core/constants/plan-pricing"
import { calculateCheckinRevenue } from "@/core/math/financial-engine"
import type { Lesson } from "@/core/entities/lesson"
import type { LessonHistoryEntry, TeacherLessonHistoryEntry } from "@/core/entities/lesson"
import type { Transaction, Plan } from "@/core/entities/wallet"

export async function getLessons(
  studentId: string,
  plan: Plan,
  filters?: { professorId?: string; level?: string },
): Promise<Lesson[]> {
  const now = new Date();
  const lessonsRef = collection(db, "lessons");

  const hasFilter = !!(filters?.professorId || filters?.level);
  const whereConstraints = [];
  if (filters?.professorId) whereConstraints.push(where("professorId", "==", filters.professorId));
  if (filters?.level) whereConstraints.push(where("level", "==", filters.level));

  const q = hasFilter
    ? query(lessonsRef, ...whereConstraints)
    : query(lessonsRef, orderBy("dateTime", "asc"));

  const snap = await getDocs(q);

  const lessons = snap.docs.flatMap((d) => {
    // "finished" lessons are historical; all other statuses are shown with visual badges
    if (d.data().status === "finished") return [];
    const lesson = mapRawDocToLesson(d.id, d.data() as Record<string, unknown>, studentId, plan, now);
    return lesson ? [lesson] : [];
  });

  return hasFilter
    ? lessons.sort((a, b) => a.dateTime.localeCompare(b.dateTime))
    : lessons;
}

export async function getLessonsByDate(dateStr: string, studentId: string, plan: Plan): Promise<Lesson[]> {
  const now = new Date();

  const startPrefix = `${dateStr}T`;
  const endPrefix = `${dateStr}U`;

  const snap = await getDocs(
    query(
      collection(db, "lessons"),
      where("dateTime", ">=", startPrefix),
      where("dateTime", "<", endPrefix),
      orderBy("dateTime"),
    ),
  );

  console.log(`📊 Encontrados ${snap.docs.length} documentos no Firestore`);

  return snap.docs.flatMap((d) => {
    const data = d.data();

    if (data.status === "finished") return [];

    const lesson = mapRawDocToLesson(d.id, d.data() as Record<string, unknown>, studentId, plan, now);

    if (!lesson) {
      console.error(`❌ Falha ao validar schema da aula ${d.id}.`);
      return [];
    }

    return [lesson];
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

// Student enrollment: deducts plays and adds to enrolledStudentIds only.
// Teacher check-in (marking attendance) is handled by updateStudentAttendance.
//
// Uses runTransaction so the read of the professor's lessonPrice and all balance
// writes are atomic — no window for a concurrent update to produce inconsistent state.
export async function processCheckIn(
  studentId: string,
  lessonId: string,
  playsCost: number,   // previewConsumption — used as fallback if professor has no lessonPrice
  professorName: string,
  classLevel: string,
  isPeak: boolean,
  isReserva: boolean,
): Promise<void> {
  const userRef    = doc(db, "users", studentId)
  const lessonRef  = doc(db, "lessons", lessonId)

  await runTransaction(db, async (tx) => {
    // ── 1. Reads (must all precede writes in a Firestore transaction) ─────────
    const [userSnap, lessonSnap] = await Promise.all([
      tx.get(userRef),
      tx.get(lessonRef),
    ])

    if (!userSnap.exists())   throw new UserNotFoundError(ERROS.USUARIO_NAO_ENCONTRADO)
    if (!lessonSnap.exists()) throw new LessonNotFoundError(ERROS.AULA_NAO_ENCONTRADA)

    const lessonData = lessonSnap.data()

    if ((lessonData.enrolledStudentIds?.length ?? 0) >= lessonData.totalSpots)
      throw new LessonFullError(ERROS.AULA_LOTADA)
    if (lessonData.enrolledStudentIds?.includes(studentId))
      throw new AlreadyEnrolledError(ERROS.JA_INSCRITO)

    const professorRef  = doc(db, "users", lessonData.professorId)
    const professorSnap = await tx.get(professorRef)

    // Authoritative cost: professor's current lessonPrice; fallback to previewConsumption
    const professorData = professorSnap.exists() ? professorSnap.data() : null
    const actualCost: number =
      typeof professorData?.lessonPrice === "number" && professorData.lessonPrice > 0
        ? professorData.lessonPrice
        : playsCost

    const userData = userSnap.data()
    const currentBalance: number = userData.walletBalance ?? 0
    if (currentBalance < actualCost) throw new InsufficientBalanceError(ERROS.SALDO_INSUFICIENTE)

    const newStudentBalance = currentBalance - actualCost
    const currentEarnings: number = professorData?.earningsBalance || 0
    const now = new Date().toISOString()

    // Use planPlayValue frozen at purchase time; fall back to PLAN_CONFIGS for older docs
    const currentPlanId = (userData.currentPlanId ?? "mensal") as Plan
    let playValue: number = Number(
      userData.wallet?.playValue ??
      userData.planPlayValue ??
      PLAN_CONFIGS[currentPlanId]?.playValue ??
      PLAN_CONFIGS.mensal.playValue
    )

    // Fallback agressivo se o valor veio como NaN do banco histórico
    if (Number.isNaN(playValue) || playValue <= 0) {
      playValue = Number(PLAN_CONFIGS[currentPlanId]?.playValue ?? PLAN_CONFIGS.mensal.playValue)
    }
    
    console.log("[DEBUG CHECK-IN] Dados para validação", {
      studentId,
      currentPlanId,
      originalPlayValue: userData.wallet?.playValue ?? userData.planPlayValue,
      resolvedPlayValue: playValue,
      isNanPlayValue: Number.isNaN(playValue)
    })

    if (Number.isNaN(playValue) || playValue <= 0) {
      throw new Error("CRÍTICO: Aluno não possui playValue válido para realizar check-in.")
    }

    if (Number.isNaN(newStudentBalance)) {
      throw new Error("CRÍTICO: Tentativa de salvar NaN (novo saldo do aluno) no banco de dados evitada.")
    }

    // ── 2. Writes ─────────────────────────────────────────────────────────────
    tx.update(userRef, { walletBalance: increment(-actualCost) })
    tx.update(lessonRef, { enrolledStudentIds: arrayUnion(studentId) })

    // Student debit transaction — includes playValue for monetary audit trail
    const txRef = doc(collection(db, "transactions"))
    tx.set(txRef, {
      id: txRef.id,
      walletId: studentId,
      studentId,
      lessonId,
      type: "debit",
      amount: -actualCost,
      balanceAfter: newStudentBalance,
      professorName,
      classLevel,
      isPeak,
      isReserva,
      playValue,
      createdAt: now,
    } satisfies Transaction)

    // Professor earnings + teacher_transactions only if professor doc exists
    if (professorSnap.exists()) {
      const shareConfig = {
        professorSharePct: lessonData.professorSharePct ?? 0.5,
        arenaSharePct: lessonData.arenaSharePct ?? 0.5,
      }
      const revenue = calculateCheckinRevenue(actualCost, playValue, shareConfig)
      
      const newProfBalance = currentEarnings + revenue.professorCredit
      if (Number.isNaN(newProfBalance) || Number.isNaN(revenue.professorCredit)) {
        throw new Error("CRÍTICO: Tentativa de salvar NaN (saldo do professor) no banco de dados evitada.")
      }

      tx.update(professorRef, { earningsBalance: increment(revenue.professorCredit) })

      const teacherTxRef = doc(collection(db, "teacher_transactions"))
      tx.set(teacherTxRef, {
        id: teacherTxRef.id,
        teacherId: lessonData.professorId,
        studentId,
        studentName: userSnap.data().name ?? null,
        lessonId,
        type: "CHECK_IN_CREDIT",
        amount: revenue.professorCredit,
        playsConsumed: actualCost,
        playValue,
        rsBruto: revenue.rsBruto,
        arenaCredit: revenue.arenaCredit,
        createdAt: now,
      })
    }
  })
}

export async function processCheckOut(
  studentId: string,
  lessonId: string,
  playsRefund: number,
  professorName: string,
): Promise<void> {
  const lessonRef = doc(db, "lessons", lessonId)
  const batch = writeBatch(db)

  batch.update(lessonRef, {
    checkedInStudentIds: arrayRemove(studentId),
    enrolledStudentIds: arrayRemove(studentId),
  })

  if (playsRefund > 0) {
    const userRef = doc(db, "users", studentId)
    const userSnap = await getDoc(userRef)

    if (userSnap.exists()) {
      const currentBalance = (typeof userSnap.data().walletBalance === "number" && !Number.isNaN(userSnap.data().walletBalance)) 
        ? userSnap.data().walletBalance 
        : 0
      const newBalance = currentBalance + playsRefund

      if (Number.isNaN(newBalance)) {
        throw new Error("CRÍTICO: Tentativa de salvar NaN (novo saldo do aluno no checkout) evitada.")
      }

      batch.update(userRef, { walletBalance: newBalance })

      const txRef = doc(collection(db, "transactions"))
      const tx: Transaction = {
        id: txRef.id,
        walletId: studentId,
        studentId,
        lessonId,
        type: "credit",
        amount: playsRefund,
        balanceAfter: newBalance,
        professorName: `${professorName} (Estorno)`,
        classLevel: null,
        isPeak: null,
        createdAt: new Date().toISOString(),
      }
      batch.set(txRef, tx)
    }
  }

  await batch.commit()
}

// Teacher marks a student's attendance status.
// - present: adds to checkedInStudentIds, removes from absentStudentIds.
// - absent:  adds to absentStudentIds, removes from checkedInStudentIds. No refund — plays are lost.
// - none:    removes from both (resets to pending).
// No wallet changes occur here; plays were already deducted at enrollment.
export async function markStudentAttendance(
  lessonId: string,
  studentId: string,
  status: "present" | "absent" | "none",
): Promise<void> {
  const update =
    status === "present"
      ? { checkedInStudentIds: arrayUnion(studentId),  absentStudentIds: arrayRemove(studentId) }
      : status === "absent"
      ? { absentStudentIds:    arrayUnion(studentId),  checkedInStudentIds: arrayRemove(studentId) }
      : { checkedInStudentIds: arrayRemove(studentId), absentStudentIds:    arrayRemove(studentId) }

  await updateDoc(doc(db, "lessons", lessonId), update)
}

// Cancels a lesson and atomically refunds every enrolled student.
// Creates a credit transaction and a notification for each enrolled student.
export async function cancelLesson(lessonId: string, reason: string): Promise<void> {
  const lessonRef = doc(db, "lessons", lessonId)
  const lessonSnap = await getDoc(lessonRef)
  if (!lessonSnap.exists()) throw new LessonNotFoundError(ERROS.AULA_NAO_ENCONTRADA)

  const lessonData = lessonSnap.data()
  const enrolledIds: string[] = lessonData.enrolledStudentIds ?? []
  const lessonLabel = `${lessonData.level} com ${lessonData.professorName} — ${new Date(lessonData.dateTime).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}`

  // Collect all debit transactions for this lesson in one query (no composite index needed)
  const txSnap = await getDocs(
    query(collection(db, "transactions"), where("lessonId", "==", lessonId)),
  )
  const paidByStudent: Record<string, number> = {}
  txSnap.docs.forEach((d) => {
    const data = d.data()
    if (data.type === "debit") {
      paidByStudent[data.studentId] = (paidByStudent[data.studentId] ?? 0) + Math.abs(data.amount)
    }
  })

  // Read current balances for all enrolled students
  const userSnaps = await Promise.all(enrolledIds.map((id) => getDoc(doc(db, "users", id))))
  const balanceByStudent: Record<string, number> = {}
  userSnaps.forEach((snap) => {
    if (snap.exists()) balanceByStudent[snap.id] = snap.data().walletBalance ?? 0
  })

  const batch = writeBatch(db)
  const now = new Date().toISOString()

  batch.update(lessonRef, {
    status: "cancelled",
    cancelledAt: now,
    cancellationReason: reason || null,
  })

  for (const studentId of enrolledIds) {
    const refund = paidByStudent[studentId] ?? 0
    const currentBalance = balanceByStudent[studentId] ?? 0
    const newBalance = currentBalance + refund

    if (refund > 0) {
      batch.update(doc(db, "users", studentId), { walletBalance: newBalance })

      const txRef = doc(collection(db, "transactions"))
      batch.set(txRef, {
        id: txRef.id,
        walletId: studentId,
        studentId,
        lessonId,
        type: "credit",
        amount: refund,
        balanceAfter: newBalance,
        professorName: `${lessonData.professorName} (Cancelamento)`,
        classLevel: lessonData.level,
        isPeak: null,
        createdAt: now,
      } satisfies Transaction)
    }

    const notifRef = doc(collection(db, "notifications"))
    const refundLine = refund > 0
      ? ` ${refund.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} Plays reembolsados.`
      : ""
    const reasonLine = reason ? ` Motivo: ${reason}.` : ""
    batch.set(notifRef, {
      id: notifRef.id,
      userId: studentId,
      type: "lesson_cancelled",
      message: `Aula cancelada: ${lessonLabel}.${reasonLine}${refundLine}`.trim(),
      lessonId,
      read: false,
      createdAt: now,
    })
  }

  await batch.commit()
}

// Marks a lesson as finished and notifies every enrolled student in one batch.
// All writes are atomic — either everything commits or nothing does.
export async function finishLesson(lessonId: string): Promise<void> {
  const lessonRef = doc(db, "lessons", lessonId)
  const lessonSnap = await getDoc(lessonRef)
  if (!lessonSnap.exists()) throw new LessonNotFoundError(ERROS.AULA_NAO_ENCONTRADA)

  const lessonData = lessonSnap.data()
  const enrolledIds: string[] = lessonData.enrolledStudentIds ?? []
  const lessonLabel = `${lessonData.level} com ${lessonData.professorName}`
  const now = new Date().toISOString()

  const batch = writeBatch(db)

  batch.update(lessonRef, { status: "finished", finishedAt: now })

  for (const studentId of enrolledIds) {
    const notifRef = doc(collection(db, "notifications"))
    batch.set(notifRef, {
      id: notifRef.id,
      userId: studentId,
      type: "lesson_finished",
      title: "Aula Finalizada",
      message: `A aula de ${lessonLabel} foi concluída.`,
      lessonId,
      read: false,
      createdAt: now,
    })
  }

  await batch.commit()
}

// Reschedules a lesson and notifies every enrolled student.
export async function rescheduleLesson(lessonId: string, newDateTimeISO: string): Promise<void> {
  const lessonRef = doc(db, "lessons", lessonId)
  const lessonSnap = await getDoc(lessonRef)
  if (!lessonSnap.exists()) throw new LessonNotFoundError(ERROS.AULA_NAO_ENCONTRADA)

  const lessonData = lessonSnap.data()
  const enrolledIds: string[] = lessonData.enrolledStudentIds ?? []
  const newDateLabel = new Date(newDateTimeISO).toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })

  const batch = writeBatch(db)
  const now = new Date().toISOString()

  batch.update(lessonRef, { dateTime: newDateTimeISO, wasRescheduled: true })

  for (const studentId of enrolledIds) {
    const notifRef = doc(collection(db, "notifications"))
    batch.set(notifRef, {
      id: notifRef.id,
      userId: studentId,
      type: "lesson_rescheduled",
      message: `Sua aula de ${lessonData.level} com ${lessonData.professorName} foi reagendada para ${newDateLabel}.`,
      lessonId,
      read: false,
      createdAt: now,
    })
  }

  await batch.commit()
}

// ─── Student lesson history ───────────────────────────────────────────────────

// Fetches every lesson the student enrolled in, plus the cost from transactions.
// Sorting is done client-side to avoid a composite index on array-contains + orderBy.
// Transaction fetch is isolated so a missing index or empty result never blocks lesson display.
export async function getStudentLessonHistory(studentId: string): Promise<LessonHistoryEntry[]> {
  const lessonsSnap = await getDocs(
    query(
      collection(db, "lessons"),
      where("enrolledStudentIds", "array-contains", studentId),
    ),
  )

  const playsByLesson: Record<string, number> = {}
  try {
    const txSnap = await getDocs(
      query(
        collection(db, "transactions"),
        where("studentId", "==", studentId),
        where("type", "==", "debit"),
      ),
    )
    txSnap.docs.forEach((d) => {
      const data = d.data()
      if (data.lessonId) {
        playsByLesson[data.lessonId] = Math.abs(data.amount as number)
      }
    })
  } catch {
    // Transaction fetch failed — lessons still display with playsSpent: null
  }

  return lessonsSnap.docs.flatMap((d) => {
    const entry = mapRawDocToLessonHistory(d.id, d.data() as Record<string, unknown>, playsByLesson)
    return entry ? [entry] : []
  })
}

// ─── Teacher lesson history ───────────────────────────────────────────────────

// Fetches every finished/cancelled lesson for the teacher, enriched with
// attendance data and earnings from teacher_transactions.
// Sorting is done client-side to avoid a composite index on professorId + orderBy.
// Transaction fetch is isolated so a missing index or empty result never blocks lesson display.
export async function getTeacherLessonHistory(teacherId: string): Promise<TeacherLessonHistoryEntry[]> {
  const lessonsSnap = await getDocs(
    query(
      collection(db, "lessons"),
      where("professorId", "==", teacherId),
    ),
  )

  const earnedByLesson: Record<string, number> = {}
  const namesByLesson: Record<string, Map<string, string | null>> = {}

  try {
    const txSnap = await getDocs(
      query(
        collection(db, "teacher_transactions"),
        where("teacherId", "==", teacherId),
      ),
    )
    txSnap.docs.forEach((d) => {
      const data = d.data()
      if (data.type === "CHECK_IN_CREDIT" && data.lessonId) {
        earnedByLesson[data.lessonId] = (earnedByLesson[data.lessonId] ?? 0) + (data.amount as number)

        if (!namesByLesson[data.lessonId]) {
          namesByLesson[data.lessonId] = new Map()
        }
        namesByLesson[data.lessonId].set(data.studentId as string, (data.studentName as string | null) ?? null)
      }
    })
  } catch {
    // Transaction fetch failed — lessons still display with totalEarned: 0
  }

  const entries = lessonsSnap.docs.flatMap((d) => {
    const entry = mapRawDocToTeacherHistory(d.id, d.data() as Record<string, unknown>, earnedByLesson, namesByLesson)
    return entry ? [entry] : []
  })

  return entries.sort((a, b) => b.dateTime.localeCompare(a.dateTime))
}
