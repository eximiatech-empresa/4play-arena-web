import { describe, it, expect } from 'vitest'
import {
  isOffPeak,
  calculateConsumption,
  isLevelEligible,
  getCheckInStatus,
  canCancelCheckIn,
} from '@/core/math/consumption'
import { ProfessorNotFoundError } from '@/core/errors/exceptions'

// ─── Constantes de tempo ──────────────────────────────────────────────────────
const MS_H = 3_600_000 // 1 hora em milissegundos

const criarDataComHora = (hora: number): Date => {
  const d = new Date('2025-05-15T00:00:00')
  d.setHours(hora, 0, 0, 0)
  return d
}

// ─── isOffPeak ────────────────────────────────────────────────────────────────
// Granularidade: hora inteira (getHours). BVA aplicado às horas 17, 18, 19, 20.

describe('isOffPeak', () => {
  it('deve retornar true para hora 17 (imediatamente antes do pico que começa às 18h)', () => {
    expect(isOffPeak(criarDataComHora(17))).toBe(true)
  })

  it('deve retornar false para hora 18 (início do pico, inclusivo)', () => {
    expect(isOffPeak(criarDataComHora(18))).toBe(false)
  })

  it('deve retornar false para hora 19 (dentro do pico)', () => {
    expect(isOffPeak(criarDataComHora(19))).toBe(false)
  })

  it('deve retornar true para hora 20 (fim do pico, exclusive — primeira hora off-peak)', () => {
    expect(isOffPeak(criarDataComHora(20))).toBe(true)
  })
})

// ─── calculateConsumption ─────────────────────────────────────────────────────

describe('calculateConsumption', () => {
  it('deve calcular consumo com arredondamento normal para Paulinho (não-premium) trimestral em pico', () => {
    // Arrange
    const dataPico = criarDataComHora(19)
    // Paulinho trimestral: 0.85h × multiplicador 1.0, sem desconto off-peak
    const esperado = Math.round(0.85 * 1.0 * 100) / 100

    // Act
    const resultado = calculateConsumption({ professorId: 'paulinho', plan: 'trimestral', date: dataPico })

    // Assert
    expect(resultado).toBe(esperado)
  })

  it('deve aplicar desconto off-peak (×0.95) e arredondamento ceiling para Marília (premium) mensal', () => {
    // Arrange
    const dataOffPeak = criarDataComHora(17)
    // Marília mensal: 1.5h × 0.95 (off-peak) × 1.2 (multiplicador mensal) — ceiling
    const esperado = Math.ceil(1.5 * 0.95 * 1.2 * 100) / 100

    // Act
    const resultado = calculateConsumption({ professorId: 'marilia', plan: 'mensal', date: dataOffPeak })

    // Assert
    expect(resultado).toBe(esperado)
  })

  it('deve calcular consumo para Biel semestral em horário off-peak com arredondamento normal', () => {
    // Arrange
    const dataOffPeak = criarDataComHora(21)
    // Biel semestral: 0.95h × 0.95 (off-peak) × 0.8 (multiplicador semestral) — round
    const esperado = Math.round(0.95 * 0.95 * 0.8 * 100) / 100

    // Act
    const resultado = calculateConsumption({ professorId: 'biel', plan: 'semestral', date: dataOffPeak })

    // Assert
    expect(resultado).toBe(esperado)
  })

  it('deve lançar ProfessorNotFoundError para um professorId inexistente', () => {
    expect(() =>
      calculateConsumption({ professorId: 'professor-inexistente', plan: 'mensal', date: new Date() })
    ).toThrow(ProfessorNotFoundError)
  })
})

// ─── isLevelEligible ──────────────────────────────────────────────────────────

describe('isLevelEligible', () => {
  it('deve retornar true quando o nível do aluno é superior ao da aula', () => {
    expect(isLevelEligible(4, 2)).toBe(true)
  })

  it('deve retornar true quando o nível do aluno é exatamente igual ao da aula (fronteira inclusiva)', () => {
    expect(isLevelEligible(3, 3)).toBe(true)
  })

  it('deve retornar false quando o nível do aluno é inferior ao da aula em 1 (fronteira imediatamente abaixo)', () => {
    expect(isLevelEligible(2, 3)).toBe(false)
  })
})

// ─── getCheckInStatus ────────────────────────────────────────────────────────
// Três fronteiras: 0h (closed), 6h (open→enrolled_only), 24h (enrolled_only→not_open)
// Estratégia BVA: testar N-1ms, N e N+1ms para cada fronteira.

