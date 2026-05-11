import { describe, it, expect } from 'vitest'
import { deriveLessonDisplayStatus } from '@/core/math/lesson-display'
import type { Lesson } from '@/core/entities/lesson'

const criarAulaMock = (overrides: Partial<Lesson> = {}): Lesson => ({
  id: 'aula-1',
  professorId: 'paulinho',
  professorName: 'Paulinho',
  level: 'Nível B',
  levelIndex: 4,
  dateTime: '2025-05-20T10:00:00.000Z',
  court: 'Quadra 1',
  totalSpots: 8,
  enrolledCount: 2,
  isEnrolled: false,
  checkInStatus: 'open',
  previewConsumption: 8,
  isOffPeak: false,
  status: 'scheduled',
  wasRescheduled: false,
  titularIds: [],
  reservaIds: [],
  enrolledStudentIds: [],
  checkedInStudentIds: [],
  absentStudentIds: [],
  ...overrides,
})

// ─── deriveLessonDisplayStatus ────────────────────────────────────────────────
// Lógica:
//   isCancelled   = status === "cancelled"
//   isRescheduled = wasRescheduled && !isCancelled
//   isBlocked     = isCancelled || isRescheduled
//   isActive      = !isCancelled && !isRescheduled
//
// Matriz de estados (4 combinações relevantes):
//   status=scheduled, wasRescheduled=false → aula normal (isActive)
//   status=scheduled, wasRescheduled=true  → reagendada (isRescheduled)
//   status=cancelled, wasRescheduled=false → cancelada (isCancelled)
//   status=cancelled, wasRescheduled=true  → cancelada ganha prioridade (isRescheduled=false!)

describe('deriveLessonDisplayStatus', () => {
  it('deve retornar isActive: true para aula normal (scheduled, não reagendada)', () => {
    // Arrange
    const aula = criarAulaMock({ status: 'scheduled', wasRescheduled: false })

    // Act
    const resultado = deriveLessonDisplayStatus(aula)

    // Assert
    expect(resultado).toEqual({
      isCancelled: false,
      isRescheduled: false,
      isBlocked: false,
      isActive: true,
    })
  })

  it('deve retornar isRescheduled: true para aula reagendada (scheduled + wasRescheduled)', () => {
    // Arrange
    const aula = criarAulaMock({ status: 'scheduled', wasRescheduled: true })

    // Act
    const resultado = deriveLessonDisplayStatus(aula)

    // Assert
    expect(resultado).toEqual({
      isCancelled: false,
      isRescheduled: true,
      isBlocked: true,
      isActive: false,
    })
  })

  it('deve retornar isCancelled: true para aula cancelada (status=cancelled, não reagendada)', () => {
    // Arrange
    const aula = criarAulaMock({ status: 'cancelled', wasRescheduled: false })

    // Act
    const resultado = deriveLessonDisplayStatus(aula)

    // Assert
    expect(resultado).toEqual({
      isCancelled: true,
      isRescheduled: false,
      isBlocked: true,
      isActive: false,
    })
  })

  it('deve tratar cancelada como cancelada mesmo com wasRescheduled=true (cancelled tem prioridade)', () => {
    // Regra subtil: isRescheduled = wasRescheduled && !isCancelled
    // Uma aula que foi reagendada E depois cancelada deve aparecer como cancelada, não reagendada.
    const aula = criarAulaMock({ status: 'cancelled', wasRescheduled: true })

    // Act
    const resultado = deriveLessonDisplayStatus(aula)

    // Assert — isCancelled ganha prioridade; isRescheduled deve ser false
    expect(resultado.isCancelled).toBe(true)
    expect(resultado.isRescheduled).toBe(false)
    expect(resultado.isBlocked).toBe(true)
    expect(resultado.isActive).toBe(false)
  })

  it('deve retornar isActive: true para aula concluída (status=finished, não reagendada)', () => {
    // Arrange — "finished" não é cancelled nem blocked → isActive = true
    const aula = criarAulaMock({ status: 'finished', wasRescheduled: false })

    // Act
    const resultado = deriveLessonDisplayStatus(aula)

    // Assert
    expect(resultado).toEqual({
      isCancelled: false,
      isRescheduled: false,
      isBlocked: false,
      isActive: true,
    })
  })
})
