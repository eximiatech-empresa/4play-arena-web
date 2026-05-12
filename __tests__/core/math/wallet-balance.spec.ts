import { describe, it, expect, vi } from 'vitest'
import { calculateTotalPlays, normalizePlanExpiresAt } from '@/core/math/wallet-balance'
import type { Transaction } from '@/core/entities/wallet'

const criarTransacao = (overrides: Partial<Transaction>): Transaction => ({
  id: 'tx-1',
  walletId: 'wallet-1',
  studentId: 'student-1',
  lessonId: null,
  type: 'purchase',
  amount: 8,
  balanceAfter: 8,
  professorName: null,
  classLevel: null,
  isOffPeak: null,
  createdAt: new Date().toISOString(),
  ...overrides,
})

// ─── calculateTotalPlays ──────────────────────────────────────────────────────
// Lógica: soma purchase + credit; se soma = 0 (falsy), usa fallback do plano.
// Fallbacks (modelo Plays — PLAN_CONFIGS[plan].totalPlays):
//   mensal:     80 Plays
//   trimestral: 240 Plays
//   semestral:  480 Plays

describe('calculateTotalPlays', () => {
  it('deve somar apenas transações de tipo "purchase" e "credit", ignorando débitos', () => {
    // Arrange
    const transacoes: Transaction[] = [
      criarTransacao({ id: 'tx-1', type: 'purchase', amount: 240 }),
      criarTransacao({ id: 'tx-2', type: 'credit', amount: 10 }),
      criarTransacao({ id: 'tx-3', type: 'debit', amount: -13 }),    // ignorado
      criarTransacao({ id: 'tx-4', type: 'adjustment', amount: 0 }), // ignorado
    ]

    // Act
    const resultado = calculateTotalPlays(transacoes, 'trimestral')

    // Assert
    expect(resultado).toBe(250) // 240 + 10
  })

  it('deve usar o fallback do plano trimestral (240 Plays) quando não há transações', () => {
    const resultado = calculateTotalPlays([], 'trimestral')

    expect(resultado).toBe(240)
  })

  it('deve usar o fallback do plano mensal (80 Plays) quando não há transações', () => {
    const resultado = calculateTotalPlays([], 'mensal')

    expect(resultado).toBe(80)
  })

  it('deve usar o fallback do plano semestral (480 Plays) quando não há transações', () => {
    const resultado = calculateTotalPlays([], 'semestral')

    expect(resultado).toBe(480)
  })

  it('deve cair no fallback quando há apenas débitos (soma de purchase+credit = 0, que é falsy)', () => {
    // Caso subtil: lista com transações mas nenhuma do tipo purchase/credit
    // → filter retorna [] → reduce retorna 0 → 0 é falsy → usa fallback do plano
    const transacoes: Transaction[] = [
      criarTransacao({ id: 'tx-1', type: 'debit', amount: -13 }),
      criarTransacao({ id: 'tx-2', type: 'expiration', amount: -10 }),
    ]

    // Act — plano trimestral: 240 Plays
    const resultado = calculateTotalPlays(transacoes, 'trimestral')

    // Assert
    expect(resultado).toBe(240)
  })
})

// ─── normalizePlanExpiresAt ───────────────────────────────────────────────────
// Três branches:
//   1. string       → devolve tal-e-qual
//   2. { seconds }  → converte Firestore Timestamp para ISO string
//   3. outro/null   → fallback: new Date().toISOString()

describe('normalizePlanExpiresAt', () => {
  it('deve devolver a string ISO directamente quando o input já é uma string', () => {
    // Arrange
    const isoStr = '2025-05-15T10:00:00.000Z'

    // Act & Assert
    expect(normalizePlanExpiresAt(isoStr)).toBe(isoStr)
  })

  it('deve converter Firestore Timestamp-like { seconds } para ISO string correcta', () => {
    // Arrange
    const seconds = 1747303200

    // Act
    const resultado = normalizePlanExpiresAt({ seconds })

    // Assert
    expect(resultado).toBe(new Date(seconds * 1000).toISOString())
  })

  it('deve retornar a data actual como fallback para input desconhecido (sem "seconds")', () => {
    // Arrange — fixa o relógio para um resultado determinístico
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-05-15T10:00:00.000Z'))

    // Act
    const resultado = normalizePlanExpiresAt({ tipo: 'formato-desconhecido' })

    // Assert
    expect(resultado).toBe('2025-05-15T10:00:00.000Z')

    vi.useRealTimers()
  })

  it('deve retornar a data actual como fallback para input null (falsy → salta branch do Timestamp)', () => {
    // Arrange
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-05-15T10:00:00.000Z'))

    // Act
    const resultado = normalizePlanExpiresAt(null)

    // Assert
    expect(resultado).toBe('2025-05-15T10:00:00.000Z')

    vi.useRealTimers()
  })
})
