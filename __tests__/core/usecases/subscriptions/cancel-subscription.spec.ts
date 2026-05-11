import { describe, it, expect } from 'vitest'
import { validateCancelSubscription } from '@/core/usecases/subscriptions/cancel-subscription'
import {
  SubscriptionNotFoundError,
  SubscriptionCancelPendingError,
  SubscriptionAlreadyCanceledError,
} from '@/core/errors/exceptions'

describe('validateCancelSubscription', () => {
  it('deve lançar SubscriptionNotFoundError quando a assinatura não existe', () => {
    // Arrange
    const estado = { exists: false, cancelAtPeriodEnd: false, status: 'active' }

    // Act & Assert
    expect(() => validateCancelSubscription(estado)).toThrow(SubscriptionNotFoundError)
  })

  it('deve lançar SubscriptionCancelPendingError quando o cancelamento já está solicitado', () => {
    // Arrange
    const estado = { exists: true, cancelAtPeriodEnd: true, status: 'active' }

    // Act & Assert
    expect(() => validateCancelSubscription(estado)).toThrow(SubscriptionCancelPendingError)
  })

  it('deve lançar SubscriptionAlreadyCanceledError quando a assinatura já está cancelada', () => {
    // Arrange
    const estado = { exists: true, cancelAtPeriodEnd: false, status: 'canceled' }

    // Act & Assert
    expect(() => validateCancelSubscription(estado)).toThrow(SubscriptionAlreadyCanceledError)
  })

  it('não deve lançar nenhum erro para uma assinatura ativa e válida', () => {
    // Arrange
    const estado = { exists: true, cancelAtPeriodEnd: false, status: 'active' }

    // Act & Assert
    expect(() => validateCancelSubscription(estado)).not.toThrow()
  })

  it('não deve lançar erro para assinatura em período de teste (trialing) ainda activa', () => {
    // Arrange
    const estado = { exists: true, cancelAtPeriodEnd: false, status: 'trialing' }

    // Act & Assert
    expect(() => validateCancelSubscription(estado)).not.toThrow()
  })
})
