import {
  collection,
  doc,
  getDocs,
  deleteDoc,
  query,
  where,
  orderBy,
  writeBatch,
} from "firebase/firestore"
import { db } from "./firestore"
import { LessonDocumentSchema } from "@/core/entities/lesson"
import type { LessonDocument, CreateLessonInput } from "@/core/entities/lesson"

export type { CreateLessonInput }

export async function getAdminLessonsByDate(dateStr: string): Promise<LessonDocument[]> {
  const startPrefix = `${dateStr}T`
  const endPrefix = `${dateStr}U`

  const snap = await getDocs(
    query(
      collection(db, "lessons"),
      where("dateTime", ">=", startPrefix),
      where("dateTime", "<", endPrefix),
      orderBy("dateTime"),
    ),
  )

  return snap.docs.flatMap((d) => {
    const parsed = LessonDocumentSchema.safeParse({ id: d.id, ...d.data() })
    return parsed.success ? [parsed.data] : []
  })
}

export async function getAdminLessonsByMonth(
  year: number,
  month: number, // 0-indexed (JS Date convention)
): Promise<LessonDocument[]> {
  const mm = String(month + 1).padStart(2, "0")
  const nextMM = month === 11 ? "01" : String(month + 2).padStart(2, "0")
  const nextYear = month === 11 ? year + 1 : year

  const startPrefix = `${year}-${mm}-01T`
  const endPrefix = `${nextYear}-${nextMM}-01T`

  const snap = await getDocs(
    query(
      collection(db, "lessons"),
      where("dateTime", ">=", startPrefix),
      where("dateTime", "<", endPrefix),
      orderBy("dateTime"),
    ),
  )

  return snap.docs.flatMap((d) => {
    const parsed = LessonDocumentSchema.safeParse({ id: d.id, ...d.data() })
    return parsed.success ? [parsed.data] : []
  })
}

export async function createBulkLessons(input: CreateLessonInput): Promise<number> {
  const dates = buildDateList(input)
  const batch = writeBatch(db)
  const now = new Date().toISOString()

  for (const dateTime of dates) {
    const ref = doc(collection(db, "lessons"))
    batch.set(ref, {
      id: ref.id,
      description: input.description,
      professorId: input.professorId,
      professorName: input.professorName,
      level: input.level,
      levelIndex: input.levelIndex,
      dateTime,
      court: input.court,
      totalSpots: input.totalSpots,
      enrolledStudentIds: [],
      checkedInStudentIds: [],
      absentStudentIds: [],
      titularIds: [],
      reservaIds: [],
      status: "scheduled",
      wasRescheduled: false,
      createdAt: now,
    })
  }

  await batch.commit()
  return dates.length
}

export async function deleteLesson(lessonId: string): Promise<void> {
  await deleteDoc(doc(db, "lessons", lessonId))
}

function buildDateList(input: CreateLessonInput): string[] {
  if (input.type === "avulsa") return [input.dateTime]

  const dates: string[] = []
  const start = new Date(input.dateTime)
  const limit = input.repeatUntil ? new Date(input.repeatUntil) : start
  const maxWeeks = 400

  let current = new Date(start)
  let count = 0

  while (current <= limit && count < maxWeeks) {
    dates.push(current.toISOString())
    current = new Date(current.getTime() + 7 * 24 * 60 * 60 * 1000)
    count++
  }

  return dates
}
