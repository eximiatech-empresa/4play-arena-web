import type { Plan } from "@/core/entities/wallet"
export type { Plan }

export interface ProfessorRate {
  id: string
  name: string
  /** Determines ceiling rounding rule (Marília Premium) */
  isPremium: boolean
  consumption: Record<Plan, number>
}

/**
 * Professor pricing table.
 * Source: client-provided rates (project.md).
 * Consumption values represent hours debited per class at peak hours.
 * Off-peak discount (×0.95) is applied separately in core/math/consumption.ts.
 */
export const PROFESSORS: readonly ProfessorRate[] = [
  {
    id: "paulinho",
    name: "Paulinho",
    isPremium: false,
    consumption: { mensal: 0.9, trimestral: 0.85, semestral: 0.8 },
  },
  {
    id: "biel",
    name: "Biel",
    isPremium: false,
    consumption: { mensal: 1.05, trimestral: 1.0, semestral: 0.95 },
  },
  {
    id: "pepe",
    name: "Pepe",
    isPremium: false,
    consumption: { mensal: 1.1, trimestral: 1.05, semestral: 1.0 },
  },
  {
    id: "marilia",
    name: "Marília",
    isPremium: true,
    consumption: { mensal: 1.5, trimestral: 1.42, semestral: 1.35 },
  },
] as const

export function getProfessorById(id: string): ProfessorRate | undefined {
  return PROFESSORS.find((p) => p.id === id)
}

export const PEAK_WINDOW = { startHour: 18, endHour: 20 } // 18:00–20:00 = peak

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

export const PLANS = {
  mensal: { label: "Mensal", hours: 8, price: 449, days: 30 },
  trimestral: { label: "Trimestral", hours: 24, price: 1269, days: 90 },
  semestral: { label: "Semestral", hours: 48, price: 2369, days: 180 },
} as const
