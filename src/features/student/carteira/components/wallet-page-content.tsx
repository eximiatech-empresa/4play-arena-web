// src/features/wallet/components/wallet-page-content.tsx
"use client"
import { Info, Loader2, Wallet } from "lucide-react"
import { useWallet } from "@/features/student/carteira/hooks/use-wallet"
import { useCurrentUser } from "@/hooks/use-current-user"
import { PLANS } from "@/core/constants/professors"
import { usePlans } from "@/features/shared/planos-data/hooks/use-plans"
import { computeWalletMetrics, computeDaysUntilExpiration } from "@/features/student/carteira/utils/wallet-metrics"
import { BalanceHero } from "./balance-hero"
import { MetricCards } from "./metric-cards"
import { TransactionList } from "./transaction-list"
import { RechargeSection } from "./recharge-section"

function TeacherEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center gap-4">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-brand-subtle">
        <Wallet className="w-8 h-8 text-brand" />
      </div>
      <div className="max-w-xs space-y-1">
        <p className="text-base font-semibold text-foreground">Página não disponível</p>
        <p className="text-sm text-muted-foreground flex items-start gap-1.5 text-left">
          <Info className="w-4 h-4 mt-0.5 shrink-0 text-zinc-400" />
          Professores não realizam compra de aulas. A Carteira de Plays é exclusiva para alunos.
        </p>
      </div>
    </div>
  )
}

function AdminPricingView() {
  return (
    <div className="px-5 py-6 lg:px-8 lg:py-8 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Tabela de Preços</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Visão administrativa dos planos disponíveis</p>
      </div>
      <RechargeSection readOnly />
    </div>
  )
}

export function WalletPageContent() {
  const { data: user, isLoading: isUserLoading } = useCurrentUser()
  const { data: wallet, isLoading: isWalletLoading, isError } = useWallet()
  const { data: plans = [] } = usePlans()

  if (isUserLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
      </div>
    )
  }

  if (user?.role === "TEACHER") return <TeacherEmptyState />
  if (user?.role === "ADMIN") return <AdminPricingView />

  // STUDENT view
  if (isWalletLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
      </div>
    )
  }

  if (isError || !wallet) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <p className="text-sm font-medium text-zinc-600">Erro ao carregar a carteira</p>
        <p className="text-xs text-zinc-400 mt-1">Tente novamente mais tarde</p>
      </div>
    )
  }

  const firebasePlan = plans.find((p) => p.id === wallet.plan)
  const legacyPlan = PLANS[wallet.plan as keyof typeof PLANS]
  const planLabel = firebasePlan?.label ?? legacyPlan?.label ?? wallet.plan
  const planPrice = firebasePlan ? firebasePlan.priceInCents / 100 : legacyPlan?.price
  const daysLeft = computeDaysUntilExpiration(wallet.expiresAt)
  const expiresAt = new Date(wallet.expiresAt)
  const metrics = computeWalletMetrics(wallet.transactions, wallet.balance, wallet.totalPlays)

  return (
    <div className="px-5 py-6 lg:px-8 lg:py-8 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Carteira de Plays</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Gerencie seu saldo, histórico e recargas da sua moeda</p>
      </div>

      <BalanceHero balance={wallet.balance} totalPlays={wallet.totalPlays} />

      <div className="flex items-center gap-3 flex-wrap">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-subtle border border-brand/20 px-3 py-1 text-xs font-semibold text-brand-dark">
          {planLabel}{planPrice !== undefined ? ` - R$ ${planPrice.toLocaleString("pt-BR")}` : ""}
        </span>
        <span
          className={
            daysLeft <= 7
              ? "inline-flex items-center gap-1.5 rounded-full bg-red-50 border border-red-200 text-red-600 px-3 py-1 text-xs font-semibold"
              : "inline-flex items-center gap-1.5 rounded-full bg-muted border border-border text-muted-foreground px-3 py-1 text-xs font-semibold"
          }
        >
          Vence em {daysLeft} dias •{" "}
          {expiresAt.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
        </span>
      </div>

      <MetricCards metrics={metrics} totalPlays={wallet.totalPlays} />
      <RechargeSection />
      <TransactionList transactions={wallet.transactions} plan={wallet.plan} />
    </div>
  )
}