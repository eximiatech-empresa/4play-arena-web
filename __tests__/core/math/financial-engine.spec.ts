import { describe, it, expect } from 'vitest'
import { calculateCheckinRevenue } from '@/core/math/financial-engine'
import { ProfessorNotFoundError } from '@/core/errors/exceptions'

// ─── calculateCheckinRevenue ──────────────────────────────────────────────────
// Fórmula (spec §9):
//   rsBruto         = playsConsumed × playValue
//   professorCredit = rsBruto × professorSharePct
//   arenaCredit     = rsBruto × arenaSharePct
//
// Splits por professor (spec §9):
//   Paulinho: 50% / 50%
//   Biel:     70% / 30%
//   Pepe:     50% / 50%
//   Marília:  65% / 35%
//
// Regra de Ouro (spec §8): playValue é SEMPRE do plano do aluno, não do professor.
// Os testes usam os playValues reais dos planos (mensal 5.125, trimestral 4.75, semestral 4.3125).

describe('calculateCheckinRevenue', () => {
  // ── Biel (70% / 30%) ─────────────────────────────────────────────────────────

  it('Biel / 14 Plays / trimestral (R$4.75): rsBruto=66.50, prof=46.55, arena=19.95', () => {
    // 14 × 4.75 = 66.50 (exato em IEEE 754)
    const resultado = calculateCheckinRevenue(14, 4.75, 'biel')

    expect(resultado.rsBruto).toBe(66.5)
    expect(resultado.professorCredit).toBeCloseTo(46.55, 4)
    expect(resultado.arenaCredit).toBeCloseTo(19.95, 4)
  })

  it('Biel / 13 Plays / trimestral (R$4.75): split deve somar ao rsBruto', () => {
    const resultado = calculateCheckinRevenue(13, 4.75, 'biel')

    expect(resultado.rsBruto).toBe(61.75)
    expect(resultado.professorCredit + resultado.arenaCredit).toBeCloseTo(resultado.rsBruto, 10)
  })

  // ── Marília (65% / 35%) ──────────────────────────────────────────────────────

  it('Marília / 18 Plays / semestral (R$4.3125): rsBruto=77.625', () => {
    // 18 × 4.3125 = 77.625 (exato: 18 × 69/16 = 1242/16 = 77.625)
    const resultado = calculateCheckinRevenue(18, 4.3125, 'marilia')

    expect(resultado.rsBruto).toBe(77.625)
    expect(resultado.professorCredit).toBeCloseTo(77.625 * 0.65, 10)
    expect(resultado.arenaCredit).toBeCloseTo(77.625 * 0.35, 10)
  })

  it('Marília / 16 Plays / mensal (R$5.125): split deve somar ao rsBruto', () => {
    const resultado = calculateCheckinRevenue(16, 5.125, 'marilia')

    expect(resultado.rsBruto).toBe(82)
    expect(resultado.professorCredit + resultado.arenaCredit).toBeCloseTo(82, 10)
  })

  // ── Paulinho (50% / 50%) ─────────────────────────────────────────────────────

  it('Paulinho / 10 Plays / mensal (R$5.125): rsBruto=51.25, prof=25.625, arena=25.625', () => {
    // 10 × 5.125 = 51.25; 51.25 × 0.5 = 25.625 (exatos)
    const resultado = calculateCheckinRevenue(10, 5.125, 'paulinho')

    expect(resultado.rsBruto).toBe(51.25)
    expect(resultado.professorCredit).toBe(25.625)
    expect(resultado.arenaCredit).toBe(25.625)
  })

  it('Paulinho: professorCredit e arenaCredit devem ser iguais (50%/50%)', () => {
    const resultado = calculateCheckinRevenue(10, 5.125, 'paulinho')

    expect(resultado.professorCredit).toBe(resultado.arenaCredit)
  })

  // ── Pepe (50% / 50%) ─────────────────────────────────────────────────────────

  it('Pepe / 13 Plays / trimestral (R$4.75): rsBruto=61.75, split igual 50%/50%', () => {
    // 13 × 4.75 = 61.75; 61.75 × 0.5 = 30.875 (exatos)
    const resultado = calculateCheckinRevenue(13, 4.75, 'pepe')

    expect(resultado.rsBruto).toBe(61.75)
    expect(resultado.professorCredit).toBe(30.875)
    expect(resultado.arenaCredit).toBe(30.875)
  })

  // ── Invariante: split sempre soma ao rsBruto ─────────────────────────────────

  it('professorCredit + arenaCredit deve sempre igualar rsBruto (invariante)', () => {
    const casos = [
      { plays: 13, playValue: 4.75, professorId: 'biel' },
      { plays: 18, playValue: 4.3125, professorId: 'marilia' },
      { plays: 10, playValue: 5.125, professorId: 'paulinho' },
      { plays: 14, playValue: 4.75, professorId: 'pepe' },
    ] as const

    for (const { plays, playValue, professorId } of casos) {
      const r = calculateCheckinRevenue(plays, playValue, professorId)
      expect(r.professorCredit + r.arenaCredit).toBeCloseTo(r.rsBruto, 10)
    }
  })

  // ── Erro ──────────────────────────────────────────────────────────────────────

  it('deve lançar ProfessorNotFoundError para professorId inexistente', () => {
    expect(() =>
      calculateCheckinRevenue(10, 5.125, 'professor-inexistente')
    ).toThrow(ProfessorNotFoundError)
  })
})
