import type { Plan } from "@/core/constants/professors"

export const PLAN_MULTIPLIERS: Record<Plan, number> = {
  mensal: 1.2,
  trimestral: 1.0,
  semestral: 0.8,
}
