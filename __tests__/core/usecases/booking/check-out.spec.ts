import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { calculateRefundAmount, executeCheckOut } from '@/core/usecases/booking/check-out'
import { NotAuthenticatedError } from '@/core/errors/exceptions'
import type { Lesson } from '@/core/entities/lesson'

// ─── Constantes ───────────────────────────────────────────────────────────────
const MS_H = 3_600_000
// CANCEL_REFUND_MIN_HOURS = 4 — ponto de fronteira desta suite
const LIMITE_4H_MS = 4 * MS_H

const AGORA = new Date('2025-01-15T10:00:00.000Z')

// ─── Factory de mock ──────────────────────────────────────────────────────────
const criarAulaMock = (overrides: Partial<Lesson> = {}): Lesson => ({
  id: 'aula-1',
  professorId: 'paulinho',
  professorName: 'Paulinho',
  level: 'Nível B',
  levelIndex: 4,
  dateTime: new Date().toISOString(),
  court: 'Quadra 1',
  totalSpots: 8,
  enrolledCount: 2,
  isEnrolled: true,
  checkInStatus: 'done',
  previewConsumption: 8,
  isPeak: false,
  status: 'scheduled',
  wasRescheduled: false,
  titularIds: [],
  reservaIds: [],
  enrolledStudentIds: [],
  checkedInStudentIds: [],
  absentStudentIds: [],
  ...overrides,
})

// ─── calculateRefundAmount ────────────────────────────────────────────────────
// Delegação interna: chama canCancelCheckIn(new Date(lesson.dateTime)) sem
// passar "now", portanto usa new Date() — requer vi.setSystemTime.
//
// Fronteira: CANCEL_REFUND_MIN_HOURS = 4h (condição >= 4)
// BVA: 4h-1ms (false → 0), 4h (true → previewConsumption), 4h+1ms (true → previewConsumption)

describe('calculateRefundAmount', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(AGORA)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('deve devolver 0 com exatamente 4h menos 1ms antes da aula (imediatamente abaixo do limite)', () => {
    // Arrange — hoursToClass = 3h59m59.999s → não satisfaz >= 4 → sem reembolso
    const dataAula = new Date(AGORA.getTime() + LIMITE_4H_MS - 1).toISOString()
    const aula = criarAulaMock({ dateTime: dataAula, previewConsumption: 8 })

    // Act
    const resultado = calculateRefundAmount(aula)

    // Assert
    expect(resultado).toBe(0)
  })

  it('deve devolver o previewConsumption no limite exato de 4h (condição >= é inclusiva)', () => {
    // Arrange — hoursToClass = 4.0 → satisfaz >= 4 → reembolso total
    const dataAula = new Date(AGORA.getTime() + LIMITE_4H_MS).toISOString()
    const aula = criarAulaMock({ dateTime: dataAula, previewConsumption: 8 })

    // Act
    const resultado = calculateRefundAmount(aula)

    // Assert
    expect(resultado).toBe(8)
  })

  it('deve devolver o previewConsumption com 4h mais 1ms antes da aula (imediatamente acima do limite)', () => {
    // Arrange — hoursToClass = 4h + 1ms → satisfaz >= 4 → reembolso total
    const dataAula = new Date(AGORA.getTime() + LIMITE_4H_MS + 1).toISOString()
    const aula = criarAulaMock({ dateTime: dataAula, previewConsumption: 8 })

    // Act
    const resultado = calculateRefundAmount(aula)

    // Assert
    expect(resultado).toBe(8)
  })
})

// ─── executeCheckOut ──────────────────────────────────────────────────────────

describe('executeCheckOut', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(AGORA)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('deve lançar NotAuthenticatedError quando userId é nulo', async () => {
    // Arrange
    const aula = criarAulaMock()
    const checkOutFn = vi.fn()

    // Act & Assert
    await expect(executeCheckOut(null, aula, checkOutFn)).rejects.toThrow(NotAuthenticatedError)
  })

  it('deve retornar { refunded: true } e passar os argumentos corretos ao checkOutFn', async () => {
    // Arrange — aula dentro do prazo de reembolso (6h > 4h)
    const dataAula = new Date(AGORA.getTime() + 6 * MS_H).toISOString()
    const aula = criarAulaMock({ dateTime: dataAula, previewConsumption: 8 })
    const checkOutFn = vi.fn().mockResolvedValue(undefined)

    // Act
    const resultado = await executeCheckOut('user-1', aula, checkOutFn)

    // Assert
    expect(resultado).toEqual({ refunded: true })
    expect(checkOutFn).toHaveBeenCalledWith('user-1', 'aula-1', 8, 'Paulinho')
  })

  it('deve retornar { refunded: false } quando o cancelamento ocorre fora do prazo', async () => {
    // Arrange — aula a 1h: hoursToClass < 4 → refundAmount = 0
    const dataAula = new Date(AGORA.getTime() + 1 * MS_H).toISOString()
    const aula = criarAulaMock({ dateTime: dataAula, previewConsumption: 8 })
    const checkOutFn = vi.fn().mockResolvedValue(undefined)

    // Act
    const resultado = await executeCheckOut('user-1', aula, checkOutFn)

    // Assert
    expect(resultado).toEqual({ refunded: false })
    expect(checkOutFn).toHaveBeenCalledWith('user-1', 'aula-1', 0, 'Paulinho')
  })
})
