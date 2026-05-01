import type { Lesson } from "@/core/entities/lesson"

export type OperationalAlertType = "ghost_lesson" | "full_lesson"

export interface OperationalAlert {
  lessonId: string
  type: OperationalAlertType
  professorName: string
  court: string
  dateTime: string
  level: string
  enrolledCount: number
  totalSpots: number
  suggestion: string
}

function isSameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

/**
 * Lessons scheduled for tomorrow with zero enrollments.
 * Suggests cancellation or off-peak promotion.
 */
export function detectGhostLessons(
  lessons: Lesson[],
  referenceDate: Date = new Date()
): OperationalAlert[] {
  const tomorrow = addDays(referenceDate, 1)
  return lessons
    .filter((l) => isSameCalendarDay(new Date(l.dateTime), tomorrow) && l.enrolledCount === 0)
    .map((l) => ({
      lessonId: l.id,
      type: "ghost_lesson" as const,
      professorName: l.professorName,
      court: l.court,
      dateTime: l.dateTime,
      level: l.level,
      enrolledCount: 0,
      totalSpots: l.totalSpots,
      suggestion: "Considere cancelar ou aplicar promoção Fora de Pico",
    }))
}

/**
 * Future lessons that have no available spots.
 * Suggests opening new time slots for the same level.
 */
export function detectFullLessons(
  lessons: Lesson[],
  referenceDate: Date = new Date()
): OperationalAlert[] {
  return lessons
    .filter((l) => new Date(l.dateTime) > referenceDate && l.enrolledCount >= l.totalSpots)
    .map((l) => ({
      lessonId: l.id,
      type: "full_lesson" as const,
      professorName: l.professorName,
      court: l.court,
      dateTime: l.dateTime,
      level: l.level,
      enrolledCount: l.enrolledCount,
      totalSpots: l.totalSpots,
      suggestion: "Considere abrir novos horários para este nível/dia",
    }))
}

/**
 * Runs all operational radar checks and returns a unified alert list.
 * Ghost lessons are listed before full lessons.
 */
export function runOperationalRadar(
  lessons: Lesson[],
  referenceDate: Date = new Date()
): OperationalAlert[] {
  return [
    ...detectGhostLessons(lessons, referenceDate),
    ...detectFullLessons(lessons, referenceDate),
  ]
}
