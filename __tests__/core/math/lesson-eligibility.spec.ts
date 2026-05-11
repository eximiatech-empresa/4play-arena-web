import { describe, it, expect } from 'vitest'
import { formatStudentLevel, computeLessonEligibility } from '@/core/math/lesson-eligibility'
import type { Lesson } from '@/core/entities/lesson'

// STUDENT_LEVELS = ["Principiante","Iniciante","Nível D","Nível C","Nível B","Nível A","Profissional"]
// Índices:                  0           1          2          3          4          5           6

const criarAulaMock = (overrides: Partial<Lesson> = {}): Lesson => ({
  id: 'aula-1',
  professorId: 'paulinho',
  professorName: 'Paulinho',
  level: 'Nível B',
  levelIndex: 4,
  dateTime: '2025-05-20T10:00:00.000Z',
  court: 'Quadra 1',
  totalSpots: 8,
  enrolledCount: 4,
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

// ─── formatStudentLevel ───────────────────────────────────────────────────────

describe('formatStudentLevel', () => {
  it('deve converter letra abreviada "A" para "Nível A" e retornar índice 5', () => {
    const resultado = formatStudentLevel('A')

    expect(resultado.formattedCurrentLevel).toBe('Nível A')
    expect(resultado.studentLevelIndex).toBe(5)
  })

  it('deve converter letra abreviada "D" para "Nível D" e retornar índice 2', () => {
    const resultado = formatStudentLevel('D')

    expect(resultado.formattedCurrentLevel).toBe('Nível D')
    expect(resultado.studentLevelIndex).toBe(2)
  })

  it('deve aceitar nível já formatado "Nível B" sem transformação (índice 4)', () => {
    const resultado = formatStudentLevel('Nível B')

    expect(resultado.formattedCurrentLevel).toBe('Nível B')
    expect(resultado.studentLevelIndex).toBe(4)
  })

  it('deve aceitar "Profissional" sem transformação e retornar o índice máximo (6)', () => {
    const resultado = formatStudentLevel('Profissional')

    expect(resultado.formattedCurrentLevel).toBe('Profissional')
    expect(resultado.studentLevelIndex).toBe(6)
  })

  it('deve usar "Iniciante" como fallback quando o nível é undefined (índice 1)', () => {
    const resultado = formatStudentLevel(undefined)

    expect(resultado.formattedCurrentLevel).toBe('Iniciante')
    expect(resultado.studentLevelIndex).toBe(1)
  })

  it('deve retornar computedLevelIndex=-1 e studentLevelIndex=0 para nível desconhecido', () => {
    // Arrange — nível não consta em STUDENT_LEVELS → indexOf retorna -1 → fallback para índice 0
    const resultado = formatStudentLevel('Nível Z')

    expect(resultado.computedLevelIndex).toBe(-1)
    expect(resultado.studentLevelIndex).toBe(0)
  })
})

// ─── computeLessonEligibility ─────────────────────────────────────────────────
// isActionable = !isLevelBlocked && hasBalance && hasSpot && (status ∈ {open, enrolled_only})
//
// Risco: AND composto com 4 condições — cada uma pode silenciosamente desactivar isActionable.

describe('computeLessonEligibility', () => {

  describe('isActionable — AND composto de 4 condições', () => {
    it('deve retornar isActionable: true quando todas as condições são satisfeitas', () => {
      // Arrange — nível 4 >= levelIndex 3, balance 10 >= previewConsumption 8, vagas livres, status open
      const aula = criarAulaMock({ levelIndex: 3, checkInStatus: 'open' })

      // Act
      const resultado = computeLessonEligibility(aula, 4, 10)

      // Assert
      expect(resultado.isActionable).toBe(true)
    })

    it('deve anular isActionable quando o nível do aluno está abaixo do mínimo da aula', () => {
      // Arrange — studentLevelIndex 3 < levelIndex 5 → isLevelBlocked = true
      const aula = criarAulaMock({ levelIndex: 5, checkInStatus: 'open' })

      // Act
      const resultado = computeLessonEligibility(aula, 3, 10)

      // Assert
      expect(resultado.isLevelBlocked).toBe(true)
      expect(resultado.isActionable).toBe(false)
    })

    it('deve anular isActionable quando o saldo é insuficiente para o consumo previsto', () => {
      // Arrange — balance 7 < previewConsumption 8
      const aula = criarAulaMock({ previewConsumption: 8, checkInStatus: 'open' })

      // Act
      const resultado = computeLessonEligibility(aula, 4, 7)

      // Assert
      expect(resultado.hasBalance).toBe(false)
      expect(resultado.isActionable).toBe(false)
    })

    it('deve anular isActionable quando a aula está cheia e o aluno não está inscrito', () => {
      // Arrange — totalSpots = enrolledCount, isEnrolled = false → hasSpot = false
      const aula = criarAulaMock({ totalSpots: 4, enrolledCount: 4, isEnrolled: false, checkInStatus: 'open' })

      // Act
      const resultado = computeLessonEligibility(aula, 4, 10)

      // Assert
      expect(resultado.spotsLeft).toBe(0)
      expect(resultado.hasSpot).toBe(false)
      expect(resultado.isActionable).toBe(false)
    })

    it('deve anular isActionable quando o status é "done" (aluno já fez check-in)', () => {
      // Arrange
      const aula = criarAulaMock({ checkInStatus: 'done' })

      // Act
      const resultado = computeLessonEligibility(aula, 4, 10)

      // Assert
      expect(resultado.isDone).toBe(true)
      expect(resultado.isActionable).toBe(false)
    })

    it('deve anular isActionable quando o status é "not_open" (fora da janela de check-in)', () => {
      // Arrange
      const aula = criarAulaMock({ checkInStatus: 'not_open' })

      // Act
      const resultado = computeLessonEligibility(aula, 4, 10)

      // Assert
      expect(resultado.isActionable).toBe(false)
    })

    it('deve anular isActionable quando o status é "closed"', () => {
      // Arrange
      const aula = criarAulaMock({ checkInStatus: 'closed' })

      // Act
      const resultado = computeLessonEligibility(aula, 4, 10)

      // Assert
      expect(resultado.isActionable).toBe(false)
    })

    it('deve manter isActionable: true para status "enrolled_only" quando o aluno está inscrito', () => {
      // Arrange — enrolled_only é um dos dois status válidos
      const aula = criarAulaMock({ checkInStatus: 'enrolled_only', isEnrolled: true })

      // Act
      const resultado = computeLessonEligibility(aula, 4, 10)

      // Assert
      expect(resultado.isActionable).toBe(true)
    })
  })

  describe('hasSpot — regra: spotsLeft > 0 OU isEnrolled', () => {
    it('deve garantir hasSpot: true quando a aula está cheia mas o aluno já está inscrito', () => {
      // Regra de negócio: aluno inscrito tem vaga garantida mesmo com aula lotada
      const aula = criarAulaMock({ totalSpots: 4, enrolledCount: 4, isEnrolled: true, checkInStatus: 'open' })

      // Act
      const resultado = computeLessonEligibility(aula, 4, 10)

      // Assert
      expect(resultado.spotsLeft).toBe(0)
      expect(resultado.hasSpot).toBe(true)
      expect(resultado.isActionable).toBe(true)
    })

    it('deve calcular spotsLeft correctamente como totalSpots - enrolledCount', () => {
      // Arrange
      const aula = criarAulaMock({ totalSpots: 8, enrolledCount: 5 })

      // Act
      const resultado = computeLessonEligibility(aula, 4, 10)

      // Assert
      expect(resultado.spotsLeft).toBe(3)
    })
  })

  describe('hasBalance — regra: walletBalance >= previewConsumption', () => {
    it('deve retornar hasBalance: true exactamente no limite de saldo igual ao consumo', () => {
      // Arrange — balance === previewConsumption (>= inclusivo)
      const aula = criarAulaMock({ previewConsumption: 8, checkInStatus: 'open' })

      // Act
      const resultado = computeLessonEligibility(aula, 4, 8)

      // Assert
      expect(resultado.hasBalance).toBe(true)
    })

    it('deve retornar hasBalance: false quando o saldo está 1 play abaixo do consumo', () => {
      // Arrange
      const aula = criarAulaMock({ previewConsumption: 8, checkInStatus: 'open' })

      // Act
      const resultado = computeLessonEligibility(aula, 4, 7)

      // Assert
      expect(resultado.hasBalance).toBe(false)
    })
  })
})
