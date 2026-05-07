import { deriveLessonDisplayStatus } from "@/core/math/lesson-display"
import type { Lesson } from "@/core/entities/lesson"

export interface LessonCardState {
  isCancelled: boolean
  isRescheduled: boolean
  isBlocked: boolean
  isDone: boolean
  spotsLeft: number
  hasSpot: boolean
  isLevelBlocked: boolean
  hasBalance: boolean
  isActionable: boolean
  cardBorderColor: string
}

export function useLessonCardState(
  lesson: Lesson,
  studentLevelIndex = 0,
  walletBalance = 0,
): LessonCardState {
  const { isCancelled, isRescheduled, isBlocked } = deriveLessonDisplayStatus(lesson)
  const isDone = lesson.checkInStatus === "done"

  const spotsLeft = lesson.totalSpots - lesson.enrolledCount
  const hasSpot = spotsLeft > 0 || lesson.isEnrolled
  const isLevelBlocked = studentLevelIndex < lesson.levelIndex
  const hasBalance = walletBalance >= lesson.previewConsumption
  const isActionable =
    !isLevelBlocked &&
    hasBalance &&
    hasSpot &&
    (lesson.checkInStatus === "enrolled_only" || lesson.checkInStatus === "open")

  const cardBorderColor = isCancelled
    ? "border-red-200 bg-red-50/50"
    : isRescheduled
      ? "border-amber-200 bg-amber-50/50"
      : isDone
        ? "border-brand/30 bg-brand-subtle"
        : "border-brand/50"

  return {
    isCancelled,
    isRescheduled,
    isBlocked,
    isDone,
    spotsLeft,
    hasSpot,
    isLevelBlocked,
    hasBalance,
    isActionable,
    cardBorderColor,
  }
}
