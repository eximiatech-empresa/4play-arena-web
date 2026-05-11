import { describe, it, expect } from 'vitest'
import {
  getAttendanceStatus,
  applyAttendanceChange,
  computeAttendanceSummary,
} from '@/core/math/attendance-calculator'
import type { AttendanceStudent } from '@/core/entities/attendance'

describe('getAttendanceStatus', () => {
  it('deve retornar "present" quando o studentId está na lista de checkedIn', () => {
    // Arrange & Act
    const resultado = getAttendanceStatus('aluno-1', ['aluno-1', 'aluno-2'], [])

    // Assert
    expect(resultado).toBe('present')
  })

  it('deve retornar "absent" quando o studentId está na lista de absent', () => {
    // Arrange & Act
    const resultado = getAttendanceStatus('aluno-3', [], ['aluno-3'])

    // Assert
    expect(resultado).toBe('absent')
  })

  it('deve retornar "pending" quando o studentId não está em nenhuma das listas', () => {
    // Arrange & Act
    const resultado = getAttendanceStatus('aluno-99', ['aluno-1'], ['aluno-2'])

    // Assert
    expect(resultado).toBe('pending')
  })
})

describe('applyAttendanceChange', () => {
  it('deve mover o aluno para checkedIn e removê-lo de absent ao marcar como "present"', () => {
    // Arrange
    const checkedIn = ['aluno-1']
    const absent = ['aluno-2']

    // Act
    const resultado = applyAttendanceChange(checkedIn, absent, 'aluno-2', 'present')

    // Assert
    expect(resultado.checkedInStudentIds).toContain('aluno-2')
    expect(resultado.absentStudentIds).not.toContain('aluno-2')
  })

  it('não deve duplicar o aluno em checkedIn ao marcar como "present" quando já está presente', () => {
    // Arrange
    const checkedIn = ['aluno-1']
    const absent: string[] = []

    // Act
    const resultado = applyAttendanceChange(checkedIn, absent, 'aluno-1', 'present')

    // Assert
    expect(resultado.checkedInStudentIds.filter((id) => id === 'aluno-1')).toHaveLength(1)
  })

  it('deve mover o aluno para absent e removê-lo de checkedIn ao marcar como "absent"', () => {
    // Arrange
    const checkedIn = ['aluno-1', 'aluno-2']
    const absent: string[] = []

    // Act
    const resultado = applyAttendanceChange(checkedIn, absent, 'aluno-1', 'absent')

    // Assert
    expect(resultado.absentStudentIds).toContain('aluno-1')
    expect(resultado.checkedInStudentIds).not.toContain('aluno-1')
  })

  it('deve remover o aluno de ambas as listas ao marcar como "none" (reset de presença)', () => {
    // Arrange
    const checkedIn = ['aluno-1']
    const absent = ['aluno-2']

    // Act
    const resultadoCheckedIn = applyAttendanceChange(checkedIn, absent, 'aluno-1', 'none')
    const resultadoAbsent = applyAttendanceChange(checkedIn, absent, 'aluno-2', 'none')

    // Assert
    expect(resultadoCheckedIn.checkedInStudentIds).not.toContain('aluno-1')
    expect(resultadoAbsent.absentStudentIds).not.toContain('aluno-2')
  })

  it('não deve mutar os arrays originais (imutabilidade garantida)', () => {
    // Arrange
    const checkedIn = ['aluno-1']
    const absent: string[] = []
    const copiaOriginal = [...checkedIn]

    // Act
    applyAttendanceChange(checkedIn, absent, 'aluno-1', 'absent')

    // Assert
    expect(checkedIn).toEqual(copiaOriginal)
  })
})

describe('computeAttendanceSummary', () => {
  it('deve contar corretamente presentes, ausentes e pendentes num grupo misto', () => {
    // Arrange
    const alunos: AttendanceStudent[] = [
      { id: 'a1', name: 'Ana', status: 'present' },
      { id: 'a2', name: 'Bruno', status: 'present' },
      { id: 'a3', name: 'Carla', status: 'absent' },
      { id: 'a4', name: 'Daniel', status: 'pending' },
    ]

    // Act
    const resultado = computeAttendanceSummary(alunos)

    // Assert
    expect(resultado).toEqual({ presentCount: 2, absentCount: 1, pendingCount: 1 })
  })

  it('deve retornar todos os contadores a zero para uma lista vazia', () => {
    // Act
    const resultado = computeAttendanceSummary([])

    // Assert
    expect(resultado).toEqual({ presentCount: 0, absentCount: 0, pendingCount: 0 })
  })
})
