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
} from "firebase/firestore"
import { db } from "./firestore"
import { LessonDocumentSchema } from "@/core/entities/lesson"
import { calculateConsumption, isOffPeak, getCheckInStatus } from "@/core/math/consumption"
import type { Lesson } from "@/core/entities/lesson"
import type { Transaction } from "@/core/entities/wallet"
import type { Plan } from "@/core/entities/wallet"

// ─── Queries ──────────────────────────────────────────────────────────────────

function mapDocToLesson(
  d: import("firebase/firestore").QueryDocumentSnapshot,
  studentId: string,
  plan: Plan,
  now: Date,
): Lesson | null {
  const parsed = LessonDocumentSchema.safeParse({ id: d.id, ...d.data() });
  if (!parsed.success) return null;

  const docData = parsed.data;
  const lessonDate = new Date(docData.dateTime);
  const offPeak = isOffPeak(lessonDate);

  let previewConsumption: number;
  try {
    previewConsumption = calculateConsumption({ professorId: docData.professorId, plan, date: lessonDate });
  } catch {
    previewConsumption = 0;
  }

  // enrolled = paid and committed to the class
  const isEnrolled = docData.enrolledStudentIds.includes(studentId);
  // isTitular = admin-granted priority access window (T-24h)
  const isTitular = docData.titularIds.includes(studentId) || docData.reservaIds.includes(studentId);
  const checkInStatus = isEnrolled
    ? ("done" as const)
    : getCheckInStatus(lessonDate, isTitular, now);

  return {
    id: docData.id,
    professorId: docData.professorId,
    professorName: docData.professorName,
    level: docData.level,
    levelIndex: docData.levelIndex,
    dateTime: docData.dateTime,
    court: docData.court,
    totalSpots: docData.totalSpots,
    enrolledCount: docData.enrolledStudentIds.length,
    isEnrolled,
    checkInStatus,
    previewConsumption,
    isOffPeak: offPeak,
    status: docData.status,
    wasRescheduled: docData.wasRescheduled ?? false,
    description: docData.description,
    titularIds: docData.titularIds,
    reservaIds: docData.reservaIds,
    enrolledStudentIds: docData.enrolledStudentIds,
    checkedInStudentIds: docData.checkedInStudentIds,
    absentStudentIds: docData.absentStudentIds,
  } satisfies Lesson;
}

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
    const lesson = mapDocToLesson(d, studentId, plan, now);
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

    const lesson = mapDocToLesson(d, studentId, plan, now);

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
  offPeak: boolean,
): Promise<void> {
  const userRef    = doc(db, "users", studentId)
  const lessonRef  = doc(db, "lessons", lessonId)

  await runTransaction(db, async (tx) => {
    // ── 1. Reads (must all precede writes in a Firestore transaction) ─────────
    const [userSnap, lessonSnap] = await Promise.all([
      tx.get(userRef),
      tx.get(lessonRef),
    ])

    if (!userSnap.exists())   throw new Error("Aluno não encontrado")
    if (!lessonSnap.exists()) throw new Error("Aula não encontrada")

    const lessonData = lessonSnap.data()

    if ((lessonData.enrolledStudentIds?.length ?? 0) >= lessonData.totalSpots)
      throw new Error("Aula já está lotada")
    if (lessonData.enrolledStudentIds?.includes(studentId))
      throw new Error("Inscrição já realizada")

    const professorRef  = doc(db, "users", lessonData.professorId)
    const professorSnap = await tx.get(professorRef)

    // Authoritative cost: professor's current lessonPrice; fallback to previewConsumption
    const professorData = professorSnap.exists() ? professorSnap.data() : null
    const actualCost: number =
      typeof professorData?.lessonPrice === "number" && professorData.lessonPrice > 0
        ? professorData.lessonPrice
        : playsCost

    const currentBalance: number = userSnap.data().walletBalance ?? 0
    if (currentBalance < actualCost) throw new Error("Saldo insuficiente de Plays")

    const newStudentBalance = currentBalance - actualCost
    const currentEarnings: number = professorData?.earningsBalance ?? 0
    const now = new Date().toISOString()

    // ── 2. Writes ─────────────────────────────────────────────────────────────
    tx.update(userRef, { walletBalance: newStudentBalance })
    tx.update(lessonRef, { enrolledStudentIds: arrayUnion(studentId) })

    // Student debit transaction
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
      isOffPeak: offPeak,
      createdAt: now,
    } satisfies Transaction)

    // Professor earnings + teacher_transactions only if professor doc exists
    if (professorSnap.exists()) {
      tx.update(professorRef, { earningsBalance: currentEarnings + actualCost })

      const teacherTxRef = doc(collection(db, "teacher_transactions"))
      tx.set(teacherTxRef, {
        id: teacherTxRef.id,
        teacherId: lessonData.professorId,
        studentId,
        studentName: userSnap.data().name ?? null,
        lessonId,
        type: "CHECK_IN_CREDIT",
        amount: actualCost,
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
      const newBalance = (userSnap.data().walletBalance ?? 0) + playsRefund

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
        isOffPeak: null,
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
  if (!lessonSnap.exists()) throw new Error("Aula não encontrada")

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
        isOffPeak: null,
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
  if (!lessonSnap.exists()) throw new Error("Aula não encontrada")

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
  if (!lessonSnap.exists()) throw new Error("Aula não encontrada")

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

export interface LessonHistoryEntry {
  id: string
  professorName: string
  level: string
  dateTime: string
  court: string
  status: import("@/core/entities/lesson").LessonStatus
  wasRescheduled: boolean
  cancellationReason?: string | null
  rescheduledToId?: string
  checkedInStudentIds: string[]
  absentStudentIds: string[]
  /** Plays effectively deducted — sourced from the debit transaction. Null if no transaction found. */
  playsSpent: number | null
}

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
    const parsed = LessonDocumentSchema.safeParse({ id: d.id, ...d.data() })
    if (!parsed.success) return []
    const l = parsed.data
    return [
      {
        id: l.id,
        professorName: l.professorName,
        level: l.level,
        dateTime: l.dateTime,
        court: l.court,
        status: l.status,
        wasRescheduled: l.wasRescheduled,
        cancellationReason: l.cancellationReason,
        rescheduledToId: l.rescheduledToId,
        checkedInStudentIds: l.checkedInStudentIds,
        absentStudentIds: l.absentStudentIds,
        playsSpent: playsByLesson[l.id] ?? null,
      } satisfies LessonHistoryEntry,
    ]
  })
}
