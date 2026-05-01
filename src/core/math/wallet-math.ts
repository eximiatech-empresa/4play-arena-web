import { type Plan } from "@/core/entities/wallet"

export function calculateUsedPlays(totalPlays: number, balance: number): number {
  return Math.max(0, totalPlays - balance)
}

export function calculateProgressPct(totalPlays: number, balance: number): number {
  return totalPlays > 0 ? Math.round((balance / totalPlays) * 100) : 0
}
