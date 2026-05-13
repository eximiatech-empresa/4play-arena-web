// src/core/constants/plan-pricing.ts

export type PlanId = string

export interface PlanConfig {
  readonly id: PlanId
  readonly label: string
  /** Total plays granted on purchase. */
  readonly totalPlays: number
  /** Plan validity in days. */
  readonly validityDays: number
  /** Price in BRL (R$). */
  readonly priceInCents: number
  /** Monetary value of a single Play for this plan (R$). */
  readonly playValue: number
  /** Whether this plan is highlighted as "popular" in the UI. */
  readonly popular?: boolean
}

export const PLAN_CONFIGS: Readonly<Record<PlanId, PlanConfig>> = {
  mensal: {
    id: "mensal",
    label: "Mensal",
    totalPlays: 80,
    validityDays: 30,
    priceInCents: 41000, // R$ 410,00
    playValue: 5.125,
  },
  trimestral: {
    id: "trimestral",
    label: "Trimestral",
    totalPlays: 240,
    validityDays: 90,
    priceInCents: 114000, // R$ 1.140,00
    playValue: 4.75,
  },
  semestral: {
    id: "semestral",
    label: "Semestral",
    totalPlays: 480,
    validityDays: 180,
    priceInCents: 207000, // R$ 2.070,00
    playValue: 4.3125,
  },
} as const