describe('getCheckInStatus', () => {
  const AGORA = new Date('2025-05-15T10:00:00.000Z')

  describe('fronteira 0h — transição de "open" para "closed"', () => {
    it('deve retornar "closed" com 1ms no passado (hoursToClass < 0)', () => {
      // Arrange
      const dataAula = new Date(AGORA.getTime() - 1)

      // Act & Assert
      expect(getCheckInStatus(dataAula, false, AGORA)).toBe('closed')
    })

    it('deve retornar "open" exatamente no horário da aula (hoursToClass = 0, não é < 0)', () => {
      // Arrange — hoursToClass = 0: not < 0, falls through to <= 6 → "open"
      const dataAula = new Date(AGORA.getTime())

      // Act & Assert
      expect(getCheckInStatus(dataAula, false, AGORA)).toBe('open')
    })

    it('deve retornar "open" com 1ms restante (hoursToClass > 0, dentro dos 6h)', () => {
      // Arrange
      const dataAula = new Date(AGORA.getTime() + 1)

      // Act & Assert
      expect(getCheckInStatus(dataAula, false, AGORA)).toBe('open')
    })
  })

  describe('fronteira 6h (CHECK_IN_OPEN_HOURS) — transição de "open" para "enrolled_only"', () => {
    it('deve retornar "open" com 6h menos 1ms restantes', () => {
      // Arrange
      const dataAula = new Date(AGORA.getTime() + 6 * MS_H - 1)

      // Act & Assert
      expect(getCheckInStatus(dataAula, true, AGORA)).toBe('open')
    })

    it('deve retornar "open" no limite exato de 6h (hoursToClass <= 6, inclusivo)', () => {
      // Arrange
      const dataAula = new Date(AGORA.getTime() + 6 * MS_H)

      // Act & Assert
      expect(getCheckInStatus(dataAula, true, AGORA)).toBe('open')
    })

    it('deve retornar "enrolled_only" para aluno inscrito com 6h mais 1ms restantes', () => {
      // Arrange — 1ms acima da fronteira: hoursToClass > 6, cai para a regra seguinte
      const dataAula = new Date(AGORA.getTime() + 6 * MS_H + 1)

      // Act & Assert
      expect(getCheckInStatus(dataAula, true, AGORA)).toBe('enrolled_only')
    })

    it('deve retornar "not_open" para aluno NÃO inscrito com 6h mais 1ms restantes', () => {
      // Arrange — mesmo delta, mas isEnrolled = false: salta enrolled_only → not_open
      const dataAula = new Date(AGORA.getTime() + 6 * MS_H + 1)

      // Act & Assert
      expect(getCheckInStatus(dataAula, false, AGORA)).toBe('not_open')
    })
  })

  describe('fronteira 24h (CHECK_IN_ENROLLED_HOURS) — transição de "enrolled_only" para "not_open"', () => {
    it('deve retornar "enrolled_only" para aluno inscrito com 24h menos 1ms restantes', () => {
      // Arrange
      const dataAula = new Date(AGORA.getTime() + 24 * MS_H - 1)

      // Act & Assert
      expect(getCheckInStatus(dataAula, true, AGORA)).toBe('enrolled_only')
    })

    it('deve retornar "enrolled_only" para aluno inscrito no limite exato de 24h (hoursToClass <= 24)', () => {
      // Arrange
      const dataAula = new Date(AGORA.getTime() + 24 * MS_H)

      // Act & Assert
      expect(getCheckInStatus(dataAula, true, AGORA)).toBe('enrolled_only')
    })

    it('deve retornar "not_open" para aluno inscrito com 24h mais 1ms restantes', () => {
      // Arrange — 1ms acima: hoursToClass > 24 → escapa de enrolled_only → not_open
      const dataAula = new Date(AGORA.getTime() + 24 * MS_H + 1)

      // Act & Assert
      expect(getCheckInStatus(dataAula, true, AGORA)).toBe('not_open')
    })
  })
})

// ─── canCancelCheckIn ─────────────────────────────────────────────────────────
// Fronteira: CANCEL_REFUND_MIN_HOURS = 4h (condição: hoursToClass >= 4)
// BVA: testar 4h-1ms (false), 4h exato (true), 4h+1ms (true)

describe('canCancelCheckIn', () => {
  const AGORA = new Date('2025-05-15T10:00:00.000Z')
  const LIMITE_4H_MS = 4 * MS_H

  it('deve retornar false com 4h menos 1ms antes da aula (imediatamente abaixo do limite)', () => {
    // Arrange
    const dataAula = new Date(AGORA.getTime() + LIMITE_4H_MS - 1)

    // Act & Assert
    expect(canCancelCheckIn(dataAula, AGORA)).toBe(false)
  })

  it('deve retornar true no limite exato de 4h (condição >= é inclusiva)', () => {
    // Arrange
    const dataAula = new Date(AGORA.getTime() + LIMITE_4H_MS)

    // Act & Assert
    expect(canCancelCheckIn(dataAula, AGORA)).toBe(true)
  })

  it('deve retornar true com 4h mais 1ms antes da aula (imediatamente acima do limite)', () => {
    // Arrange
    const dataAula = new Date(AGORA.getTime() + LIMITE_4H_MS + 1)

    // Act & Assert
    expect(canCancelCheckIn(dataAula, AGORA)).toBe(true)
  })
})
