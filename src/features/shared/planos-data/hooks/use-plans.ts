import { useQuery } from "@tanstack/react-query"
import { getPlans } from "@/lib/firebase/plans"
import type { PlanConfig } from "@/core/constants/plan-pricing"

export function usePlans() {
  return useQuery<PlanConfig[]>({
    queryKey: ["plans"],
    queryFn: getPlans,
    staleTime: 10 * 60 * 1000,
  })
}
