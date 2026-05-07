import type { Lesson } from "@/core/entities/lesson"

export interface LessonDisplayStatus {
  isCancelled: boolean
  isRescheduled: boolean
  isBlocked: boolean
  isActive: boolean
}

/** Derives the display status flags for a lesson from its domain state. */
export function deriveLessonDisplayStatus(lesson: Lesson): LessonDisplayStatus {
  const isCancelled = lesson.status === "cancelled"
  const isRescheduled = lesson.wasRescheduled && !isCancelled
  const isBlocked = isCancelled || isRescheduled
  const isActive = !isCancelled && !isRescheduled
  return { isCancelled, isRescheduled, isBlocked, isActive }
}
