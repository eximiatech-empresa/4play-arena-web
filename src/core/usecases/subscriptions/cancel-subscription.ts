import {
  SubscriptionNotFoundError,
  SubscriptionCancelPendingError,
  SubscriptionAlreadyCanceledError,
} from "@/core/errors/exceptions"
import { ERROS } from "@/core/errors/erros"

export interface SubscriptionState {
  exists: boolean
  cancelAtPeriodEnd: boolean
  status: string
}

/**
 * Validates that a subscription can be soft-cancelled.
 * Throws a typed domain error if the operation is not allowed.
 *
 * Pure function — no Firebase imports.
 * Call this before writing to Firestore in the infrastructure layer.
 */
export function validateCancelSubscription(state: SubscriptionState): void {
  if (!state.exists) throw new SubscriptionNotFoundError(ERROS.ASSINATURA_NAO_ENCONTRADA)
  if (state.cancelAtPeriodEnd) throw new SubscriptionCancelPendingError(ERROS.CANCELAMENTO_JA_SOLICITADO)
  if (state.status === "canceled") throw new SubscriptionAlreadyCanceledError(ERROS.ASSINATURA_JA_CANCELADA)
}
