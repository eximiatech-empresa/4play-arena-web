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
} from "firebase/firestore"
import { z } from "zod"
import { firebaseApp } from "./app"
import type { User, StudentUser, TeacherUser, UserRole } from "@/core/entities/user"
import { UserSchema } from "@/core/entities/user"

// Lenient schema for list view — .catch() ensures old/incomplete docs are never dropped
const UserListItemSchema = z.object({
  uid: z.string().catch(""),
  name: z.string().catch("Usuário sem nome"),
  email: z.string().catch(""),
  role: z.enum(["ADMIN", "TEACHER", "STUDENT"]).catch("STUDENT"),
  isActive: z.boolean().catch(true),
  level: z.string().catch("Iniciante").optional(),
  walletBalance: z.preprocess((val) => Number(val) || 0, z.number().catch(0)).optional(),
  lessonPrice: z.preprocess((val) => Number(val) || 0, z.number().catch(0)).optional(),
  earningsBalance: z.preprocess((val) => Number(val) || 0, z.number().catch(0)).optional(),
  createdAt: z.preprocess((val) => (val ? String(val) : ""), z.string().catch("")).optional(),
})
export type UserListItem = z.infer<typeof UserListItemSchema>

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
    const rawData = { uid: d.id, ...d.data() }
    const result = UserListItemSchema.safeParse(rawData)
    
    if (!result.success) {
      console.warn(`[getAllUsers] Dados incompletos ou inválidos para UID: ${d.id}`, result.error.format())
      // Fallback object to ensure the list doesn't break
      return {
        uid: rawData.uid || d.id,
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
