// src/features/wallet/components/wallet-page-content.tsx
"use client"

import { Loader2 } from "lucide-react"
import { useWallet } from "@/features/wallet/hooks/use-wallet"
import { PLANS } from "@/core/constants/professors"
import { computeWalletMetrics, computeDaysUntilExpiration } from "@/features/wallet/utils/wallet-metrics"
import { BalanceHero } from "./balance-hero"
import { MetricCards } from "./metric-cards"
import { TransactionList } from "./transaction-list"
import { RechargeSection } from "./recharge-section"

export function WalletPageContent() {
  const { data: wallet, isLoading, isError } = useWallet()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
      </div>
    )
  }

  if (isError || !wallet) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <p className="text-sm font-medium text-zinc-600">
          Erro ao carregar a carteira
        </p>
        <p className="text-xs text-zinc-400 mt-1">
          Tente novamente mais tarde
        </p>
      </div>
    )
  }

  const plan = PLANS[wallet.plan]
  const daysLeft = computeDaysUntilExpiration(wallet.expiresAt)
  const expiresAt = new Date(wallet.expiresAt)
  const metrics = computeWalletMetrics(wallet.transactions, wallet.balance, wallet.totalHours)

  return (
    <div className="px-5 py-6 lg:px-8 lg:py-8 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Carteira de Horas</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Gerencie seu saldo, histórico e recargas</p>
      </div>
      {/* Balance hero */}
      <BalanceHero balance={wallet.balance} totalHours={wallet.totalHours} />

      {/* Plan info strip */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-subtle border border-brand/20 px-3 py-1 text-xs font-semibold text-brand-dark">
          {plan.label} · R$ {plan.price.toLocaleString("pt-BR")}
        </span>
        <span
          className={
            daysLeft <= 7
              ? "inline-flex items-center gap-1.5 rounded-full bg-red-50 border border-red-200 text-red-600 px-3 py-1 text-xs font-semibold"
              : "inline-flex items-center gap-1.5 rounded-full bg-zinc-50 border border-zinc-200 text-zinc-500 px-3 py-1 text-xs font-semibold"
          }
        >
          Vence em {daysLeft} dias ·{" "}
          {expiresAt.toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "short",
          })}
        </span>
      </div>

      {/* Metric cards */}
      <MetricCards metrics={metrics} totalHours={wallet.totalHours} />

      {/* Recharge section */}
      <RechargeSection />

      {/* Transaction history */}
      <TransactionList transactions={wallet.transactions} plan={wallet.plan} />
    </div>
  )
}
