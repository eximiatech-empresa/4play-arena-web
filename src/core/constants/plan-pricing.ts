import type { PlanConfig } from "@/core/entities/plan-config"

export type PlanId = string

export const PLAN_CONFIGS: Readonly<Record<PlanId, PlanConfig>> = {
  mensal: {
    id: "mensal",
    label: "Mensal",
    totalPlays: 80,
    validityDays: 30,
    priceInCents: 41000,
    playValue: 5.125,
  },
  trimestral: {
    id: "trimestral",
    label: "Trimestral",
    totalPlays: 240,
    validityDays: 90,
    priceInCents: 114000,
    playValue: 4.75,
  },
  semestral: {
    id: "semestral",
    label: "Semestral",
    totalPlays: 480,
    validityDays: 180,
    priceInCents: 207000,
    playValue: 4.3125,
  },
} as const

export type { PlanConfig }
