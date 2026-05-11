import { describe, it, expect } from 'vitest'
import { computeWalletMetrics, computeDaysUntilExpiration } from '@/core/usecases/wallet/wallet-metrics'
import type { Transaction } from '@/core/entities/wallet'

const criarTransacao = (overrides: Partial<Transaction>): Transaction => ({
  id: 'tx-1',
  walletId: 'wallet-1',
  studentId: 'student-1',
  lessonId: null,
  type: 'debit',
  amount: -1,
  balanceAfter: 10,
  professorName: 'Paulinho',
  classLevel: 'Nível B',
  isOffPeak: false,
  createdAt: new Date().toISOString(),
  ...overrides,
})

describe('computeWalletMetrics', () => {
  it('deve contar apenas os débitos do mês de referência em playsUsedThisMonth', () => {
    // Arrange
    const dataReferencia = new Date('2025-05-15T10:00:00.000Z')
    const transacoes: Transaction[] = [
      criarTransacao({ id: 'tx-1', type: 'debit', amount: -3, createdAt: '2025-05-10T10:00:00.000Z' }),
      criarTransacao({ id: 'tx-2', type: 'debit', amount: -2, createdAt: '2025-05-20T10:00:00.000Z' }),
      criarTransacao({ id: 'tx-3', type: 'debit', amount: -5, createdAt: '2025-04-10T10:00:00.000Z' }), // mês anterior — deve ser ignorado
    ]

    // Act
    const resultado = computeWalletMetrics(transacoes, 15, 24, dataReferencia)

    // Assert
    expect(resultado.playsUsedThisMonth).toBe(5) // Math.abs(-3) + Math.abs(-2)
    expect(resultado.lessonsThisMonth).toBe(2)
  })

  it('deve calcular usedPlays como a diferença entre totalPlays e balance', () => {
    // Arrange
    const transacoes: Transaction[] = []

    // Act
    const resultado = computeWalletMetrics(transacoes, 10, 24, new Date())

    // Assert
    expect(resultado.usedPlays).toBe(14)
  })

  it('deve contar todos os débitos históricos em totalLessonsAttended, independente do mês', () => {
    // Arrange
    const dataReferencia = new Date('2025-05-15T10:00:00.000Z')
    const transacoes: Transaction[] = [
      criarTransacao({ id: 'tx-1', type: 'debit', amount: -1, createdAt: '2025-05-10T10:00:00.000Z' }),
      criarTransacao({ id: 'tx-2', type: 'debit', amount: -1, createdAt: '2025-03-10T10:00:00.000Z' }),
      criarTransacao({ id: 'tx-3', type: 'debit', amount: -1, createdAt: '2025-01-10T10:00:00.000Z' }),
      criarTransacao({ id: 'tx-4', type: 'purchase', amount: 24, createdAt: '2025-01-01T10:00:00.000Z' }), // não é débito
    ]

    // Act
    const resultado = computeWalletMetrics(transacoes, 10, 24, dataReferencia)

    // Assert
    expect(resultado.totalLessonsAttended).toBe(3)
  })
})

// ─── computeDaysUntilExpiration — BVA ────────────────────────────────────────
// Usa milissegundos + Math.ceil → granularidade de ms.
// Fronteira: 0 dias (expiry === reference → Math.ceil(0) = 0, não negativo)
// Nota subtil: qualquer diferença negativa > -1 dia retorna 0 (ceil arredonda para cima).

describe('computeDaysUntilExpiration', () => {
  it('deve aplicar Math.ceil e retornar 4 quando faltam 3.5 dias para a expiração', () => {
    // Arrange
    const dataReferencia = new Date('2025-05-01T00:00:00.000Z')
    const expiresAt = new Date('2025-05-04T12:00:00.000Z').toISOString() // 3.5 dias

    // Act
    const resultado = computeDaysUntilExpiration(expiresAt, dataReferencia)

    // Assert
    expect(resultado).toBe(4)
  })

  it('deve retornar 0 quando expiry === referenceDate (no limite exacto, não é negativo)', () => {
    // Arrange — Math.ceil(0 / 86400000) = 0
    const dataReferencia = new Date('2025-05-10T00:00:00.000Z')
    const expiresAt = dataReferencia.toISOString()

    // Act
    const resultado = computeDaysUntilExpiration(expiresAt, dataReferencia)

    // Assert — 0 significa "expira hoje", mas ainda não é negativo
    expect(resultado).toBe(0)
  })

  it('deve retornar −0 (IEEE 754) quando o plano expirou há 1ms (menos de 1 dia completo)', () => {
    // Math.ceil(-1/86400000) = Math.ceil(-1.157e-8) → retorna −0 em IEEE 754.
    // Em JavaScript, −0 é numericamente igual a 0 mas Object.is(-0, 0) = false.
    // O ponto crítico é que NÃO retorna −1 (não houve 1 dia completo de expiração).
    const dataReferencia = new Date('2025-05-10T00:00:00.000Z')
    const expiresAt = new Date(dataReferencia.getTime() - 1).toISOString()

    // Act
    const resultado = computeDaysUntilExpiration(expiresAt, dataReferencia)

    // Assert — documenta o −0 IEEE 754 e garante que não chegou a −1
    expect(resultado).toBe(-0)
    expect(resultado).toBeGreaterThan(-1)
  })

  it('deve retornar -1 exactamente quando o plano expirou há 1 dia completo', () => {
    // Arrange — Math.ceil(-86400000 / 86400000) = Math.ceil(-1) = -1
    const dataReferencia = new Date('2025-05-10T00:00:00.000Z')
    const expiresAt = new Date('2025-05-09T00:00:00.000Z').toISOString() // exactamente -1 dia

    // Act
    const resultado = computeDaysUntilExpiration(expiresAt, dataReferencia)

    // Assert
    expect(resultado).toBe(-1)
  })

  it('deve retornar −0 (IEEE 754) quando o plano expirou há 23h59m59s (menos de 1 dia completo)', () => {
    // Math.ceil(-86399000 / 86400000) = Math.ceil(-0.9999...) → retorna −0, não −1
    const dataReferencia = new Date('2025-05-10T00:00:00.000Z')
    const expiresAt = new Date(dataReferencia.getTime() - (24 * 60 * 60 * 1000 - 1000)).toISOString()

    // Act
    const resultado = computeDaysUntilExpiration(expiresAt, dataReferencia)

    // Assert — −0: expirações de menos de 1 dia completo ainda aparecem como "0 dias"
    expect(resultado).toBe(-0)
    expect(resultado).toBeGreaterThan(-1)
  })
})
