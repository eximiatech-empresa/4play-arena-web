import { getProfessorById, PEAK_WINDOW, type Plan } from "@/core/constants/professors"

const OFF_PEAK_MULTIPLIER = 0.95

/**
 * Returns true if the given date/time falls outside peak hours (18:00–20:00).
 * Off-peak = before 18h OR at/after 20h.
 */
export function isOffPeak(date: Date): boolean {
  const hour = date.getHours()
  return hour < PEAK_WINDOW.startHour || hour >= PEAK_WINDOW.endHour
}

/**
 * Calculates the final hour consumption for a class.
 *
 * Rules applied in order:
 *  1. Base consumption from professor × plan table
 *  2. Off-peak discount: multiply by 0.95
 *  3. Rounding:
 *     - Marília (isPremium): Math.ceil to 2 decimal places
 *     - All others: Math.round to 2 decimal places
 */
export function calculateConsumption({
  professorId,
  plan,
  date,
}: {
  professorId: string
  plan: Plan
  date: Date
}): number {
  const professor = getProfessorById(professorId)
  if (!professor) {
    throw new Error(`Professor "${professorId}" not found in pricing table`)
  }

  const base = professor.consumption[plan]
  const discounted = isOffPeak(date) ? base * OFF_PEAK_MULTIPLIER : base

  if (professor.isPremium) {
    return Math.ceil(discounted * 100) / 100
  }
  return Math.round(discounted * 100) / 100
}

/**
 * Checks whether a student's level is sufficient for a class level.
 * Student must be at the same level or higher.
 */
export function isLevelEligible(
  studentLevelIndex: number,
  classLevelIndex: number
): boolean {
  return studentLevelIndex >= classLevelIndex
}

/**
 * Determines whether a student can check in, based on timing rules:
 *  - T-24h: open exclusively to enrolled (titular) students
 *  - T-6h: open to any eligible student (mar aberto)
 */
export function getCheckInStatus(
  classDateTime: Date,
  isEnrolled: boolean,
  now = new Date()
): "not_open" | "enrolled_only" | "open" | "closed" {
  const msToClass = classDateTime.getTime() - now.getTime()
  const hoursToClass = msToClass / (1000 * 60 * 60)

  if (hoursToClass < 0) return "closed"
  if (hoursToClass <= 6) return "open"
  if (hoursToClass <= 24 && isEnrolled) return "enrolled_only"
  return "not_open"
}
