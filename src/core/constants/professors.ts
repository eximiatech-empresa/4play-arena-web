// src/core/constants/professors.ts

export type RoundingRule = "round" | "ceil"

export interface ProfessorConfig {
  readonly id: string
  readonly name: string
  readonly basePlays: number
  readonly roundingRule: RoundingRule
  /** Percentage of revenue credited to the professor (0–1). */
  readonly professorSharePct: number
  /** Percentage of revenue credited to the arena (0–1). */
  readonly arenaSharePct: number
}

export type ProfessorId = "paulinho" | "biel" | "pepe" | "marilia"

export const PROFESSOR_MAP: Readonly<Record<ProfessorId, ProfessorConfig>> = {
  paulinho: {
    id: "paulinho",
    name: "Paulinho",
    basePlays: 10,
    roundingRule: "round",
    professorSharePct: 0.5,
    arenaSharePct: 0.5,
  },
  biel: {
    id: "biel",
    name: "Biel",
    basePlays: 13,
    roundingRule: "round",
    professorSharePct: 0.7,
    arenaSharePct: 0.3,
  },
  pepe: {
    id: "pepe",
    name: "Pepe",
    basePlays: 13,
    roundingRule: "round",
    professorSharePct: 0.5,
    arenaSharePct: 0.5,
  },
  marilia: {
    id: "marilia",
    name: "Marília",
    basePlays: 16,
    roundingRule: "ceil",
    professorSharePct: 0.65,
    arenaSharePct: 0.35,
  },
} as const

/** Convenience array for iteration (e.g. dropdowns). */
export const PROFESSORS: readonly ProfessorConfig[] = Object.values(PROFESSOR_MAP)

export function getProfessorById(id: string): ProfessorConfig | undefined {
  return PROFESSOR_MAP[id as ProfessorId]
}

/** Peak window: 18:00 (inclusive) – 20:00 (exclusive). */
export const PEAK_WINDOW = { startHour: 18, endHour: 20 } as const

export const STUDENT_LEVELS = [
  "Principiante",
  "Iniciante",
  "Nível D",
  "Nível C",
  "Nível B",
  "Nível A",
  "Profissional",
] as const

export type StudentLevel = (typeof STUDENT_LEVELS)[number]

// ─── Backward-compat shim ─────────────────────────────────────────────────────
// Features outside src/core/ still import PLANS from this module.
// This shim maps PLAN_CONFIGS into the legacy shape so those imports keep
// compiling without modification. Do NOT use in new core code — prefer
// PLAN_CONFIGS from @/core/constants/plan-pricing directly.

import { PLAN_CONFIGS } from "@/core/constants/plan-pricing"
import type { PlanId } from "@/core/constants/plan-pricing"

/** @deprecated Use PLAN_CONFIGS from @/core/constants/plan-pricing */
export const PLANS: Record<
  PlanId,
  { label: string; hours: number; price: number; days: number }
> = {
  mensal: {
    label: PLAN_CONFIGS.mensal.label,
    hours: PLAN_CONFIGS.mensal.totalPlays,
    price: PLAN_CONFIGS.mensal.priceInCents / 100,
    days: PLAN_CONFIGS.mensal.validityDays,
  },
  trimestral: {
    label: PLAN_CONFIGS.trimestral.label,
    hours: PLAN_CONFIGS.trimestral.totalPlays,
    price: PLAN_CONFIGS.trimestral.priceInCents / 100,
    days: PLAN_CONFIGS.trimestral.validityDays,
  },
  semestral: {
    label: PLAN_CONFIGS.semestral.label,
    hours: PLAN_CONFIGS.semestral.totalPlays,
    price: PLAN_CONFIGS.semestral.priceInCents / 100,
    days: PLAN_CONFIGS.semestral.validityDays,
  },
} as const

/** @deprecated Re-exported for backward-compat; prefer Plan from @/core/entities/wallet */
export type { Plan } from "@/core/entities/wallet"
