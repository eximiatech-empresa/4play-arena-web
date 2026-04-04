// src/features/wallet/components/recharge-section.tsx
"use client"

import { useState } from "react"
import { Check, Loader2, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useAddCredits, useWallet } from "@/features/wallet/hooks/use-wallet"
import { RECHARGE_PACKAGES } from "@/features/wallet/constants/recharge-packages"
import { formatCurrency } from "@/utils/formatters"

export function RechargeSection() {
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null)
  const [purchasedId, setPurchasedId] = useState<string | null>(null)
  const addCredits = useAddCredits()
  const { data: wallet } = useWallet()

  function handlePurchase(packageId: string, hours: number) {
    if (!wallet) return
    setSelectedPackage(packageId)
    addCredits.mutate({ hours, currentBalance: wallet.balance }, {
      onSuccess: () => {
        setPurchasedId(packageId)
        setTimeout(() => {
          setPurchasedId(null)
          setSelectedPackage(null)
        }, 2000)
      },
      onError: () => {
        setSelectedPackage(null)
      },
    })
  }

  return (
    <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-zinc-100">
        <h2 className="text-base font-semibold text-zinc-800">
          Recarregar Horas
        </h2>
        <p className="text-xs text-zinc-400 mt-0.5">
          Escolha um pacote para adicionar horas a sua carteira
        </p>
      </div>

      <div className="p-6">
        <div className="grid gap-4 sm:grid-cols-3">
          {RECHARGE_PACKAGES.map((pkg) => {
            const isLoading =
              addCredits.isPending && selectedPackage === pkg.id
            const isPurchased = purchasedId === pkg.id
            const pricePerHour = pkg.price / pkg.hours

            return (
              <div
                key={pkg.id}
                className={cn(
                  "relative rounded-xl border-2 p-5 transition-all",
                  pkg.popular
                    ? "border-brand bg-brand-subtle/50"
                    : "border-zinc-100 hover:border-zinc-200",
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
                  <div className="mt-2 flex items-end justify-center gap-1">
                    <span className="text-3xl font-bold text-zinc-900 tabular-nums">
                      {pkg.hours}
                    </span>
                    <span className="text-sm font-medium text-zinc-400 mb-0.5">
                      horas
                    </span>
                  </div>
                  <p className="text-lg font-bold text-zinc-800 mt-1">
                    {formatCurrency(pkg.price)}
                  </p>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    {formatCurrency(pricePerHour)}/hora
                  </p>
                </div>

                <Button
                  onClick={() => handlePurchase(pkg.id, pkg.hours)}
                  disabled={addCredits.isPending || isPurchased}
                  className={cn(
                    "w-full mt-4 h-9 text-xs font-semibold transition-all",
                    isPurchased
                      ? "bg-brand text-white"
                      : pkg.popular
                        ? "bg-brand hover:bg-brand-dark text-white"
                        : "bg-zinc-900 hover:bg-zinc-800 text-white"
                  )}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isPurchased ? (
                    <>
                      <Check className="w-4 h-4" />
                      Adicionado
                    </>
                  ) : (
                    "Comprar"
                  )}
                </Button>
              </div>
            )
          })}
        </div>

        <p className="text-[11px] text-zinc-400 text-center mt-4">
          Pagamento processado de forma segura. Horas adicionadas instantaneamente.
        </p>
      </div>
    </div>
  )
}
