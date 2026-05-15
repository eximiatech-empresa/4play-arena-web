import type { PlanConfig } from "@/core/entities/plan-config"
import type { Plan } from "@/core/entities/wallet"

interface UserPlayValueData {
  currentPlanId?: Plan
  planPlayValue?: number
  wallet?: { playValue?: number }
}

export function resolvePlayValue(
  userData: UserPlayValueData,
  planConfigs: Record<string, PlanConfig>,
): number {
  const currentPlanId = (userData.currentPlanId ?? "mensal") as Plan
  let playValue = Number(
    userData.wallet?.playValue ??
    userData.planPlayValue ??
    planConfigs[currentPlanId]?.playValue ??
    planConfigs["mensal"]?.playValue,
  )
  if (Number.isNaN(playValue) || playValue <= 0) {
    playValue = Number(planConfigs[currentPlanId]?.playValue ?? planConfigs["mensal"]?.playValue)
  }
  return playValue
}
