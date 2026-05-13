"use client"

import { useState } from "react"
import { Lock, Sparkles, PackagePlus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useWallet } from "@/features/wallet/hooks/use-wallet"
import { usePlans } from "@/features/wallet/hooks/use-plans"
import { usePlayPackages } from "@/features/wallet/hooks/use-play-packages"
import { PaymentModal } from "@/features/subscriptions/components/payment-modal"
import { formatCurrency } from "@/utils/formatters"
import type { Plan } from "@/core/entities/wallet"
import type { PlanConfig } from "@/core/constants/plan-pricing"
import type { PlayPackage } from "@/lib/firebase/play-packages"

interface RechargeSectionProps {
  readOnly?: boolean
}

type PlanEntry = PlanConfig & { popular: boolean }

type ModalItem =
  | { kind: "plan"; entry: PlanEntry }
  | { kind: "package"; entry: PlayPackage }

function formatPlayValue(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  }).format(value)
}

function isPlanActive(expiresAt?: string): boolean {
  if (!expiresAt) return false
  return new Date(expiresAt) > new Date()
}

export function RechargeSection({ readOnly = false }: RechargeSectionProps) {
  const [modalItem, setModalItem] = useState<ModalItem | null>(null)
  const { data: wallet } = useWallet()
  const { data: plans = [] } = usePlans()
  const { data: packages = [] } = usePlayPackages()

  const planActive = isPlanActive(wallet?.expiresAt)
  const expiresDate = wallet?.expiresAt
    ? new Date(wallet.expiresAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })
    : null

  const availablePlans: PlanEntry[] = plans.map((plan) => ({
    ...plan,
    popular: plan.popular ?? false,
  }))

  return (
    <>
      {/* ── Planos de Assinatura ── */}
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">Planos de Assinatura</h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            {planActive
              ? `Plano ativo até ${expiresDate} — disponível para renovação após o vencimento`
              : "Escolha um plano para garantir vagas como Titular"}
          </p>
        </div>
        <div className="p-6">
          <div className="grid gap-4 sm:grid-cols-3">
            {availablePlans.map((pkg) => (
              <div
                key={pkg.id}
                className={cn(
                  "relative rounded-xl border-2 p-5 transition-all",
                  planActive
                    ? "border-border opacity-60 grayscale-[30%]"
                    : pkg.popular
                      ? "border-brand bg-brand-subtle/50"
                      : "border-border",
                )}
              >
                {pkg.popular && !planActive && (
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 bg-brand text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                      <Sparkles className="w-3 h-3" />
                      Popular
                    </span>
                  </div>
                )}
                {planActive && (
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 bg-zinc-400 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                      <Lock className="w-2.5 h-2.5" />
                      Bloqueado
                    </span>
                  </div>
                )}

                <div className="text-center">
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    {pkg.label}
                  </p>
                  <div className="mt-2 flex items-end justify-center gap-1">
                    <span className={cn("text-3xl font-bold tabular-nums", !planActive && pkg.popular ? "text-chart-2" : "text-foreground")}>
                      {pkg.totalPlays}
                    </span>
                    <span className="text-sm font-medium text-zinc-400 mb-0.5">Plays</span>
                  </div>
                  <p className={cn("text-lg font-bold mt-1", !planActive && pkg.popular ? "text-chart-2" : "text-foreground")}>
                    {formatCurrency(pkg.priceInCents / 100)}
                  </p>
                  <p className="text-[11px] text-zinc-400 mt-0.5">Validade {pkg.validityDays} dias</p>
                  <p className={cn(
                    "text-[11px] font-semibold mt-1.5 px-2 py-0.5 rounded-full inline-block",
                    !planActive && pkg.popular ? "bg-brand-subtle text-brand-dark" : "bg-muted text-zinc-500",
                  )}>
                    R$ {formatPlayValue(pkg.playValue)}/Play
                  </p>
                </div>

                {!readOnly && (
                  <Button
                    onClick={() => setModalItem({ kind: "plan", entry: pkg })}
                    disabled={planActive}
                    className={cn(
                      "w-full mt-4 h-9 text-xs font-semibold transition-all",
                      planActive
                        ? "bg-zinc-200 text-zinc-400 cursor-not-allowed"
                        : pkg.popular
                          ? "bg-brand hover:bg-brand-dark text-white"
                          : "bg-foreground hover:bg-foreground/90 text-background",
                    )}
                  >
                    {planActive ? <><Lock className="w-3 h-3 mr-1.5" />Indisponível</> : "Comprar"}
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Pacotes Extras ── */}
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <PackagePlus className="w-4 h-4 text-brand" />
            <h2 className="text-base font-semibold text-foreground">Pacotes Extras de Plays</h2>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            {planActive
              ? "Adicione Plays ao saldo atual sem alterar seu plano ou data de vencimento"
              : "Disponível apenas com um plano ativo"}
          </p>
        </div>
        <div className="p-6">
          {packages.length === 0 ? (
            <p className="text-sm text-zinc-400 text-center py-6">
              Nenhum pacote disponível no momento.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-3">
              {packages.map((pkg) => (
                <div
                  key={pkg.id}
                  className={cn(
                    "relative rounded-xl border-2 p-5 transition-all",
                    !planActive
                      ? "border-border opacity-60 grayscale-[30%]"
                      : pkg.popular
                        ? "border-brand bg-brand-subtle/50"
                        : "border-border",
                  )}
                >
                  {pkg.popular && planActive && (
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                      <span className="inline-flex items-center gap-1 bg-brand text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                        <Sparkles className="w-3 h-3" />
                        Popular
                      </span>
                    </div>
                  )}
                  {!planActive && (
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                      <span className="inline-flex items-center gap-1 bg-zinc-400 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                        <Lock className="w-2.5 h-2.5" />
                        Requer plano
                      </span>
                    </div>
                  )}

                  <div className="text-center">
                    <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                      {pkg.label}
                    </p>
                    <div className="mt-2 flex items-end justify-center gap-1">
                      <span className={cn("text-3xl font-bold tabular-nums", planActive && pkg.popular ? "text-chart-2" : "text-foreground")}>
                        {pkg.plays}
                      </span>
                      <span className="text-sm font-medium text-zinc-400 mb-0.5">Plays</span>
                    </div>
                    <p className={cn("text-lg font-bold mt-1", planActive && pkg.popular ? "text-chart-2" : "text-foreground")}>
                      {formatCurrency(pkg.priceInCents / 100)}
                    </p>
                  </div>

                  {!readOnly && (
                    <Button
                      onClick={() => setModalItem({ kind: "package", entry: pkg })}
                      disabled={!planActive}
                      className={cn(
                        "w-full mt-4 h-9 text-xs font-semibold transition-all",
                        !planActive
                          ? "bg-zinc-200 text-zinc-400 cursor-not-allowed"
                          : pkg.popular
                            ? "bg-brand hover:bg-brand-dark text-white"
                            : "bg-foreground hover:bg-foreground/90 text-background",
                      )}
                    >
                      {!planActive ? <><Lock className="w-3 h-3 mr-1.5" />Requer plano</> : "Comprar Plays"}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Modal de Pagamento ── */}
      {modalItem && (
        <PaymentModal
          open
          onOpenChange={(open) => { if (!open) setModalItem(null) }}
          plan={
            modalItem.kind === "plan"
              ? {
                  kind: "plan",
                  id: modalItem.entry.id as Plan,
                  label: modalItem.entry.label,
                  price: modalItem.entry.priceInCents / 100,
                  plays: modalItem.entry.totalPlays,
                  days: modalItem.entry.validityDays,
                  playValue: modalItem.entry.playValue,
                }
              : {
                  kind: "package",
                  id: modalItem.entry.id as Plan,
                  label: modalItem.entry.label,
                  price: modalItem.entry.priceInCents / 100,
                  plays: modalItem.entry.plays,
                }
          }
          currentBalance={wallet?.balance ?? 0}
        />
      )}
    </>
  )
}
