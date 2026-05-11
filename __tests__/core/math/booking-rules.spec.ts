import { describe, it, expect } from 'vitest'
import {
  getBookingPhase,
  getLessonAvailabilityStatus,
} from '@/core/math/booking-rules'

// ─── Constantes de tempo ──────────────────────────────────────────────────────
const MS_H = 3_600_000 // 1 hora em milissegundos

// ─── getBookingPhase ──────────────────────────────────────────────────────────
// Lógica:
//   hoursToClass <= 0 → "CLOSED"
//   hoursToClass < 4  → "OPEN"     (fronteira exclusiva em 4h)
//   hoursToClass <= 8 → "RESERVAS" (fronteira inclusiva em 8h)
//   else              → "TITULARES"
//
// Fronteiras mapeadas:
//   F1: 0h  — OPEN   → CLOSED    (condição <= 0)
//   F2: 4h  — OPEN   → RESERVAS  (condição < 4, exclusivo no 4h)
//   F3: 8h  — RESERVAS → TITULARES (condição <= 8, inclusivo no 8h)

describe('getBookingPhase', () => {
  const AGORA = new Date('2025-05-15T10:00:00.000Z')

  // ── Fronteira F1: 0h ────────────────────────────────────────────────────────

  describe('fronteira 0h — transição "OPEN" → "CLOSED"', () => {
    it('deve retornar "CLOSED" quando a aula passou há 1ms (hoursToClass < 0)', () => {
      // Arrange
      const dataAula = new Date(AGORA.getTime() - 1)

      // Act & Assert
      expect(getBookingPhase(dataAula, AGORA)).toBe('CLOSED')
    })

    it('deve retornar "CLOSED" exatamente no horário da aula (hoursToClass = 0, condição <= 0)', () => {
      // Arrange
      const dataAula = new Date(AGORA.getTime())

      // Act & Assert
      expect(getBookingPhase(dataAula, AGORA)).toBe('CLOSED')
    })

    it('deve retornar "OPEN" quando a aula começa em 1ms (primeiro instante fora do CLOSED)', () => {
      // Arrange
      const dataAula = new Date(AGORA.getTime() + 1)

      // Act & Assert
      expect(getBookingPhase(dataAula, AGORA)).toBe('OPEN')
    })
  })

  // ── Fronteira F2: 4h ────────────────────────────────────────────────────────

  describe('fronteira 4h — transição "OPEN" → "RESERVAS"', () => {
    it('deve retornar "OPEN" com 4h menos 1ms restantes (abaixo da fronteira exclusiva)', () => {
      // Arrange — hoursToClass = 3h59m59.999s → < 4 → "OPEN"
      const dataAula = new Date(AGORA.getTime() + 4 * MS_H - 1)

      // Act & Assert
      expect(getBookingPhase(dataAula, AGORA)).toBe('OPEN')
    })

    it('deve retornar "RESERVAS" no limite exato de 4h (fronteira exclusiva: 4 não é < 4)', () => {
      // Arrange — hoursToClass = 4.0 → não satisfaz < 4 → cai para <= 8 → "RESERVAS"
      const dataAula = new Date(AGORA.getTime() + 4 * MS_H)

      // Act & Assert
      expect(getBookingPhase(dataAula, AGORA)).toBe('RESERVAS')
    })

    it('deve retornar "RESERVAS" com 4h mais 1ms restantes (imediatamente acima)', () => {
      // Arrange
      const dataAula = new Date(AGORA.getTime() + 4 * MS_H + 1)

      // Act & Assert
      expect(getBookingPhase(dataAula, AGORA)).toBe('RESERVAS')
    })
  })

  // ── Fronteira F3: 8h ────────────────────────────────────────────────────────

  describe('fronteira 8h — transição "RESERVAS" → "TITULARES"', () => {
    it('deve retornar "RESERVAS" com 8h menos 1ms restantes (abaixo da fronteira inclusiva)', () => {
      // Arrange
      const dataAula = new Date(AGORA.getTime() + 8 * MS_H - 1)

      // Act & Assert
      expect(getBookingPhase(dataAula, AGORA)).toBe('RESERVAS')
    })

    it('deve retornar "RESERVAS" no limite exato de 8h (fronteira inclusiva: 8 <= 8)', () => {
      // Arrange — hoursToClass = 8.0 → <= 8 → "RESERVAS"
      const dataAula = new Date(AGORA.getTime() + 8 * MS_H)

      // Act & Assert
      expect(getBookingPhase(dataAula, AGORA)).toBe('RESERVAS')
    })

    it('deve retornar "TITULARES" com 8h mais 1ms restantes (primeiro instante acima)', () => {
      // Arrange — hoursToClass = 8.000000278 → não satisfaz <= 8 → "TITULARES"
      const dataAula = new Date(AGORA.getTime() + 8 * MS_H + 1)

      // Act & Assert
      expect(getBookingPhase(dataAula, AGORA)).toBe('TITULARES')
    })
  })
})

// ─── getLessonAvailabilityStatus ──────────────────────────────────────────────
// Lógica:
//   enrolledCount >= totalSpots             → "full"
//   totalSpots - enrolledCount <= 2         → "limited"
//   else                                    → "available"
//
// Fronteiras (com totalSpots = 8):
//   F1: enrolledCount = 8 (full) vs 7 (limited)
//   F2: spotsLeft = 2 (limited) vs 3 (available)

describe('getLessonAvailabilityStatus', () => {
  const TOTAL_VAGAS = 8

  describe('fronteira de "full" — enrolledCount >= totalSpots', () => {
    it('deve retornar "limited" com 1 vaga restante (enrolledCount = 7, imediatamente abaixo de "full")', () => {
      expect(getLessonAvailabilityStatus(7, TOTAL_VAGAS)).toBe('limited')
    })

    it('deve retornar "full" quando todas as vagas estão preenchidas (enrolledCount = totalSpots)', () => {
      expect(getLessonAvailabilityStatus(8, TOTAL_VAGAS)).toBe('full')
    })
  })

  describe('fronteira de "limited" — totalSpots - enrolledCount <= 2', () => {
    it('deve retornar "available" quando há 3 vagas restantes (imediatamente acima do limite)', () => {
      // Arrange — 8 - 5 = 3 > 2 → "available"
      expect(getLessonAvailabilityStatus(5, TOTAL_VAGAS)).toBe('available')
    })

    it('deve retornar "limited" no limite exato de 2 vagas restantes (condição <= 2, inclusiva)', () => {
      // Arrange — 8 - 6 = 2 <= 2 → "limited"
      expect(getLessonAvailabilityStatus(6, TOTAL_VAGAS)).toBe('limited')
    })

    it('deve retornar "limited" com apenas 1 vaga restante (abaixo do limite)', () => {
      // Arrange — 8 - 7 = 1 <= 2 → "limited"
      expect(getLessonAvailabilityStatus(7, TOTAL_VAGAS)).toBe('limited')
    })
  })

  it('deve retornar "available" quando a aula está completamente vazia', () => {
    expect(getLessonAvailabilityStatus(0, TOTAL_VAGAS)).toBe('available')
  })
})
