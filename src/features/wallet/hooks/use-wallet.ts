import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getFirebaseAuth } from "@/lib/firebase/auth"
import { getStudentTransactions, processPlanPurchase } from "@/lib/firebase/transactions"
import { PLANS } from "@/core/constants/professors"
import { calculateTotalPlays, normalizePlanExpiresAt } from "@/core/math/wallet-balance"
import { useCurrentUser } from "@/hooks/use-current-user"
import type { Wallet, Plan } from "@/core/entities/wallet"
import type { StudentUser } from "@/core/entities/user"

const WALLET_QUERY_KEY = ["wallet"] as const

export function useWallet() {
  const { data: currentUser } = useCurrentUser()
  const student = currentUser?.role === "STUDENT" ? (currentUser as StudentUser) : null

  return useQuery({
    queryKey: WALLET_QUERY_KEY,
    queryFn: async (): Promise<Wallet | null> => {
      if (!student) return null

      const transactions = await getStudentTransactions(student.uid)
      const planData = PLANS[student.currentPlanId]

      return {
        id: student.uid,
        studentId: student.uid,
        balance: student.walletBalance,
        totalPlays: calculateTotalPlays(transactions, student.currentPlanId),
        plan: student.currentPlanId,
        planValue: planData.price,
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
    }: {
      planId: Plan
      playsAmount: number
      expiresInDays: number
      currentBalance: number
    }) => {
      const fbUser = getFirebaseAuth().currentUser
      if (!fbUser) throw new Error("Usuário não autenticado")

      await processPlanPurchase(fbUser.uid, planId, playsAmount, expiresInDays, currentBalance)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WALLET_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: ["currentUser"] })
    },
  })
}
