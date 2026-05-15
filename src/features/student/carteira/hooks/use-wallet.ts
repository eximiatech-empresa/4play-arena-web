import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getFirebaseAuth } from "@/lib/firebase/auth"
import { getStudentTransactions, processPlanPurchase } from "@/lib/firebase/transactions"
import { calculateTotalPlays, normalizePlanExpiresAt } from "@/core/math/wallet-balance"
import { usePlans } from "@/features/shared/planos-data/hooks/use-plans"
import { useCurrentUser } from "@/hooks/use-current-user"
import type { Wallet, Plan } from "@/core/entities/wallet"
import type { StudentUser } from "@/core/entities/user"

const WALLET_QUERY_KEY = ["wallet"] as const

export function useWallet() {
  const { data: currentUser } = useCurrentUser()
  const { data: plans } = usePlans()
  const student = currentUser?.role === "STUDENT" ? (currentUser as StudentUser) : null
  const planConfig = plans?.find((p) => p.id === student?.currentPlanId)

  return useQuery({
    queryKey: WALLET_QUERY_KEY,
    queryFn: async (): Promise<Wallet | null> => {
      if (!student) return null

      const transactions = await getStudentTransactions(student.uid)

      return {
        id: student.uid,
        studentId: student.uid,
        balance: student.walletBalance,
        totalPlays: calculateTotalPlays(transactions, planConfig?.totalPlays ?? 0),
        plan: student.currentPlanId,
        playValue: student.planPlayValue ?? planConfig?.playValue,
        expiresAt: normalizePlanExpiresAt(student.planExpiresAt),
        transactions,
      }
    },
    enabled: !!student,
    staleTime: 5 * 60 * 1000,
  })
}

export function usePurchasePlan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      planId,
      playsAmount,
      expiresInDays,
      currentBalance,
      playValue,
    }: {
      planId: Plan
      playsAmount: number
      expiresInDays: number
      currentBalance: number
      playValue: number
    }) => {
      const fbUser = getFirebaseAuth().currentUser
      if (!fbUser) throw new Error("Usuário não autenticado")

      await processPlanPurchase(fbUser.uid, planId, playsAmount, expiresInDays, currentBalance, playValue)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WALLET_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: ["currentUser"] })
    },
  })
}
