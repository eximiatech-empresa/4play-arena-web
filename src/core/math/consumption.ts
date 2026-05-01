import { getProfessorById, PEAK_WINDOW, type Plan } from "@/core/constants/professors"
import { CheckInStatus } from "../entities/lesson"

const CLOSED = 0;
const OPENTOALL = 6;
const ENROLLEDONLY = 24;
const OFF_PEAK_MULTIPLIER = 0.95;

export const PLAN_MULTIPLIERS: Record<Plan, number> = {
  mensal: 1.2,
  trimestral: 1.0,
  semestral: 0.8,
}

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
    throw new Error(`Professor "${professorId}" not found in pricing table`)
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
  const msToClass = classDateTime.getTime() - now.getTime()
  const hoursToClass = msToClass / (1000 * 60 * 60)

  if (hoursToClass < CLOSED) return "closed"
  if (hoursToClass <= OPENTOALL) return "open"
  if (hoursToClass <= ENROLLEDONLY && isEnrolled) return "enrolled_only"
  return "not_open"
}

export function canCancelCheckIn(classDateTime: Date, now = new Date()): boolean {
  const msToClass = classDateTime.getTime() - now.getTime()
  const hoursToClass = msToClass / (1000 * 60 * 60)
  
  return hoursToClass >= 4 // T-4h
}

export const calculateDaysLeft = (expirationDateString: string | undefined) => {
  if (!expirationDateString) return 0
  const expDate = new Date(expirationDateString)
  const today = new Date()
  const diffTime = expDate.getTime() - today.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}