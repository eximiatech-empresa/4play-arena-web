// src/features/wallet/hooks/use-wallet.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getFirebaseAuth } from "@/lib/firebase/auth"
import { getStudentTransactions, processPlanPurchase } from "@/lib/firebase/transactions"
import { PLANS } from "@/core/constants/professors"
import { PLAN_MULTIPLIERS } from "@/core/math/consumption"
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

      const totalPlays =
        transactions
          .filter((t) => t.type === "purchase" || t.type === "credit")
          .reduce((sum, t) => sum + t.amount, 0) ||
        planData.hours * PLAN_MULTIPLIERS[student.currentPlanId]

      return {
        id: student.uid,
        studentId: student.uid,
        balance: student.walletBalance,
        totalPlays,
        plan: student.currentPlanId,
        planValue: planData.price,
        expiresAt:
          typeof student.planExpiresAt === "string"
            ? student.planExpiresAt
            : new Date((student.planExpiresAt as { seconds: number }).seconds * 1000).toISOString(),
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
      currentBalance
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