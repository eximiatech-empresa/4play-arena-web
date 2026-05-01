// src/features/wallet/components/recharge-section.tsx
"use client"
import { useState } from "react"
import { Check, Loader2, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { usePurchasePlan, useWallet } from "@/features/wallet/hooks/use-wallet"
import { PLANS } from "@/core/constants/professors"
import { PLAN_MULTIPLIERS } from "@/core/math/consumption"
import { formatCurrency } from "@/utils/formatters"
import type { Plan } from "@/core/entities/wallet"

interface RechargeSectionProps {
  readOnly?: boolean
}

export function RechargeSection({ readOnly = false }: RechargeSectionProps) {
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [purchasedId, setPurchasedId] = useState<Plan | null>(null)
  const purchasePlan = usePurchasePlan()
  const { data: wallet } = useWallet()

  function handlePurchase(planId: Plan, baseHours: number, days: number) {
    if (!wallet) return
    setSelectedPlan(planId)
    
    // Converte a base de horas em Plays usando o multiplicador exato do plano
    const playsAmount = baseHours * PLAN_MULTIPLIERS[planId]

    purchasePlan.mutate({ 
      planId, 
      playsAmount, 
      expiresInDays: days,
      currentBalance: wallet.balance 
    }, {
      onSuccess: () => {
        setPurchasedId(planId)
        setTimeout(() => {
          setPurchasedId(null)
          setSelectedPlan(null)
        }, 2000)
      },
      onError: () => setSelectedPlan(null),
    })
  }

  // Converte objeto de planos para Array e marca o trimestral como popular
  const availablePlans = (Object.entries(PLANS) as [Plan, typeof PLANS[Plan]][]).map(([id, plan]) => ({
    id,
    ...plan,
    popular: id === "trimestral"
  }))

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-border">
        <h2 className="text-base font-semibold text-foreground">Renovar / Comprar Plano</h2>
        <p className="text-xs text-zinc-400 mt-0.5">Renove seu plano para garantir vagas como Titular</p>
      </div>
      <div className="p-6">
        <div className="grid gap-4 sm:grid-cols-3">
          {availablePlans.map((pkg) => {
            const isLoading = purchasePlan.isPending && selectedPlan === pkg.id
            const isPurchased = purchasedId === pkg.id
            const totalPlays = pkg.hours * PLAN_MULTIPLIERS[pkg.id]

            return (
              <div
                key={pkg.id}
                className={cn(
                  "relative rounded-xl border-2 p-5 transition-all",
                  pkg.popular ? "border-brand bg-brand-subtle/50" : "border-border",
                  isPurchased && "border-brand bg-brand-subtle"
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
                      
                      <span className={`text-3xl font-bold tabular-nums
                        ${pkg.popular ? 'text-chart-2' : 'text-foreground'}`}>
                        {totalPlays.toFixed(1)}
                      </span>
                      <span className="text-sm font-medium text-zinc-400 mb-0.5">Plays</span>
                    </div>
                  </div>
                  <p className={`text-lg font-bold mt-1
                    ${pkg.popular ? 'text-chart-2' : 'text-foreground'}`}>
                    {formatCurrency(pkg.price)}
                  </p>
                  <p className="text-[11px] text-zinc-400 mt-0.5">Validade {pkg.days} dias</p>
                </div>

                {!readOnly && (
                  <Button
                    onClick={() => handlePurchase(pkg.id, pkg.hours, pkg.days)}
                    disabled={purchasePlan.isPending || isPurchased}
                    className={cn(
                      "w-full mt-4 h-9 text-xs font-semibold transition-all",
                      isPurchased
                        ? "bg-brand text-white"
                        : pkg.popular
                          ? "bg-brand hover:bg-brand-dark text-white"
                          : "bg-foreground hover:bg-foreground/90 text-background",
                    )}
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isPurchased ? (
                      <>
                        <Check className="w-4 h-4" />
                        Renovado
                      </>
                    ) : (
                      "Comprar"
                    )}
                  </Button>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}