import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  writeBatch,
  runTransaction,
} from "firebase/firestore"
import { firebaseApp } from "./app"
import { STUDENT_LEVELS } from "@/core/constants/professors"
import type { User, StudentUser, TeacherUser, UserRole, UserListItem } from "@/core/entities/user"
import { UserSchema, UserSummarySchema } from "@/core/entities/user"

export type { UserListItem }

const UserListItemSchema = UserSummarySchema

export interface CreateUserInput {
  name: string
  email: string
  role: UserRole
  level?: string
}

export const db = getFirestore(firebaseApp)

export async function saveUserDocument(uid: string, data: StudentUser): Promise<void> {
  await setDoc(doc(db, "users", uid), data)
}

export async function getUserDocument(uid: string): Promise<User | null> {
  const snap = await getDoc(doc(db, "users", uid))
  if (!snap.exists()) return null
  const result = UserSchema.safeParse(snap.data())
  return result.success ? result.data : null
}

export async function getTeachers(): Promise<TeacherUser[]> {
  const q = query(collection(db, "users"), where("role", "==", "TEACHER"))
  const snap = await getDocs(q)
  return snap.docs
    .map((d) => {
      const result = UserSchema.safeParse(d.data())
      return result.success && result.data.role === "TEACHER" ? result.data : null
    })
    .filter((u): u is TeacherUser => u !== null)
}

export async function getAllUsers(): Promise<UserListItem[]> {
  const snap = await getDocs(collection(db, "users"))
  return snap.docs.map((d) => {
    const rawData = { uid: d.id, ...d.data() } as Record<string, unknown>
    const result = UserListItemSchema.safeParse(rawData)
    
    if (!result.success) {
      console.warn(`[getAllUsers] Dados incompletos ou inválidos para UID: ${d.id}`, result.error.format())
      // Fallback object to ensure the list doesn't break
      return {
        uid: String(rawData.uid || d.id),
        name: String(rawData.name || "Usuário sem nome"),
        email: String(rawData.email || ""),
        role: "STUDENT",
        isActive: Boolean(rawData.isActive ?? true),
        level: "Iniciante",
        walletBalance: 0,
      } as UserListItem
    }
    
    const parsed = result.data
    // If the uid field was missing in Firestore, the doc ID wins
    if (!parsed.uid) parsed.uid = d.id
    return parsed
  })
}

export async function createUserDocument(input: CreateUserInput): Promise<void> {
  const uid = crypto.randomUUID()
  const now = new Date().toISOString()
  const base = { uid, ...input, isActive: true, createdAt: now }

  if (input.role === "STUDENT") {
    await setDoc(doc(db, "users", uid), {
      ...base,
      level: input.level ?? "Iniciante",
      walletBalance: 0,
      originalTeacherId: "",
      currentPlanId: "mensal",
      planExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    })
    return
  }

  await setDoc(doc(db, "users", uid), base)
}

export async function updateUserActiveStatus(uid: string, isActive: boolean): Promise<void> {
  await updateDoc(doc(db, "users", uid), { isActive })
}

export async function updateUserRole(uid: string, role: string): Promise<void> {
  await updateDoc(doc(db, "users", uid), { role })
}

export async function updateTeacherLessonPrice(uid: string, lessonPrice: number): Promise<void> {
  await updateDoc(doc(db, "users", uid), { lessonPrice })
}

export async function updateStudentLevel(
  studentId: string,
  previousLevel: string,
  newLevel: string,
  actorId: string,
  actorName: string,
  studentName: string,
): Promise<void> {
  const batch = writeBatch(db)
  const levelIndex = Math.max(0, STUDENT_LEVELS.indexOf(newLevel as (typeof STUDENT_LEVELS)[number]))
  batch.update(doc(db, "users", studentId), { level: newLevel, levelIndex })
  const logRef = doc(collection(db, "audit_logs"))
  batch.set(logRef, {
    id: logRef.id,
    type: "level_change",
    actorId,
    actorName,
    targetId: studentId,
    targetName: studentName,
    previousValue: previousLevel,
    newValue: newLevel,
    createdAt: new Date().toISOString(),
  })
  await batch.commit()
}

const DEFAULT_PLAY_VALUE_BY_PLAN: Record<string, number> = {
  mensal: 5.125,
  trimestral: 4.75,
  semestral: 4.3125,
}

export async function adjustStudentWallet({
  studentId,
  studentName,
  plays,
  note,
  planId,
  renewDays,
  actorId,
  actorName,
}: {
  studentId: string
  studentName?: string
  plays: number
  currentBalance?: number
  note: string
  planId?: string
  renewDays?: number
  actorId?: string
  actorName?: string
}): Promise<void> {
  const userRef = doc(db, "users", studentId)
  const planRef = planId && planId !== "none" ? doc(db, "plans", planId) : null

  await runTransaction(db, async (tx) => {
    const userSnap = await tx.get(userRef)
    if (!userSnap.exists()) {
      throw new Error("Aluno não encontrado.")
    }
    const planSnap = planRef ? await tx.get(planRef) : null

    const before = Number(userSnap.data()?.walletBalance ?? 0) || 0
    const newBalance = Math.max(0, before + plays)

    const userUpdates: Record<string, unknown> = {
      walletBalance: newBalance,
      updatedAt: new Date().toISOString(),
    }

    if (planId && planId !== "none") {
      userUpdates.currentPlanId = planId
      const planPlayValue =
        (planSnap?.exists() ? Number(planSnap.data()?.playValue) : NaN) ||
        DEFAULT_PLAY_VALUE_BY_PLAN[planId] ||
        5.125
      userUpdates.planPlayValue = planPlayValue
    }

    if (renewDays && renewDays > 0) {
      const expiry = new Date()
      expiry.setDate(expiry.getDate() + renewDays)
      userUpdates.planExpiresAt = expiry.toISOString()
    }

    tx.update(userRef, userUpdates)

    const nowIso = new Date().toISOString()
    const txRef = doc(collection(db, "transactions"))
    tx.set(txRef, {
      id: txRef.id,
      walletId: studentId,
      studentId,
      lessonId: null,
      type: "adjustment",
      amount: plays,
      balanceAfter: newBalance,
      professorName: null,
      classLevel: null,
      isPeak: null,
      note: note.trim() || "Ajuste manual de saldo",
      createdAt: nowIso,
    })

    const auditRef = doc(collection(db, "audit_logs"))
    tx.set(auditRef, {
      id: auditRef.id,
      type: "wallet_adjustment",
      actorId: actorId ?? "",
      actorName: actorName ?? "",
      targetId: studentId,
      targetName: studentName ?? String(userSnap.data()?.name ?? ""),
      previousValue: before,
      newValue: newBalance,
      metadata: {
        playsDelta: plays,
        note: note.trim(),
        ...(planId && planId !== "none" ? { planId } : {}),
        ...(renewDays && renewDays > 0 ? { renewDays } : {}),
      },
      createdAt: nowIso,
    })
  })
}

export async function getStudentsForAlerts(): Promise<UserListItem[]> {
  const snap = await getDocs(
    query(collection(db, "users"), where("role", "==", "STUDENT")),
  )
  return snap.docs.flatMap((d) => {
    const raw = { uid: d.id, ...d.data() } as Record<string, unknown>
    const result = UserListItemSchema.safeParse(raw)
    if (!result.success) return []
    if (!result.data.uid) result.data.uid = d.id
    return [result.data]
  })
}
