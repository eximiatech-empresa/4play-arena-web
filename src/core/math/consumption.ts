// src/core/math/consumption.ts

import { getProfessorById, PEAK_WINDOW } from "@/core/constants/professors"
import { CheckInStatus } from "../entities/lesson"
import {
  MS_PER_HOUR,
  CHECK_IN_CLOSED_HOURS,
  CHECK_IN_OPEN_HOURS,
  CHECK_IN_ENROLLED_HOURS,
  CANCEL_REFUND_MIN_HOURS,
  PEAK_MULTIPLIER,
  RESERVE_MULTIPLIER,
} from "@/core/constants/booking-rules"
import { ProfessorNotFoundError } from "@/core/errors/exceptions"
import { ERROS } from "@/core/errors/erros"

// ─── Peak / off-peak helpers ──────────────────────────────────────────────────

/**
 * Returns true when the class falls inside the peak window (18:00 ≤ hour < 20:00).
 */
export function isPeakHour(date: Date): boolean {
  const hour = date.getHours()
  return hour >= PEAK_WINDOW.startHour && hour < PEAK_WINDOW.endHour
}

/**
 * Backward-compat alias — kept so existing tests continue to pass.
 * Prefer `isPeakHour` for new code.
 */
export function isOffPeak(date: Date): boolean {
  return !isPeakHour(date)
}

// ─── Plays calculation ────────────────────────────────────────────────────────

/**
 * Calculates the integer number of Plays consumed for a single check-in.
 *
 * Order of operations (per spec §4):
 *  1. basePlays from professor table
 *  2. × PEAK_MULTIPLIER (1.05) if isPeak
 *  3. × RESERVE_MULTIPLIER (1.10) if isReserva
 *  4. round (Math.round) or ceil (Math.ceil) depending on professor's roundingRule
 */
export function calculatePlaysConsumed({
  professorId,
  isPeak,
  isReserva,
}: {
  professorId: string
  isPeak: boolean
  isReserva: boolean
}): number {
  const config = getProfessorById(professorId)
  if (!config) {
    throw new ProfessorNotFoundError(ERROS.PROFESSOR_NAO_ENCONTRADO(professorId))
  }

  let raw = config.basePlays

  if (isPeak) raw *= PEAK_MULTIPLIER
  if (isReserva) raw *= RESERVE_MULTIPLIER

  return config.roundingRule === "ceil" ? Math.ceil(raw) : Math.round(raw)
}

// ─── Level eligibility ────────────────────────────────────────────────────────

export function isLevelEligible(
  studentLevelIndex: number,
  classLevelIndex: number,
): boolean {
  return studentLevelIndex >= classLevelIndex
}

// ─── Check-in status ──────────────────────────────────────────────────────────

export function getCheckInStatus(
  classDateTime: Date,
  isEnrolled: boolean,
  now = new Date(),
): CheckInStatus {
  const hoursToClass = (classDateTime.getTime() - now.getTime()) / MS_PER_HOUR

  if (hoursToClass < CHECK_IN_CLOSED_HOURS) return "closed"
  if (hoursToClass <= CHECK_IN_OPEN_HOURS) return "open"
  if (hoursToClass <= CHECK_IN_ENROLLED_HOURS && isEnrolled) return "enrolled_only"
  return "not_open"
}

// ─── Cancellation guard ───────────────────────────────────────────────────────

export function canCancelCheckIn(classDateTime: Date, now = new Date()): boolean {
  const hoursToClass = (classDateTime.getTime() - now.getTime()) / MS_PER_HOUR
  return hoursToClass >= CANCEL_REFUND_MIN_HOURS
}

// ─── Backward-compat shim ─────────────────────────────────────────────────────
// Features outside src/core/ still import PLAN_MULTIPLIERS from this module.
// In the new Plays model each plan's total plays is stored directly in PLAN_CONFIGS,
// so the multiplier is effectively 1.0 for all plans when used in display code.
// Do NOT use for actual consumption calculations — call calculatePlaysConsumed() instead.

import type { Plan } from "@/core/entities/wallet"

/** @deprecated Use PLAN_CONFIGS from @/core/constants/plan-pricing */
export const PLAN_MULTIPLIERS: Record<Plan, number> = {
  mensal: 1.0,
  trimestral: 1.0,
  semestral: 1.0,
} as const
