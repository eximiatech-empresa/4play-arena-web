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

// Lenient schema for list view — created docs may be missing student-only fields
const UserListItemSchema = z.object({
  uid: z.string(),
  name: z.string(),
  email: z.string(),
  role: z.enum(["ADMIN", "TEACHER", "STUDENT"]),
  isActive: z.boolean().default(true),
  level: z.string().optional(),
  walletBalance: z.number().optional(),
  lessonPrice: z.number().optional(),
  earningsBalance: z.number().optional(),
  createdAt: z.string().optional(),
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
  return snap.docs
    .map((d) => {
      const result = UserListItemSchema.safeParse(d.data())
      return result.success ? result.data : null
    })
    .filter((u): u is UserListItem => u !== null)
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

export async function updateTeacherLessonPrice(uid: string, lessonPrice: number): Promise<void> {
  await updateDoc(doc(db, "users", uid), { lessonPrice })
}
