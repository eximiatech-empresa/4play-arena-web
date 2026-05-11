import { LessonDocumentSchema } from "@/core/entities/lesson"
import { calculateConsumption, isOffPeak, getCheckInStatus } from "@/core/math/consumption"
import type { Lesson } from "@/core/entities/lesson"
import type { Plan } from "@/core/entities/wallet"

/**
 * Transforms a raw Firestore document (id + data object) into a Lesson view model.
 * Pure function — no Firebase imports; accepts raw data so it can be tested without
 * a Firebase instance.
 *
 * Returns null if the raw document fails schema validation.
 */
export function mapRawDocToLesson(
  id: string,
  data: Record<string, unknown>,
  studentId: string,
  plan: Plan,
  now: Date,
): Lesson | null {
  const parsed = LessonDocumentSchema.safeParse({ id, ...data })
  if (!parsed.success) return null

  const doc = parsed.data
  const lessonDate = new Date(doc.dateTime)
  const offPeak = isOffPeak(lessonDate)

  let previewConsumption: number
  try {
    previewConsumption = calculateConsumption({ professorId: doc.professorId, plan, date: lessonDate })
  } catch {
    previewConsumption = 0
  }

  const isEnrolled = doc.enrolledStudentIds.includes(studentId)
  const isTitular = doc.titularIds.includes(studentId) || doc.reservaIds.includes(studentId)
  const checkInStatus = isEnrolled
    ? ("done" as const)
    : getCheckInStatus(lessonDate, isTitular, now)

  return {
    id: doc.id,
    professorId: doc.professorId,
    professorName: doc.professorName,
    level: doc.level,
    levelIndex: doc.levelIndex,
    dateTime: doc.dateTime,
    court: doc.court,
    totalSpots: doc.totalSpots,
    enrolledCount: doc.enrolledStudentIds.length,
    isEnrolled,
    checkInStatus,
    previewConsumption,
    isOffPeak: offPeak,
    status: doc.status,
    wasRescheduled: doc.wasRescheduled ?? false,
    description: doc.description,
    titularIds: doc.titularIds,
    reservaIds: doc.reservaIds,
    enrolledStudentIds: doc.enrolledStudentIds,
    checkedInStudentIds: doc.checkedInStudentIds,
    absentStudentIds: doc.absentStudentIds,
    cancellationReason: doc.cancellationReason,
    rescheduledToId: doc.rescheduledToId,
  } satisfies Lesson
}
