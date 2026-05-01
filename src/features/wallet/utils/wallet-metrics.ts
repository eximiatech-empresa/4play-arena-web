// src/features/wallet/utils/wallet-metrics.ts
import type { Transaction } from "@/core/entities/wallet"

export interface WalletMetrics {
  playsUsedThisMonth: number
  lessonsThisMonth: number
  totalLessonsAttended: number
  usedPlays: number
}

export function computeWalletMetrics(
  transactions: Transaction[],
  balance: number,
  totalPlays: number,
  referenceDate: Date = new Date()
): WalletMetrics {
  const currentMonth = referenceDate.getMonth()
  const currentYear = referenceDate.getFullYear()

  const monthDebits = transactions.filter((tx) => {
    if (tx.type !== "debit") return false
    const d = new Date(tx.createdAt)
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear
  })

  return {
    playsUsedThisMonth: monthDebits.reduce((sum, tx) => sum + Math.abs(tx.amount), 0),
    lessonsThisMonth: monthDebits.length,
    totalLessonsAttended: transactions.filter((tx) => tx.type === "debit").length,
    usedPlays: totalPlays - balance,
  }
}

export function computeDaysUntilExpiration(
  expiresAt: string,
  referenceDate: Date = new Date()
): number {
  const expiry = new Date(expiresAt)
  return Math.ceil(
    (expiry.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24)
  )
}