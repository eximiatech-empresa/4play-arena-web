import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  isPlanExpired,
  isInGracePeriod,
  getDaysLeft,
  parsePlanExpiresAt,
} from '@/core/services/expiration-service'

// ─── Constantes ───────────────────────────────────────────────────────────────
const MS_D = 24 * 60 * 60 * 1000  // 1 dia em milissegundos
const MS_7D = 7 * MS_D             // 7 dias (período de graça)

// ─── isPlanExpired ────────────────────────────────────────────────────────────
// Condição: new Date(planExpiresAt).getTime() < now.getTime()
// Fronteira: exatamente no momento de expiração (< é exclusivo, == ainda activo)
//
// BVA: expiry−1ms (activo), expiry exato (activo), expiry+1ms (expirado)

describe('isPlanExpired', () => {
  const AGORA = new Date('2025-05-15T10:00:00.000Z')

  it('deve retornar false com 1ms antes da expiração (plano ainda activo)', () => {
    // Arrange — expiresAt está no futuro por 1ms
    const expiresAt = new Date(AGORA.getTime() + 1).toISOString()

    // Act & Assert
    expect(isPlanExpired(expiresAt, AGORA)).toBe(false)
  })

  it('deve retornar false exactamente no momento de expiração (condição < é exclusiva, == ainda é válido)', () => {
    // Arrange — expiresAt === agora → não satisfaz < → não expirado
    const expiresAt = AGORA.toISOString()

    // Act & Assert
    expect(isPlanExpired(expiresAt, AGORA)).toBe(false)
  })

  it('deve retornar true com 1ms após a expiração (primeiro instante expirado)', () => {
    // Arrange — expiresAt está 1ms no passado
    const expiresAt = new Date(AGORA.getTime() - 1).toISOString()

    // Act & Assert
    expect(isPlanExpired(expiresAt, AGORA)).toBe(true)
  })
})

// ─── isInGracePeriod ──────────────────────────────────────────────────────────
// Condição: currentTime > expiry && currentTime <= gracePeriodEnd
// Período de graça: 7 dias após expiração
//
// Fronteiras:
//   F1: momento de expiração (> é exclusivo — exatamente expirado NÃO está em graça)
//   F2: fim do período de graça em 7 dias (<= é inclusivo — exactamente 7 dias ainda está em graça)

describe('isInGracePeriod', () => {
  const EXPIRY = new Date('2025-05-15T10:00:00.000Z')

  it('deve retornar false quando o plano ainda está activo (1ms antes da expiração)', () => {
    // Arrange — plano não expirou → não pode estar em período de graça
    const now = new Date(EXPIRY.getTime() - 1)

    // Act & Assert
    expect(isInGracePeriod(EXPIRY.toISOString(), now)).toBe(false)
  })

  it('deve retornar false exactamente no momento de expiração (condição > é exclusiva)', () => {
    // Arrange — currentTime === expiry → não satisfaz currentTime > expiry → fora da graça
    expect(isInGracePeriod(EXPIRY.toISOString(), EXPIRY)).toBe(false)
  })

  it('deve retornar true com 1ms após a expiração (início do período de graça)', () => {
    // Arrange — primeiro instante após expiração: currentTime > expiry ✓ && <= gracePeriodEnd ✓
    const now = new Date(EXPIRY.getTime() + 1)

    // Act & Assert
    expect(isInGracePeriod(EXPIRY.toISOString(), now)).toBe(true)
  })

  it('deve retornar true no limite exacto de 7 dias após expiração (condição <= é inclusiva)', () => {
    // Arrange — exactamente 7 dias após expiry: currentTime <= gracePeriodEnd ✓
    const now = new Date(EXPIRY.getTime() + MS_7D)

    // Act & Assert
    expect(isInGracePeriod(EXPIRY.toISOString(), now)).toBe(true)
  })

  it('deve retornar false com 1ms após os 7 dias de graça (período encerrado)', () => {
    // Arrange — 7 dias + 1ms: currentTime > gracePeriodEnd → fora da graça
    const now = new Date(EXPIRY.getTime() + MS_7D + 1)

    // Act & Assert
    expect(isInGracePeriod(EXPIRY.toISOString(), now)).toBe(false)
  })
})

// ─── getDaysLeft ──────────────────────────────────────────────────────────────
// Usa new Date() internamente → requer vi.setSystemTime.
// Zera horas em horário local → aritmética em dias de calendário.
// Para evitar sensibilidade ao fuso horário, usa datas com diferença ≥ 5 dias.

describe('getDaysLeft', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    // Usa meio-dia UTC para evitar edge cases de mudança de data por fuso horário
    vi.setSystemTime(new Date('2025-05-15T12:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('deve retornar { daysLeft: 0, isExpired: false } quando expiresAt é null', () => {
    expect(getDaysLeft(null)).toEqual({ daysLeft: 0, isExpired: false })
  })

  it('deve retornar daysLeft positivo e isExpired: false quando expira em 5 dias', () => {
    // Arrange — expiresAt em 5 dias completos de calendário
    const expiresAt = new Date('2025-05-20T12:00:00.000Z')

    // Act
    const resultado = getDaysLeft(expiresAt)

    // Assert — daysLeft deve ser positivo; isExpired é false
    expect(resultado.daysLeft).toBeGreaterThan(0)
    expect(resultado.isExpired).toBe(false)
  })

  it('deve retornar daysLeft negativo e isExpired: true quando o plano expirou há 5 dias', () => {
    // Arrange — expiresAt há 5 dias
    const expiresAt = new Date('2025-05-10T12:00:00.000Z')

    // Act
    const resultado = getDaysLeft(expiresAt)

    // Assert — daysLeft deve ser negativo; isExpired é true
    expect(resultado.daysLeft).toBeLessThan(0)
    expect(resultado.isExpired).toBe(true)
  })

  it('deve retornar isExpired: false quando daysLeft = 0 (expira hoje, não é expirado)', () => {
    // Arrange — daysLeft = 0: isExpired usa `daysLeft < 0`, portanto 0 ainda é válido
    // Usamos a mesma data (hoje ao meio-dia → zerando horas = mesmo dia)
    const expiresAt = new Date('2025-05-15T12:00:00.000Z')

    // Act
    const resultado = getDaysLeft(expiresAt)

    // Assert — isExpired é false mesmo expirado hoje (só negativo = expirado)
    expect(resultado.daysLeft).toBe(0)
    expect(resultado.isExpired).toBe(false)
  })
})

// ─── parsePlanExpiresAt ───────────────────────────────────────────────────────
// Três branches distintos: null/undefined, Timestamp-like object, string

describe('parsePlanExpiresAt', () => {
  it('deve retornar null para input null', () => {
    expect(parsePlanExpiresAt(null)).toBeNull()
  })

  it('deve retornar null para input undefined', () => {
    expect(parsePlanExpiresAt(undefined)).toBeNull()
  })

  it('deve converter string ISO em Date correcta', () => {
    // Arrange
    const isoStr = '2025-05-15T10:00:00.000Z'

    // Act
    const resultado = parsePlanExpiresAt(isoStr)

    // Assert
    expect(resultado).toBeInstanceOf(Date)
    expect(resultado?.toISOString()).toBe(isoStr)
  })

  it('deve converter Firestore Timestamp-like { seconds } em Date correcta', () => {
    // Arrange
    const seconds = 1747303200 // timestamp arbitrário

    // Act
    const resultado = parsePlanExpiresAt({ seconds })

    // Assert
    expect(resultado).toBeInstanceOf(Date)
    expect(resultado?.getTime()).toBe(seconds * 1000)
  })
})
