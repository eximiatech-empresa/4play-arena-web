import { describe, it, expect } from 'vitest'
import { buildDateList } from '@/core/usecases/lessons/create-lesson'
import { RecurrenceInputError } from '@/core/errors/exceptions'
import type { CreateLessonInput } from '@/core/entities/lesson'

const criarInputBase = (overrides: Partial<CreateLessonInput> = {}): CreateLessonInput => ({
  description: 'Aula de tênis',
  professorId: 'paulinho',
  professorName: 'Paulinho',
  lessonPrice: 0.85,
  level: 'Nível B',
  levelIndex: 4,
  dateTime: '2025-05-15T10:00:00.000Z',
  court: 'Quadra 1',
  totalSpots: 8,
  type: 'avulsa',
  ...overrides,
})

const MS_POR_SEMANA = 7 * 24 * 60 * 60 * 1000

describe('buildDateList', () => {
  it('deve retornar um array com um único elemento para aulas do tipo "avulsa"', () => {
    // Arrange
    const input = criarInputBase({ type: 'avulsa' })

    // Act
    const resultado = buildDateList(input)

    // Assert
    expect(resultado).toHaveLength(1)
    expect(resultado[0]).toBe(input.dateTime)
  })

  it('deve gerar 3 datas com intervalos semanais exatos para uma recorrência de 3 semanas', () => {
    // Arrange
    const input = criarInputBase({
      type: 'recorrente',
      dateTime: '2025-05-15T10:00:00.000Z',
      repeatUntil: '2025-05-29T10:00:00.000Z', // 14 dias depois = 3 ocorrências (sem. 1, 2, 3)
    })

    // Act
    const resultado = buildDateList(input)

    // Assert
    expect(resultado).toHaveLength(3)
    expect(new Date(resultado[1]).getTime() - new Date(resultado[0]).getTime()).toBe(MS_POR_SEMANA)
    expect(new Date(resultado[2]).getTime() - new Date(resultado[1]).getTime()).toBe(MS_POR_SEMANA)
  })

  it('deve lançar RecurrenceInputError quando repeatUntil é anterior ao dateTime', () => {
    // Arrange
    const input = criarInputBase({
      type: 'recorrente',
      dateTime: '2025-05-15T10:00:00.000Z',
      repeatUntil: '2025-05-10T10:00:00.000Z', // data no passado
    })

    // Act & Assert
    expect(() => buildDateList(input)).toThrow(RecurrenceInputError)
  })

  it('deve lançar RecurrenceInputError quando repeatUntil é igual ao dateTime', () => {
    // Arrange
    const input = criarInputBase({
      type: 'recorrente',
      dateTime: '2025-05-15T10:00:00.000Z',
      repeatUntil: '2025-05-15T10:00:00.000Z', // mesmo instante
    })

    // Act & Assert
    expect(() => buildDateList(input)).toThrow(RecurrenceInputError)
  })

  it('deve retornar apenas a data inicial quando repeatUntil não é fornecido numa recorrente', () => {
    // Arrange
    const input = criarInputBase({
      type: 'recorrente',
      dateTime: '2025-05-15T10:00:00.000Z',
      repeatUntil: undefined,
    })

    // Act
    const resultado = buildDateList(input)

    // Assert
    expect(resultado).toHaveLength(1)
    expect(resultado[0]).toBe(input.dateTime)
  })

  it('deve limitar a geração a no máximo 400 semanas mesmo com repeatUntil muito distante', () => {
    // Regra de negócio: cap de 400 iterações no while (count < maxWeeks)
    // Arrange — repeatUntil em 500 semanas (acima do cap de 400)
    const dataInicio = '2025-05-15T10:00:00.000Z'
    const repeatUntil = new Date(
      new Date(dataInicio).getTime() + 500 * MS_POR_SEMANA
    ).toISOString()

    const input = criarInputBase({
      type: 'recorrente',
      dateTime: dataInicio,
      repeatUntil,
    })

    // Act
    const resultado = buildDateList(input)

    // Assert — exactamente 400 datas, não 500
    expect(resultado).toHaveLength(400)
  })
})
