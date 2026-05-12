// src/core/usecases/wallet/purchase-plan.ts

import { PLAN_CONFIGS, type PlanId } from "@/core/constants/plan-pricing"

export interface PlanPurchaseResult {
  /** Total Plays granted to the student's wallet. */
  readonly totalPlays: number
  /** Monetary value of one Play for this plan (R$). */
  readonly playValue: number
  /** ISO 8601 expiry date of the new plan. */
  readonly expiresAt: string
}

/**
 * Builds the immutable result of purchasing a plan.
 * Pure function — no side effects, safe to test in isolation.
 *
 * @param planId - The plan tier being purchased.
 * @param now    - Reference "current" date (defaults to `new Date()`).
 */
export function buildPlanPurchase(planId: PlanId, now = new Date()): PlanPurchaseResult {
  const config = PLAN_CONFIGS[planId]
  const expiry = new Date(now)
  expiry.setDate(expiry.getDate() + config.validityDays)

  return {
    totalPlays: config.totalPlays,
    playValue: config.playValue,
    expiresAt: expiry.toISOString(),
  }
}
