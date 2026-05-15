import { doc, getDoc, setDoc } from "firebase/firestore"
import { db } from "./firestore"
import { z } from "zod"

const TeacherClassSchema = z.object({
  teacherId: z.string(),
  titularIds: z.array(z.string()).default([]),
  reservaIds: z.array(z.string()).default([]),
  classSize: z.number().int().positive().default(4),
  updatedAt: z.string().optional(),
})

export type TeacherClass = z.infer<typeof TeacherClassSchema>

export async function getTeacherClass(teacherId: string): Promise<TeacherClass> {
  const snap = await getDoc(doc(db, "teacherClasses", teacherId))
  if (!snap.exists()) {
    return { teacherId, titularIds: [], reservaIds: [], classSize: 4 }
  }
  const result = TeacherClassSchema.safeParse({ teacherId, ...snap.data() })
  return result.success ? result.data : { teacherId, titularIds: [], reservaIds: [], classSize: 4 }
}

export async function upsertTeacherClass(
  teacherId: string,
  updates: Partial<Omit<TeacherClass, "teacherId" | "updatedAt">>,
): Promise<void> {
  await setDoc(
    doc(db, "teacherClasses", teacherId),
    { teacherId, ...updates, updatedAt: new Date().toISOString() },
    { merge: true },
  )
}
