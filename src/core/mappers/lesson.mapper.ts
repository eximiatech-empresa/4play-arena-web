// src/core/mappers/lesson.mapper.ts

import { LessonDocumentSchema } from "@/core/entities/lesson"
import { calculatePlaysConsumed, isPeakHour, getCheckInStatus } from "@/core/math/consumption"
import type { Lesson } from "@/core/entities/lesson"
import type { Plan } from "@/core/entities/wallet"

/**
 * Transforms a raw Firestore document (id + data object) into a Lesson view model.
 * Pure function — no Firebase imports; accepts raw data so it can be tested without
 * a Firebase instance.
 *
 * Accepts two call signatures for backward-compat:
 *   - New:  mapRawDocToLesson(id, data, studentId, now, plan?)
 *   - Legacy: mapRawDocToLesson(id, data, studentId, plan, now)
 *
 * `plan` is optional in both signatures: when omitted, `previewConsumption` defaults to 0.
 *
 * Returns null if the raw document fails schema validation.
 */
// New preferred signature
export function mapRawDocToLesson(
  id: string,
  data: Record<string, unknown>,
  studentId: string,
  now: Date,
  plan?: Plan,
): Lesson | null
// Legacy signature — plan in 4th position (used by lib/firebase/booking.ts)
export function mapRawDocToLesson(
  id: string,
  data: Record<string, unknown>,
  studentId: string,
  plan: Plan,
  now: Date,
): Lesson | null
export function mapRawDocToLesson(
  id: string,
  data: Record<string, unknown>,
  studentId: string,
  fourthArg: Date | Plan,
  fifthArg?: Date | Plan,
): Lesson | null {
  // Resolve which argument is `now` and which is `plan`
  let resolvedNow: Date
  let resolvedPlan: Plan | undefined

  if (fourthArg instanceof Date) {
    // New signature: (id, data, studentId, now, plan?)
    resolvedNow = fourthArg
    resolvedPlan = fifthArg as Plan | undefined
  } else {
    // Legacy signature: (id, data, studentId, plan, now)
    resolvedPlan = fourthArg as Plan
    resolvedNow = fifthArg as Date
  }

  const parsed = LessonDocumentSchema.safeParse({ id, ...data })
  if (!parsed.success) return null

  const doc = parsed.data
  const lessonDate = new Date(doc.dateTime)
  const isPeak = isPeakHour(lessonDate)
  const isReserva = !doc.titularIds.includes(studentId)

  let previewConsumption = 0
  if (resolvedPlan !== undefined) {
    try {
      previewConsumption = calculatePlaysConsumed({
        professorId: doc.professorId,
        isPeak,
        isReserva,
      })
    } catch {
      previewConsumption = 0
    }
  }

  const isEnrolled = doc.enrolledStudentIds.includes(studentId)
  const isTitularOrReserva =
    doc.titularIds.includes(studentId) || doc.reservaIds.includes(studentId)
  const checkInStatus = isEnrolled
    ? ("done" as const)
    : getCheckInStatus(lessonDate, isTitularOrReserva, resolvedNow)

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
    isPeak,
    /** @deprecated backward-compat alias for isPeak — use isPeak in new code */
    isOffPeak: !isPeak,
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
