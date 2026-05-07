import {
  doc,
  collection,
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
    price: docData.price ?? 0,
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
export async function processCheckIn(
  studentId: string,
  lessonId: string,
  playsCost: number,
  professorName: string,
  classLevel: string,
  offPeak: boolean,
): Promise<void> {
  const userRef = doc(db, "users", studentId)
  const lessonRef = doc(db, "lessons", lessonId)

  const [userSnap, lessonSnap] = await Promise.all([getDoc(userRef), getDoc(lessonRef)])

  if (!userSnap.exists()) throw new Error("Aluno não encontrado")
  if (!lessonSnap.exists()) throw new Error("Aula não encontrada")

  const lessonData = lessonSnap.data()
  if ((lessonData.enrolledStudentIds?.length ?? 0) >= lessonData.totalSpots)
    throw new Error("Aula já está lotada")
  if (lessonData.enrolledStudentIds?.includes(studentId))
    throw new Error("Inscrição já realizada")

  // Authoritative cost comes from the lesson document; fall back to client-computed value
  const actualCost: number = typeof lessonData.price === "number" && lessonData.price > 0
    ? lessonData.price
    : playsCost

  const currentBalance: number = userSnap.data().walletBalance ?? 0
  if (currentBalance < actualCost) throw new Error("Saldo insuficiente de Plays")

  const newStudentBalance = currentBalance - actualCost
  const now = new Date().toISOString()

  const batch = writeBatch(db)

  // 1. Deduct from student
  batch.update(userRef, { walletBalance: newStudentBalance })

  // 2. Student goes ONLY into enrolledStudentIds — teacher handles checkedInStudentIds
  batch.update(lessonRef, { enrolledStudentIds: arrayUnion(studentId) })

  // 3. Student debit transaction
  const txRef = doc(collection(db, "transactions"))
  const tx: Transaction = {
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
  }
  batch.set(txRef, tx)

  // 4. Credit professor's earningsBalance
  const professorRef = doc(db, "users", lessonData.professorId)
  const professorSnap = await getDoc(professorRef)
  if (professorSnap.exists()) {
    const currentEarnings: number = professorSnap.data().earningsBalance ?? 0
    batch.update(professorRef, { earningsBalance: currentEarnings + actualCost })

    // 5. Teacher credit transaction
    const teacherTxRef = doc(collection(db, "teacher_transactions"))
    batch.set(teacherTxRef, {
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

  await batch.commit()
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

// Teacher marks a student as present (checkin) or removes the mark (undo).
// No wallet changes — plays were already deducted at enrollment.
export async function updateStudentAttendance(
  lessonId: string,
  studentId: string,
  action: "checkin" | "undo",
): Promise<void> {
  await updateDoc(doc(db, "lessons", lessonId), {
    checkedInStudentIds:
      action === "checkin" ? arrayUnion(studentId) : arrayRemove(studentId),
  })
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
    cancelReason: reason || null,
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
