// src/core/usecases/wallet/purchase-package.ts

import { InvalidPackagePurchaseError, ExpiredPlanError } from "@/core/errors/exceptions"
import { ERROS } from "@/core/errors/erros"

// ─── Business Rule: Expired Plan + Package Plays ───────────────────────────
// The plan is the student's "passport" to classes. A package only recharges
// plays — it does NOT extend the plan or reset expiry.
//
// Decision (confirmed with client): a student with an EXPIRED plan but
// remaining plays (from a package) CANNOT check in. The plan expiry gate in
// the check-in use case is the enforcer. This use case blocks the purchase
// upfront so the student never ends up in that state.
// ───────────────────────────────────────────────────────────────────────────

export interface PackagePurchaseInput {
  /** Current play balance in the wallet. */
  readonly currentBalance: number
  /** Total plays originally granted (for reference/display). */
  readonly currentTotalPlays: number
  /** Number of plays this package adds. Must be a positive integer. */
  readonly packagePlays: number
  /**
   * Plan expiry as ISO 8601 string.
   * Purchase is blocked when the plan is already expired (see business rule above).
   */
  readonly planExpiresAt: string
}

export interface PackagePurchaseResult {
  /** New play balance after the package is applied. */
  readonly newBalance: number
  /** New totalPlays after the package is applied. */
  readonly newTotalPlays: number
  /** Number of plays effectively added (equals packagePlays). */
  readonly playsAdded: number
}

/**
 * Calculates the wallet state after purchasing a play package.
 *
 * Rules enforced:
 *  - Package plays must be a positive integer.
 *  - The student's plan must not be expired (plan is the "passport").
 *  - playValue, plan, and expiresAt are never modified by a package purchase.
 *
 * Pure function — no side effects, safe to test in isolation.
 */
export function buildPackagePurchase(
  input: PackagePurchaseInput,
  now = new Date(),
): PackagePurchaseResult {
  if (!Number.isInteger(input.packagePlays) || input.packagePlays < 1) {
    throw new InvalidPackagePurchaseError(ERROS.PACOTE_PLAYS_INVALIDO)
  }

  if (new Date(input.planExpiresAt) < now) {
    throw new ExpiredPlanError(ERROS.PLANO_EXPIRADO_PACOTE)
  }

  return {
    newBalance: input.currentBalance + input.packagePlays,
    newTotalPlays: input.currentTotalPlays + input.packagePlays,
    playsAdded: input.packagePlays,
  }
}
