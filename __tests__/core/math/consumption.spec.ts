import { describe, it, expect } from 'vitest'
import {
  isPeakHour,
  isOffPeak,
  calculatePlaysConsumed,
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

// ─── isPeakHour ───────────────────────────────────────────────────────────────
// Janela de pico: 18h ≤ hora < 20h (inclusivo em 18, exclusivo em 20).
// BVA nas horas 17, 18, 19, 20.

describe('isPeakHour', () => {
  it('deve retornar false para hora 17 (imediatamente antes do pico)', () => {
    expect(isPeakHour(criarDataComHora(17))).toBe(false)
  })

  it('deve retornar true para hora 18 (início do pico, inclusivo)', () => {
    expect(isPeakHour(criarDataComHora(18))).toBe(true)
  })

  it('deve retornar true para hora 19 (dentro do pico)', () => {
    expect(isPeakHour(criarDataComHora(19))).toBe(true)
  })

  it('deve retornar false para hora 20 (fim do pico, exclusivo — primeira hora fora do pico)', () => {
    expect(isPeakHour(criarDataComHora(20))).toBe(false)
  })
})

// ─── isOffPeak ────────────────────────────────────────────────────────────────
// Alias backward-compat: isOffPeak = !isPeakHour. Garante que a inversão está correta.

describe('isOffPeak', () => {
  it('deve retornar true para hora 17 (fora do pico)', () => {
    expect(isOffPeak(criarDataComHora(17))).toBe(true)
  })

  it('deve retornar false para hora 18 (início do pico, inclusivo)', () => {
    expect(isOffPeak(criarDataComHora(18))).toBe(false)
  })

  it('deve retornar false para hora 19 (dentro do pico)', () => {
    expect(isOffPeak(criarDataComHora(19))).toBe(false)
  })

  it('deve retornar true para hora 20 (fim do pico, exclusivo)', () => {
    expect(isOffPeak(criarDataComHora(20))).toBe(true)
  })
})

// ─── calculatePlaysConsumed ───────────────────────────────────────────────────
// Ordem obrigatória (spec §4):
//   1. basePlays do professor
//   2. × 1.05 se isPeak
//   3. × 1.10 se isReserva
//   4. round (Math.round) ou ceil (Math.ceil) conforme professor
//
// Exemplos validados contra a seção 4 do documento de regras de negócio.

describe('calculatePlaysConsumed', () => {
  // ── Biel (basePlays=13, roundingRule=round) ──────────────────────────────────

  it('Biel / titular / off-peak: 13 × 1 × 1 = 13 → round → 13', () => {
    expect(calculatePlaysConsumed({ professorId: 'biel', isPeak: false, isReserva: false })).toBe(13)
  })

  it('Biel / titular / pico: 13 × 1.05 = 13.65 → round → 14', () => {
    expect(calculatePlaysConsumed({ professorId: 'biel', isPeak: true, isReserva: false })).toBe(14)
  })

  it('Biel / reserva / pico: 13 × 1.05 × 1.10 = 15.015 → round → 15', () => {
    expect(calculatePlaysConsumed({ professorId: 'biel', isPeak: true, isReserva: true })).toBe(15)
  })

  it('Biel / reserva / off-peak: 13 × 1.10 = 14.30 → round → 14', () => {
    expect(calculatePlaysConsumed({ professorId: 'biel', isPeak: false, isReserva: true })).toBe(14)
  })

  // ── Marília (basePlays=16, roundingRule=ceil) ────────────────────────────────

  it('Marília / reserva / off-peak: 16 × 1.10 = 17.6 → ceil → 18', () => {
    expect(calculatePlaysConsumed({ professorId: 'marilia', isPeak: false, isReserva: true })).toBe(18)
  })

  it('Marília / titular / pico: 16 × 1.05 = 16.8 → ceil → 17', () => {
    expect(calculatePlaysConsumed({ professorId: 'marilia', isPeak: true, isReserva: false })).toBe(17)
  })

  it('Marília / titular / off-peak: 16 → ceil → 16', () => {
    expect(calculatePlaysConsumed({ professorId: 'marilia', isPeak: false, isReserva: false })).toBe(16)
  })

  // ── Paulinho (basePlays=10, roundingRule=round) ──────────────────────────────

  it('Paulinho / titular / off-peak: 10 → round → 10', () => {
    expect(calculatePlaysConsumed({ professorId: 'paulinho', isPeak: false, isReserva: false })).toBe(10)
  })

  it('Paulinho / reserva / pico: 10 × 1.05 × 1.10 = 11.55 → round → 12', () => {
    expect(calculatePlaysConsumed({ professorId: 'paulinho', isPeak: true, isReserva: true })).toBe(12)
  })

  // ── Pepe (basePlays=13, roundingRule=round) ──────────────────────────────────

  it('Pepe / titular / pico: 13 × 1.05 = 13.65 → round → 14', () => {
    expect(calculatePlaysConsumed({ professorId: 'pepe', isPeak: true, isReserva: false })).toBe(14)
  })

  // ── Erro ─────────────────────────────────────────────────────────────────────

  it('deve lançar ProfessorNotFoundError para professorId inexistente', () => {
    expect(() =>
      calculatePlaysConsumed({ professorId: 'professor-inexistente', isPeak: false, isReserva: false })
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
