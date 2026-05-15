"use client"

import { AlertTriangle, CreditCard, RefreshCw, ShoppingBag, ReceiptText, PackagePlus } from "lucide-react"
import { cn } from "@/lib/utils"
import { useSubscriptionHistory, usePackageTransactions } from "@/features/student/plano/hooks/use-subscription"
import { usePlans } from "@/features/shared/planos-data/hooks/use-plans"
import { formatCurrency, formatDateTimeBR } from "@/utils/formatters"
import type { SubscriptionDocument, SubscriptionStatus } from "@/core/entities/subscription"
import type { PlanConfig } from "@/core/constants/plan-pricing"
import type { Transaction } from "@/core/entities/wallet"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  })
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<SubscriptionStatus, { label: string; className: string }> = {
  active: {
    label: "Ativo",
    className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  },
  trialing: {
    label: "Período de Teste",
    className: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  },
  past_due: {
    label: "Pagamento Pendente",
    className: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  },
  canceled: {
    label: "Cancelado",
    className: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20",
  },
}

function StatusBadge({ status }: { status: SubscriptionStatus }) {
  const { label, className } = STATUS_CONFIG[status]
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border",
        className,
      )}
    >
      {label}
    </span>
  )
}

function RenewalBadge({ autoRenew }: { autoRenew: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full",
        autoRenew
          ? "bg-emerald-500/10 text-emerald-600"
          : "bg-zinc-500/10 text-zinc-500",
      )}
    >
      {autoRenew ? (
        <>
          <RefreshCw className="w-3 h-3" />
          Renovação automática
        </>
      ) : (
        <>
          <ShoppingBag className="w-3 h-3" />
          Pagamento único
        </>
      )}
    </span>
  )
}

// ─── Active plan hero card ────────────────────────────────────────────────────

