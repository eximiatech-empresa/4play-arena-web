"use client"

import { useState } from "react"
import { Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useWallet } from "@/features/wallet/hooks/use-wallet"
import { PaymentModal } from "@/features/subscriptions/components/payment-modal"
import { PLANS } from "@/core/constants/professors"
import { PLAN_MULTIPLIERS } from "@/core/math/consumption"
import { formatCurrency } from "@/utils/formatters"
import type { Plan } from "@/core/entities/wallet"

interface RechargeSectionProps {
  readOnly?: boolean
}

type PlanEntry = { id: Plan; label: string; price: number; hours: number; days: number; popular: boolean }

export function RechargeSection({ readOnly = false }: RechargeSectionProps) {
  const [modalPlan, setModalPlan] = useState<PlanEntry | null>(null)
  const { data: wallet } = useWallet()

  const availablePlans: PlanEntry[] = (Object.entries(PLANS) as [Plan, typeof PLANS[Plan]][]).map(
    ([id, plan]) => ({ id, ...plan, popular: id === "trimestral" }),
  )

  return (
    <>
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">Renovar / Comprar Plano</h2>
          <p className="text-xs text-zinc-400 mt-0.5">Renove seu plano para garantir vagas como Titular</p>
        </div>
        <div className="p-6">
          <div className="grid gap-4 sm:grid-cols-3">
            {availablePlans.map((pkg) => {
              const totalPlays = pkg.hours * PLAN_MULTIPLIERS[pkg.id]

              return (
                <div
                  key={pkg.id}
                  className={cn(
                    "relative rounded-xl border-2 p-5 transition-all",
                    pkg.popular ? "border-brand bg-brand-subtle/50" : "border-border",
                  )}
                >
                  {pkg.popular && (
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                      <span className="inline-flex items-center gap-1 bg-brand text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                        <Sparkles className="w-3 h-3" />
                        Popular
                      </span>
                    </div>
                  )}
                  <div className="text-center">
                    <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                      {pkg.label}
                    </p>
                    <div className="mt-2 flex flex-col items-center justify-center gap-1">
                      <div className="flex items-end gap-1">
                        <span
                          className={cn(
                            "text-3xl font-bold tabular-nums",
                            pkg.popular ? "text-chart-2" : "text-foreground",
                          )}
                        >
                          {totalPlays.toFixed(1)}
                        </span>
                        <span className="text-sm font-medium text-zinc-400 mb-0.5">Plays</span>
                      </div>
                    </div>
                    <p className={cn("text-lg font-bold mt-1", pkg.popular ? "text-chart-2" : "text-foreground")}>
                      {formatCurrency(pkg.price)}
                    </p>
                    <p className="text-[11px] text-zinc-400 mt-0.5">Validade {pkg.days} dias</p>
                  </div>

                  {!readOnly && (
                    <Button
                      onClick={() => setModalPlan(pkg)}
                      className={cn(
                        "w-full mt-4 h-9 text-xs font-semibold transition-all",
                        pkg.popular
                          ? "bg-brand hover:bg-brand-dark text-white"
                          : "bg-foreground hover:bg-foreground/90 text-background",
                      )}
                    >
                      Comprar
                    </Button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {modalPlan && (
        <PaymentModal
          open={!!modalPlan}
          onOpenChange={(open) => { if (!open) setModalPlan(null) }}
          plan={modalPlan}
          currentBalance={wallet?.balance ?? 0}
        />
      )}
    </>
  )
}
