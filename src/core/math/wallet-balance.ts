// src/core/math/wallet-balance.ts

import { PLAN_CONFIGS } from "@/core/constants/plan-pricing"
import type { Transaction, Plan } from "@/core/entities/wallet"

/**
 * Derives the student's total plays from their transaction history.
 *
 * Sums all `purchase` and `credit` transactions. Falls back to the plan's
 * default totalPlays when no transactions exist yet.
 */
export function calculateTotalPlays(transactions: Transaction[], planId: Plan): number {
  const planData = PLAN_CONFIGS[planId]
  return (
    transactions
      .filter((t) => t.type === "purchase" || t.type === "credit")
      .reduce((sum, t) => sum + t.amount, 0) ||
    planData.totalPlays
  )
}

/**
 * Parses planExpiresAt to a consistent ISO string.
 * Handles both ISO string values and Firestore Timestamp-like objects.
 */
export function normalizePlanExpiresAt(
  planExpiresAt: string | { seconds: number } | unknown,
): string {
  if (typeof planExpiresAt === "string") return planExpiresAt
  if (planExpiresAt && typeof (planExpiresAt as { seconds: number }).seconds === "number") {
    return new Date((planExpiresAt as { seconds: number }).seconds * 1000).toISOString()
  }
  return new Date().toISOString()
}
