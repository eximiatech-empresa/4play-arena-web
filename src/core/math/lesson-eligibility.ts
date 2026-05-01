import { STUDENT_LEVELS } from "@/core/constants/professors"
import type { Lesson } from "@/core/entities/lesson"

export interface LessonEligibility {
  spotsLeft: number
  hasSpot: boolean
  isLevelBlocked: boolean
  hasBalance: boolean
  isDone: boolean
  isActionable: boolean
}

export function formatStudentLevel(rawLevel: string | undefined): { formattedCurrentLevel: string, computedLevelIndex: number, studentLevelIndex: number } {
  const level = rawLevel || "Iniciante"
  const formattedCurrentLevel = ["A", "B", "C", "D"].includes(level)
    ? `Nível ${level}`
    : level

  const computedLevelIndex = STUDENT_LEVELS.indexOf(formattedCurrentLevel as typeof STUDENT_LEVELS[number])
  const studentLevelIndex = computedLevelIndex !== -1 ? computedLevelIndex : 0

  return {
    formattedCurrentLevel,
    computedLevelIndex,
    studentLevelIndex
  }
}

/**
 * Pure function — no React, no side effects.
 * Determines whether a student can check in to a lesson.
 */
export function computeLessonEligibility(
  lesson: Lesson,
  studentLevelIndex: number,
  walletBalance: number
): LessonEligibility {
  const spotsLeft = lesson.totalSpots - lesson.enrolledCount
  const hasSpot = spotsLeft > 0 || lesson.isEnrolled
  const isLevelBlocked = studentLevelIndex < lesson.levelIndex
  const hasBalance = walletBalance >= lesson.previewConsumption
  const isDone = lesson.checkInStatus === "done"
  const isActionable =
    !isLevelBlocked &&
    hasBalance &&
    hasSpot &&
    (lesson.checkInStatus === "enrolled_only" || lesson.checkInStatus === "open")

  return { spotsLeft, hasSpot, isLevelBlocked, hasBalance, isDone, isActionable }
}
