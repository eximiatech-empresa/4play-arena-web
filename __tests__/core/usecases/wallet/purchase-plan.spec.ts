import { describe, it, expect } from 'vitest'
import { buildPlanPurchase } from '@/core/usecases/wallet/purchase-plan'
import { PLAN_CONFIGS } from '@/core/constants/plan-pricing'

// ─── buildPlanPurchase ────────────────────────────────────────────────────────
// Garante que a função congela corretamente o playValue do plano no momento
// da compra e calcula a data de expiração com base em validityDays.

describe('buildPlanPurchase', () => {
  // Data de referência fixa para testes determinísticos
  const AGORA = new Date('2025-06-01T12:00:00.000Z')

  // ── Plano Mensal ──────────────────────────────────────────────────────────────

  describe('plano mensal', () => {
    it('deve retornar 80 Plays', () => {
      const resultado = buildPlanPurchase('mensal', AGORA)

      expect(resultado.totalPlays).toBe(80)
    })

    it('deve congelar o playValue em R$5,1250', () => {
      const resultado = buildPlanPurchase('mensal', AGORA)

      expect(resultado.playValue).toBe(5.125)
    })

    it('deve calcular expiresAt como hoje + 30 dias', () => {
      const resultado = buildPlanPurchase('mensal', AGORA)

      const esperado = new Date('2025-07-01T12:00:00.000Z').toISOString()
      expect(resultado.expiresAt).toBe(esperado)
    })
  })

  // ── Plano Trimestral ─────────────────────────────────────────────────────────

  describe('plano trimestral', () => {
    it('deve retornar 240 Plays', () => {
      const resultado = buildPlanPurchase('trimestral', AGORA)

      expect(resultado.totalPlays).toBe(240)
    })

    it('deve congelar o playValue em R$4,7500', () => {
      const resultado = buildPlanPurchase('trimestral', AGORA)

      expect(resultado.playValue).toBe(4.75)
    })

    it('deve calcular expiresAt como hoje + 90 dias', () => {
      const resultado = buildPlanPurchase('trimestral', AGORA)

      const esperado = new Date(AGORA)
      esperado.setDate(esperado.getDate() + 90)
      expect(resultado.expiresAt).toBe(esperado.toISOString())
    })
  })

  // ── Plano Semestral ──────────────────────────────────────────────────────────

  describe('plano semestral', () => {
    it('deve retornar 480 Plays', () => {
      const resultado = buildPlanPurchase('semestral', AGORA)

      expect(resultado.totalPlays).toBe(480)
    })

    it('deve congelar o playValue em R$4,3125', () => {
      const resultado = buildPlanPurchase('semestral', AGORA)

      expect(resultado.playValue).toBe(4.3125)
    })

    it('deve calcular expiresAt como hoje + 180 dias', () => {
      const resultado = buildPlanPurchase('semestral', AGORA)

      const esperado = new Date(AGORA)
      esperado.setDate(esperado.getDate() + 180)
      expect(resultado.expiresAt).toBe(esperado.toISOString())
    })
  })

  // ── Consistência com PLAN_CONFIGS ────────────────────────────────────────────

  it('os valores de todos os planos devem coincidir com PLAN_CONFIGS', () => {
    const planos = ['mensal', 'trimestral', 'semestral'] as const

    for (const planId of planos) {
      const resultado = buildPlanPurchase(planId, AGORA)
      const config = PLAN_CONFIGS[planId]

      expect(resultado.totalPlays).toBe(config.totalPlays)
      expect(resultado.playValue).toBe(config.playValue)
    }
  })

  // ── playValue é único por plano (Regra de Ouro spec §8) ──────────────────────

  it('planos distintos devem ter playValues distintos', () => {
    const mensal = buildPlanPurchase('mensal', AGORA)
    const trimestral = buildPlanPurchase('trimestral', AGORA)
    const semestral = buildPlanPurchase('semestral', AGORA)

    // mensal > trimestral > semestral (fidelização: mais longo = mais barato)
    expect(mensal.playValue).toBeGreaterThan(trimestral.playValue)
    expect(trimestral.playValue).toBeGreaterThan(semestral.playValue)
  })
})