function ActivePlanCard({ sub, planData }: { sub: SubscriptionDocument; planData: PlanConfig | undefined }) {
  const totalPlays = planData?.totalPlays

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Plano Atual</h2>
          <p className="text-xs text-zinc-400 mt-0.5">Assinatura em vigor</p>
        </div>
        <StatusBadge status={sub.status} />
      </div>

      {sub.cancelAtPeriodEnd && (
        <div className="mx-6 mt-5 px-4 py-3 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
          <p className="text-xs text-orange-600">
            Cancelamento agendado — você terá acesso até{" "}
            <span className="font-semibold">{fmtDate(sub.currentPeriodEnd)}</span>
          </p>
        </div>
      )}

      <div className="p-6 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-2xl font-bold text-foreground">{planData?.label ?? sub.planId}</p>
            <p className="text-sm text-zinc-400 mt-0.5">
              {totalPlays != null ? `${totalPlays} Plays · ` : ""}{planData?.validityDays != null ? `${planData.validityDays} dias` : ""}
            </p>
          </div>
          {planData && (
            <p className="text-xl font-bold text-brand shrink-0">{formatCurrency(planData.priceInCents / 100)}</p>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div>
            <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-wide">
              Início do período
            </p>
            <p className="text-sm font-semibold text-foreground mt-0.5">
              {fmtDate(sub.currentPeriodStart)}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-wide">
              Válido até
            </p>
            <p className="text-sm font-semibold text-foreground mt-0.5">
              {fmtDate(sub.currentPeriodEnd)}
            </p>
          </div>
          {sub.nextBillingDate && (
            <div>
              <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-wide">
                Próx. cobrança
              </p>
              <p className="text-sm font-semibold text-foreground mt-0.5">
                {fmtDate(sub.nextBillingDate)}
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between flex-wrap gap-3 pt-4 border-t border-border">
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <CreditCard className="w-4 h-4 shrink-0" />
            {sub.cardBrand && sub.cardLast4 ? (
              <span>
                {capitalize(sub.cardBrand)} •••• {sub.cardLast4}
              </span>
            ) : (
              <span className="text-zinc-400">Sem dados de cartão</span>
            )}
          </div>
          <RenewalBadge autoRenew={sub.autoRenew} />
        </div>
      </div>
    </div>
  )
}

// ─── History card ─────────────────────────────────────────────────────────────

function HistoryCard({ sub, planData }: { sub: SubscriptionDocument; planData: PlanConfig | undefined }) {
  return (
    <div className="bg-card rounded-xl border border-border p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={sub.status} />
            <span className="text-sm font-semibold text-foreground">{planData?.label ?? sub.planId}</span>
            {planData && (
              <span className="text-sm text-zinc-400">{formatCurrency(planData.priceInCents / 100)}</span>
            )}
          </div>

          <p className="text-xs text-zinc-400">
            {fmtDate(sub.currentPeriodStart)} → {fmtDate(sub.currentPeriodEnd)}
            {planData?.validityDays != null ? ` · ${planData.validityDays} dias` : ""}
          </p>

          <div className="flex items-center gap-3 flex-wrap">
            <span className="flex items-center gap-1.5 text-xs text-zinc-500">
              <CreditCard className="w-3.5 h-3.5 shrink-0" />
              {sub.cardBrand && sub.cardLast4
                ? `${capitalize(sub.cardBrand)} •••• ${sub.cardLast4}`
                : "Sem dados de cartão"}
            </span>
            <span
              className={cn(
                "inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full",
                sub.autoRenew
                  ? "bg-emerald-500/10 text-emerald-600"
                  : "bg-zinc-500/10 text-zinc-500",
              )}
            >
              {sub.autoRenew ? <RefreshCw className="w-3 h-3" /> : <ShoppingBag className="w-3 h-3" />}
              {sub.autoRenew ? "Automático" : "Manual"}
            </span>
          </div>

          {sub.canceledAt && (
            <p className="text-xs text-zinc-400">
              Cancelado em {fmtDate(sub.canceledAt)}
            </p>
          )}
        </div>

        <span className="text-[10px] text-zinc-300 whitespace-nowrap shrink-0 mt-0.5">
          via Pagar.me (teste)
        </span>
      </div>
    </div>
  )
}

// ─── Package card ─────────────────────────────────────────────────────────────

function PackageCard({ tx }: { tx: Transaction }) {
  return (
    <div className="bg-card rounded-xl border border-border p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand-subtle flex items-center justify-center shrink-0">
            <PackagePlus className="w-4 h-4 text-brand" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Pacote Extra de Plays</p>
            <p className="text-xs text-zinc-400 mt-0.5">{formatDateTimeBR(tx.createdAt)}</p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-bold text-brand-dark tabular-nums">+{tx.amount} Plays</p>
          <p className="text-xs text-zinc-400 tabular-nums">Saldo: {tx.balanceAfter.toFixed(2)}</p>
        </div>
      </div>
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800", className)} />
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
        <div className="flex justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-16" />
        </div>
        <Skeleton className="h-8 w-40" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
        </div>
        <Skeleton className="h-8" />
      </div>
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="bg-card rounded-2xl border border-border p-10 text-center">
      <ReceiptText className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
      <p className="text-sm font-semibold text-foreground">Nenhum plano encontrado</p>
      <p className="text-xs text-zinc-400 mt-1">
        Você ainda não adquiriu nenhum plano. Acesse a Carteira para começar.
      </p>
    </div>
  )
}

// ─── Page component ───────────────────────────────────────────────────────────

export function SubscriptionHistory() {
  const { data: subscriptions, isLoading } = useSubscriptionHistory()
  const { data: packageTxs = [], isLoading: isLoadingPackages } = usePackageTransactions()
  const { data: plans } = usePlans()

  const planMap = new Map<string, PlanConfig>(plans?.map((p) => [p.id, p]))

  const activeSub = subscriptions?.find(
    (s) => s.status === "active" || s.status === "trialing",
  )

  const hasAnyData = subscriptions?.length || packageTxs.length

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Meu Plano</h1>
        <p className="text-sm text-zinc-400 mt-0.5">Histórico de compras e renovações</p>
      </div>

      {isLoading || isLoadingPackages ? (
        <LoadingSkeleton />
      ) : !hasAnyData ? (
        <EmptyState />
      ) : (
        <>
          {activeSub && (
            <ActivePlanCard sub={activeSub} planData={planMap.get(activeSub.planId)} />
          )}

          {subscriptions && subscriptions.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-3">
                Planos ({subscriptions.length})
              </h2>
              <div className="space-y-3">
                {subscriptions.map((sub) => (
                  <HistoryCard key={sub.id} sub={sub} planData={planMap.get(sub.planId)} />
                ))}
              </div>
            </div>
          )}

          {packageTxs.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-3">
                Pacotes Extras ({packageTxs.length})
              </h2>
              <div className="space-y-3">
                {packageTxs.map((tx) => (
                  <PackageCard key={tx.id} tx={tx} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
