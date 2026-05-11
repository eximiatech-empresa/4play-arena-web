import { LessonDocumentSchema } from "@/core/entities/lesson"
import type { LessonHistoryEntry } from "@/core/entities/lesson"

/**
 * Maps a raw Firestore lesson document to a LessonHistoryEntry view model,
 * enriched with the plays spent (from a pre-fetched transaction map).
 *
 * Pure function — no Firebase imports.
 * Returns null if schema validation fails.
 */
export function mapRawDocToLessonHistory(
  id: string,
  data: Record<string, unknown>,
  playsByLesson: Record<string, number>,
): LessonHistoryEntry | null {
  const parsed = LessonDocumentSchema.safeParse({ id, ...data })
  if (!parsed.success) return null

  const l = parsed.data
  return {
    id: l.id,
    professorName: l.professorName,
    level: l.level,
    dateTime: l.dateTime,
    court: l.court,
    status: l.status,
    wasRescheduled: l.wasRescheduled,
    cancellationReason: l.cancellationReason,
    rescheduledToId: l.rescheduledToId,
    checkedInStudentIds: l.checkedInStudentIds,
    absentStudentIds: l.absentStudentIds,
    playsSpent: playsByLesson[l.id] ?? null,
  } satisfies LessonHistoryEntry
}
