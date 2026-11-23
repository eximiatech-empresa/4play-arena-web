import { describe, it, expect } from 'vitest'
import { calculateCheckinRevenue } from '@/core/math/financial-engine'

const SHARES = {
  biel: { professorSharePct: 0.7, arenaSharePct: 0.3 },
  marilia: { professorSharePct: 0.65, arenaSharePct: 0.35 },
  paulinho: { professorSharePct: 0.5, arenaSharePct: 0.5 },
  pepe: { professorSharePct: 0.5, arenaSharePct: 0.5 },
} as const

describe('calculateCheckinRevenue', () => {
  it('Biel / 14 Plays / trimestral (R$4.75): rsBruto=66.50, prof=46.55, arena=19.95', () => {
    const resultado = calculateCheckinRevenue(14, 4.75, SHARES.biel)
    expect(resultado.rsBruto).toBe(66.5)
    expect(resultado.professorCredit).toBeCloseTo(46.55, 4)
    expect(resultado.arenaCredit).toBeCloseTo(19.95, 4)
  })

  it('Biel / 13 Plays / trimestral (R$4.75): split deve somar ao rsBruto', () => {
    const resultado = calculateCheckinRevenue(13, 4.75, SHARES.biel)
    expect(resultado.rsBruto).toBe(61.75)
    expect(resultado.professorCredit + resultado.arenaCredit).toBeCloseTo(resultado.rsBruto, 10)
  })

  it('Marília / 18 Plays / semestral (R$4.3125): rsBruto=77.625', () => {
    const resultado = calculateCheckinRevenue(18, 4.3125, SHARES.marilia)
    expect(resultado.rsBruto).toBe(77.625)
    expect(resultado.professorCredit).toBeCloseTo(77.625 * 0.65, 10)
    expect(resultado.arenaCredit).toBeCloseTo(77.625 * 0.35, 10)
  })

  it('Marília / 16 Plays / mensal (R$5.125): split deve somar ao rsBruto', () => {
    const resultado = calculateCheckinRevenue(16, 5.125, SHARES.marilia)
    expect(resultado.rsBruto).toBe(82)
    expect(resultado.professorCredit + resultado.arenaCredit).toBeCloseTo(82, 10)
  })

  it('Paulinho / 10 Plays / mensal (R$5.125): rsBruto=51.25, prof=25.625, arena=25.625', () => {
    const resultado = calculateCheckinRevenue(10, 5.125, SHARES.paulinho)
    expect(resultado.rsBruto).toBe(51.25)
    expect(resultado.professorCredit).toBe(25.625)
    expect(resultado.arenaCredit).toBe(25.625)
  })

  it('Paulinho: professorCredit e arenaCredit devem ser iguais (50%/50%)', () => {
    const resultado = calculateCheckinRevenue(10, 5.125, SHARES.paulinho)
    expect(resultado.professorCredit).toBe(resultado.arenaCredit)
  })

  it('Pepe / 13 Plays / trimestral (R$4.75): rsBruto=61.75, split igual 50%/50%', () => {
    const resultado = calculateCheckinRevenue(13, 4.75, SHARES.pepe)
    expect(resultado.rsBruto).toBe(61.75)
    expect(resultado.professorCredit).toBe(30.875)
    expect(resultado.arenaCredit).toBe(30.875)
  })

  it('professorCredit + arenaCredit deve sempre igualar rsBruto (invariante)', () => {
    const casos = [
      { plays: 13, playValue: 4.75, share: SHARES.biel },
      { plays: 18, playValue: 4.3125, share: SHARES.marilia },
      { plays: 10, playValue: 5.125, share: SHARES.paulinho },
      { plays: 14, playValue: 4.75, share: SHARES.pepe },
    ] as const

    for (const { plays, playValue, share } of casos) {
      const r = calculateCheckinRevenue(plays, playValue, share)
      expect(r.professorCredit + r.arenaCredit).toBeCloseTo(r.rsBruto, 10)
    }
  })
})
