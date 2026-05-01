// src/features/wallet/hooks/use-wallet.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getFirebaseAuth } from "@/lib/firebase/auth"
import { getUserDocument } from "@/lib/firebase/firestore"
import { getStudentTransactions, processPlanPurchase } from "@/lib/firebase/transactions"
import { PLANS } from "@/core/constants/professors"
import { PLAN_MULTIPLIERS } from "@/core/math/consumption"
import type { Wallet, Plan } from "@/core/entities/wallet"
import type { StudentUser } from "@/core/entities/user"
import { waitForAuthInit } from "@/lib/firebase/auth"

const WALLET_QUERY_KEY = ["wallet"] as const

async function fetchWallet(): Promise<Wallet | null> {  
  try {
    const fbUser = await waitForAuthInit()
    if (!fbUser) return null;

    const userDoc = await getUserDocument(fbUser.uid);

    if (!userDoc || userDoc.role !== "STUDENT") return null;

    const student = userDoc as StudentUser;
    
    const transactions = await getStudentTransactions(fbUser.uid);

    const planData = PLANS[student.currentPlanId];

    const totalPlays = transactions
      .filter(t => t.type === "purchase" || t.type === "credit")
      .reduce((sum, t) => sum + t.amount, 0) || (planData.hours * PLAN_MULTIPLIERS[student.currentPlanId]);

    return {
      id: student.uid,
      studentId: student.uid,
      balance: student.walletBalance,
      totalPlays,
      plan: student.currentPlanId,
      planValue: planData.price,
      expiresAt: student.planExpiresAt,
      transactions,
    };
  } catch (error) {
    throw error;
  }
}

export function useWallet() {
  return useQuery({
    queryKey: WALLET_QUERY_KEY,
    queryFn: fetchWallet,
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

  async function fetchWallet(): Promise<Wallet | null> {
    try {
      // Agora a carteira também ESPERA o Firebase carregar o cache
      const fbUser = await waitForAuthInit()
      if (!fbUser) return null

      const userDoc = await getUserDocument(fbUser.uid)
      if (!userDoc || userDoc.role !== "STUDENT") {
        console.error("Erro: Documento do Aluno não encontrado ou role não é STUDENT.", userDoc)
        return null
      }

      const student = userDoc as StudentUser
      const transactions = await getStudentTransactions(fbUser.uid)
      const planData = PLANS[student.currentPlanId]

      const totalPlays = transactions
        .filter(t => t.type === "purchase" || t.type === "credit")
        .reduce((sum, t) => sum + t.amount, 0) || (planData.hours * PLAN_MULTIPLIERS[student.currentPlanId])

      return {
        id: student.uid,
        studentId: student.uid,
        balance: student.walletBalance,
        totalPlays,
        plan: student.currentPlanId,
        planValue: planData.price,
        expiresAt: student.planExpiresAt,
        transactions,
      }
    } catch (error) {
      // Se der qualquer erro fatal, jogamos na cara do console para não ficarmos cegos
      console.error("Erro fatal ao carregar a carteira:", error)
      throw error
    }
  }
}