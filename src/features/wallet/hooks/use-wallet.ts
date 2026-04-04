// src/features/wallet/hooks/use-wallet.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { MOCK_WALLET } from "@/features/wallet/mock-data"
import type { Wallet, Transaction } from "@/core/entities/wallet"

const WALLET_QUERY_KEY = ["wallet"] as const

function fetchWallet(): Promise<Wallet> {
  // TODO (Supabase): Replace with real API call
  return new Promise((resolve) => {
    setTimeout(() => resolve(structuredClone(MOCK_WALLET)), 300)
  })
}

function addCredits({
  hours,
  currentBalance,
}: {
  hours: number
  currentBalance: number
}): Promise<Transaction> {
  // TODO (Supabase): Replace with real API call
  return new Promise((resolve) => {
    setTimeout(() => {
      const transaction: Transaction = {
        id: `tx-${Date.now()}`,
        walletId: MOCK_WALLET.id,
        lessonId: null,
        type: "credit",
        hours,
        balanceAfter: currentBalance + hours,
        professorName: null,
        classLevel: null,
        isOffPeak: null,
        createdAt: new Date().toISOString(),
      }
      resolve(transaction)
    }, 600)
  })
}

export function useWallet() {
  return useQuery({
    queryKey: WALLET_QUERY_KEY,
    queryFn: fetchWallet,
  })
}

export function useAddCredits() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: addCredits,
    onSuccess: (newTransaction) => {
      queryClient.setQueryData<Wallet>(WALLET_QUERY_KEY, (old) => {
        if (!old) return old
        return {
          ...old,
          balance: newTransaction.balanceAfter,
          totalHours: old.totalHours + newTransaction.hours,
          transactions: [newTransaction, ...old.transactions],
        }
      })
    },
  })
}
