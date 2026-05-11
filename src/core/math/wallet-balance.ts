import { PLANS } from "@/core/constants/professors"
import { PLAN_MULTIPLIERS } from "@/core/constants/plan-pricing"
import type { Transaction, Plan } from "@/core/entities/wallet"

/**
 * Derives the student's total plays from their transaction history.
 *
 * Sums all `purchase` and `credit` transactions. Falls back to the plan's
 * default hours × plan multiplier when no transactions exist yet.
 */
export function calculateTotalPlays(transactions: Transaction[], planId: Plan): number {
  const planData = PLANS[planId]
  return (
    transactions
      .filter((t) => t.type === "purchase" || t.type === "credit")
      .reduce((sum, t) => sum + t.amount, 0) ||
    planData.hours * PLAN_MULTIPLIERS[planId]
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
