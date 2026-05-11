import { getProfessorById, PEAK_WINDOW, type Plan } from "@/core/constants/professors"
import { CheckInStatus } from "../entities/lesson"
import {
  MS_PER_HOUR,
  CHECK_IN_CLOSED_HOURS,
  CHECK_IN_OPEN_HOURS,
  CHECK_IN_ENROLLED_HOURS,
  CANCEL_REFUND_MIN_HOURS,
  OFF_PEAK_MULTIPLIER,
} from "@/core/constants/booking-rules"
import { PLAN_MULTIPLIERS } from "@/core/constants/plan-pricing"
import { ProfessorNotFoundError } from "@/core/errors/exceptions"
import { ERROS } from "@/core/errors/erros"

export { PLAN_MULTIPLIERS }

export function isOffPeak(date: Date): boolean {
  const hour = date.getHours()
  return hour < PEAK_WINDOW.startHour || hour >= PEAK_WINDOW.endHour
}

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
    throw new ProfessorNotFoundError(ERROS.PROFESSOR_NAO_ENCONTRADO(professorId))
  }

  const baseHours = professor.consumption[plan]
  const discountedHours = isOffPeak(date) ? baseHours * OFF_PEAK_MULTIPLIER : baseHours

  const finalPlays = discountedHours * PLAN_MULTIPLIERS[plan]

  if (professor.isPremium) {
    return Math.ceil(finalPlays * 100) / 100
  }
  return Math.round(finalPlays * 100) / 100
}

export function isLevelEligible(
  studentLevelIndex: number,
  classLevelIndex: number
): boolean {
  return studentLevelIndex >= classLevelIndex
}

export function getCheckInStatus(
  classDateTime: Date,
  isEnrolled: boolean,
  now = new Date()
): CheckInStatus {
  const hoursToClass = (classDateTime.getTime() - now.getTime()) / MS_PER_HOUR

  if (hoursToClass < CHECK_IN_CLOSED_HOURS) return "closed"
  if (hoursToClass <= CHECK_IN_OPEN_HOURS) return "open"
  if (hoursToClass <= CHECK_IN_ENROLLED_HOURS && isEnrolled) return "enrolled_only"
  return "not_open"
}

export function canCancelCheckIn(classDateTime: Date, now = new Date()): boolean {
  const hoursToClass = (classDateTime.getTime() - now.getTime()) / MS_PER_HOUR
  return hoursToClass >= CANCEL_REFUND_MIN_HOURS
}