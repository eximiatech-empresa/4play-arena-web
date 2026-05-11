import { describe, it, expect } from 'vitest'
import {
  detectGhostLessons,
  detectFullLessons,
  runOperationalRadar,
} from '@/core/math/operational-radar'
import type { Lesson } from '@/core/entities/lesson'

const criarAulaMock = (overrides: Partial<Lesson> = {}): Lesson => ({
  id: 'aula-1',
  professorId: 'paulinho',
  professorName: 'Paulinho',
  level: 'Nível B',
  levelIndex: 4,
  dateTime: '2025-05-16T10:00:00.000Z', // amanhã por padrão
  court: 'Quadra 1',
  totalSpots: 8,
  enrolledCount: 0,
  isEnrolled: false,
  checkInStatus: 'not_open',
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

// Referência fixa: 15 de Maio de 2025 ao meio-dia UTC
// "Amanhã" = 16 de Maio; "Hoje" = 15 de Maio; "Depois de amanhã" = 17 de Maio
const HOJE = new Date('2025-05-15T12:00:00.000Z')
const DT_AMANHA = '2025-05-16T10:00:00.000Z'
const DT_HOJE = '2025-05-15T18:00:00.000Z'
const DT_POS_AMANHA = '2025-05-17T10:00:00.000Z'

// ─── detectGhostLessons ───────────────────────────────────────────────────────
// Detecta aulas de "amanhã" com 0 inscrições.

describe('detectGhostLessons', () => {
  it('deve detectar aula de amanhã com 0 inscrições como ghost lesson', () => {
    // Arrange
    const aulas = [criarAulaMock({ dateTime: DT_AMANHA, enrolledCount: 0 })]

    // Act
    const resultado = detectGhostLessons(aulas, HOJE)

    // Assert
    expect(resultado).toHaveLength(1)
    expect(resultado[0].type).toBe('ghost_lesson')
    expect(resultado[0].lessonId).toBe('aula-1')
  })

  it('deve ignorar aula de amanhã que já tem inscrições', () => {
    // Arrange — 1 inscrito → não é ghost
    const aulas = [criarAulaMock({ dateTime: DT_AMANHA, enrolledCount: 1 })]

    // Act
    const resultado = detectGhostLessons(aulas, HOJE)

    // Assert
    expect(resultado).toHaveLength(0)
  })

  it('deve ignorar aula de hoje com 0 inscrições (só detecta amanhã)', () => {
    // Arrange
    const aulas = [criarAulaMock({ dateTime: DT_HOJE, enrolledCount: 0 })]

    // Act
    const resultado = detectGhostLessons(aulas, HOJE)

    // Assert
    expect(resultado).toHaveLength(0)
  })

  it('deve ignorar aula de depois de amanhã com 0 inscrições', () => {
    // Arrange
    const aulas = [criarAulaMock({ dateTime: DT_POS_AMANHA, enrolledCount: 0 })]

    // Act
    const resultado = detectGhostLessons(aulas, HOJE)

    // Assert
    expect(resultado).toHaveLength(0)
  })

  it('deve detectar múltiplas ghost lessons no mesmo dia', () => {
    // Arrange
    const aulas = [
      criarAulaMock({ id: 'aula-1', dateTime: DT_AMANHA, enrolledCount: 0 }),
      criarAulaMock({ id: 'aula-2', dateTime: DT_AMANHA, enrolledCount: 0 }),
      criarAulaMock({ id: 'aula-3', dateTime: DT_AMANHA, enrolledCount: 2 }), // não ghost
    ]

    // Act
    const resultado = detectGhostLessons(aulas, HOJE)

    // Assert
    expect(resultado).toHaveLength(2)
    expect(resultado.map((r) => r.lessonId)).toEqual(['aula-1', 'aula-2'])
  })
})

// ─── detectFullLessons ────────────────────────────────────────────────────────
// Detecta aulas futuras (após referenceDate) com enrolledCount >= totalSpots.

describe('detectFullLessons', () => {
  it('deve detectar aula futura com todas as vagas ocupadas', () => {
    // Arrange
    const aulas = [criarAulaMock({ dateTime: DT_AMANHA, enrolledCount: 8, totalSpots: 8 })]

    // Act
    const resultado = detectFullLessons(aulas, HOJE)

    // Assert
    expect(resultado).toHaveLength(1)
    expect(resultado[0].type).toBe('full_lesson')
  })

  it('deve ignorar aula futura que ainda tem vagas disponíveis', () => {
    // Arrange
    const aulas = [criarAulaMock({ dateTime: DT_AMANHA, enrolledCount: 7, totalSpots: 8 })]

    // Act
    const resultado = detectFullLessons(aulas, HOJE)

    // Assert
    expect(resultado).toHaveLength(0)
  })

  it('deve ignorar aula passada mesmo que esteja cheia (filtro: apenas futuras)', () => {
    // Arrange — aula ontem, lotada
    const aulaPassada = criarAulaMock({
      dateTime: '2025-05-14T10:00:00.000Z',
      enrolledCount: 8,
      totalSpots: 8,
    })

    // Act
    const resultado = detectFullLessons([aulaPassada], HOJE)

    // Assert
    expect(resultado).toHaveLength(0)
  })

  it('deve incluir dados correctos no alerta gerado', () => {
    // Arrange
    const aula = criarAulaMock({
      id: 'aula-lotada',
      dateTime: DT_AMANHA,
      enrolledCount: 8,
      totalSpots: 8,
      professorName: 'Marília',
      court: 'Quadra 2',
      level: 'Nível A',
    })

    // Act
    const resultado = detectFullLessons([aula], HOJE)

    // Assert
    expect(resultado[0]).toMatchObject({
      lessonId: 'aula-lotada',
      type: 'full_lesson',
      professorName: 'Marília',
      court: 'Quadra 2',
      enrolledCount: 8,
      totalSpots: 8,
    })
  })
})

// ─── runOperationalRadar ──────────────────────────────────────────────────────
// Combina ghost + full lessons; ghost lessons aparecem primeiro.

describe('runOperationalRadar', () => {
  it('deve combinar ghost lessons e full lessons numa lista unificada', () => {
    // Arrange
    const aulas = [
      criarAulaMock({ id: 'ghost', dateTime: DT_AMANHA, enrolledCount: 0 }),
      criarAulaMock({ id: 'full', dateTime: DT_AMANHA, enrolledCount: 8, totalSpots: 8 }),
    ]

    // Act
    const resultado = runOperationalRadar(aulas, HOJE)

    // Assert
    expect(resultado).toHaveLength(2)
    expect(resultado[0].type).toBe('ghost_lesson')
    expect(resultado[1].type).toBe('full_lesson')
  })

  it('deve retornar lista vazia quando não há alertas', () => {
    // Arrange — aula de amanhã com inscrições, mas não cheia
    const aulas = [criarAulaMock({ dateTime: DT_AMANHA, enrolledCount: 4, totalSpots: 8 })]

    // Act
    const resultado = runOperationalRadar(aulas, HOJE)

    // Assert
    expect(resultado).toHaveLength(0)
  })
})
