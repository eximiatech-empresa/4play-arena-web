import { describe, it, expect } from 'vitest'
import {
  groupEnrollmentsByRelationship,
  getTopStudentsByFrequency,
} from '@/core/math/teacher-stats'
import type { StudentEnrollment, FrequencyEntry } from '@/core/math/teacher-stats'

// ─── groupEnrollmentsByRelationship ───────────────────────────────────────────

describe('groupEnrollmentsByRelationship', () => {
  it('deve separar titulares (isMainStudent=true) de visitantes (isMainStudent=false)', () => {
    // Arrange
    const inscritos: StudentEnrollment[] = [
      { studentId: 's1', studentName: 'Ana', studentLevel: 'Nível B', isMainStudent: true, checkedIn: true },
      { studentId: 's2', studentName: 'Bruno', studentLevel: 'Nível B', isMainStudent: false, checkedIn: false },
      { studentId: 's3', studentName: 'Carla', studentLevel: 'Nível A', isMainStudent: true, checkedIn: false },
    ]

    // Act
    const resultado = groupEnrollmentsByRelationship(inscritos)

    // Assert
    expect(resultado.titular).toHaveLength(2)
    expect(resultado.visitors).toHaveLength(1)
    expect(resultado.titular.map((e) => e.studentId)).toEqual(['s1', 's3'])
    expect(resultado.visitors[0].studentId).toBe('s2')
  })

  it('deve retornar grupos vazios quando a lista de inscritos está vazia', () => {
    const resultado = groupEnrollmentsByRelationship([])

    expect(resultado.titular).toHaveLength(0)
    expect(resultado.visitors).toHaveLength(0)
  })

  it('deve retornar todos como titulares quando não há visitantes', () => {
    const inscritos: StudentEnrollment[] = [
      { studentId: 's1', studentName: 'Ana', studentLevel: 'Nível B', isMainStudent: true, checkedIn: true },
      { studentId: 's2', studentName: 'Bruno', studentLevel: 'Nível C', isMainStudent: true, checkedIn: true },
    ]

    const resultado = groupEnrollmentsByRelationship(inscritos)

    expect(resultado.titular).toHaveLength(2)
    expect(resultado.visitors).toHaveLength(0)
  })
})

// ─── getTopStudentsByFrequency ────────────────────────────────────────────────

describe('getTopStudentsByFrequency', () => {
  const historico: FrequencyEntry[] = [
    { studentId: 's1', studentName: 'Ana', studentLevel: 'Nível B', totalCheckIns: 10 },
    { studentId: 's2', studentName: 'Bruno', studentLevel: 'Nível C', totalCheckIns: 25 },
    { studentId: 's3', studentName: 'Carla', studentLevel: 'Nível A', totalCheckIns: 5 },
    { studentId: 's4', studentName: 'Daniel', studentLevel: 'Nível B', totalCheckIns: 18 },
    { studentId: 's5', studentName: 'Eva', studentLevel: 'Nível D', totalCheckIns: 30 },
    { studentId: 's6', studentName: 'Felipe', studentLevel: 'Nível C', totalCheckIns: 12 },
  ]

  it('deve ordenar por totalCheckIns descendente e devolver os top N', () => {
    // Act
    const resultado = getTopStudentsByFrequency(historico, 3)

    // Assert — top 3: Eva(30), Bruno(25), Daniel(18)
    expect(resultado).toHaveLength(3)
    expect(resultado[0].studentId).toBe('s5') // Eva: 30
    expect(resultado[1].studentId).toBe('s2') // Bruno: 25
    expect(resultado[2].studentId).toBe('s4') // Daniel: 18
  })

  it('deve usar topN=5 como padrão quando o parâmetro não é fornecido', () => {
    // Act
    const resultado = getTopStudentsByFrequency(historico)

    // Assert
    expect(resultado).toHaveLength(5)
  })

  it('deve devolver todos os alunos quando a lista é menor que topN', () => {
    // Arrange — apenas 2 alunos, topN=5
    const pequeno: FrequencyEntry[] = [
      { studentId: 's1', studentName: 'Ana', studentLevel: 'Nível B', totalCheckIns: 10 },
      { studentId: 's2', studentName: 'Bruno', studentLevel: 'Nível C', totalCheckIns: 5 },
    ]

    // Act
    const resultado = getTopStudentsByFrequency(pequeno, 5)

    // Assert — devolve 2, não 5
    expect(resultado).toHaveLength(2)
  })

  it('não deve mutar o array original (ordena uma cópia internamente)', () => {
    // Arrange
    const ids = historico.map((e) => e.studentId)

    // Act
    getTopStudentsByFrequency(historico, 3)

    // Assert — ordem original preservada
    expect(historico.map((e) => e.studentId)).toEqual(ids)
  })
})
