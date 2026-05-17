import { collection, doc, getDoc, getDocs, query, setDoc, where, writeBatch } from "firebase/firestore"
import { TeacherClassSchema, type TeacherClass } from "@/core/entities/teacher-class"
import { db } from "./firestore"

export type { TeacherClass }

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

export async function syncTeacherClassToLessons(
  teacherId: string,
  titularIds: string[],
  reservaIds: string[],
): Promise<number> {
  const now = new Date().toISOString()
  const snap = await getDocs(
    query(
      collection(db, "lessons"),
      where("professorId", "==", teacherId),
      where("status", "==", "scheduled"),
    ),
  )

  const futureDocs = snap.docs.filter(
    (d) => typeof d.data().dateTime === "string" && d.data().dateTime > now,
  )

  if (futureDocs.length === 0) return 0

  const BATCH_LIMIT = 500
  let updated = 0

  for (let i = 0; i < futureDocs.length; i += BATCH_LIMIT) {
    const chunk = futureDocs.slice(i, i + BATCH_LIMIT)
    const batch = writeBatch(db)
    chunk.forEach((d) => batch.update(d.ref, { titularIds, reservaIds }))
    await batch.commit()
    updated += chunk.length
  }

  return updated
}
