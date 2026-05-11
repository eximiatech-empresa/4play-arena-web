import { LessonDocumentSchema } from "@/core/entities/lesson"
import type { TeacherLessonHistoryEntry } from "@/core/entities/lesson"

/**
 * Maps a raw Firestore lesson document to a TeacherLessonHistoryEntry view model,
 * enriched with earnings and attendance data (from pre-fetched transaction maps).
 *
 * Pure function — no Firebase imports.
 * Returns null if schema validation fails or if the lesson is not finished/cancelled.
 */
export function mapRawDocToTeacherHistory(
  id: string,
  data: Record<string, unknown>,
  earnedByLesson: Record<string, number>,
  namesByLesson: Record<string, Map<string, string | null>>,
): TeacherLessonHistoryEntry | null {
  const parsed = LessonDocumentSchema.safeParse({ id, ...data })
  if (!parsed.success) return null

  const l = parsed.data
  if (l.status !== "finished" && l.status !== "cancelled") return null

  const namesMap = namesByLesson[l.id] ?? new Map<string, string | null>()
  const presentStudents = l.checkedInStudentIds.map((sid) => ({
    id: sid,
    name: namesMap.get(sid) ?? null,
  }))
  const pendingCount = Math.max(
    0,
    l.enrolledStudentIds.length - l.checkedInStudentIds.length - l.absentStudentIds.length,
  )

  return {
    id: l.id,
    level: l.level,
    dateTime: l.dateTime,
    court: l.court,
    status: l.status as "finished" | "cancelled",
    cancellationReason: l.cancellationReason,
    totalEnrolled: l.enrolledStudentIds.length,
    presentStudents,
    absentCount: l.absentStudentIds.length,
    pendingCount,
    totalEarned: earnedByLesson[l.id] ?? 0,
  } satisfies TeacherLessonHistoryEntry
}
