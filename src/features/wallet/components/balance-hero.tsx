// src/features/wallet/components/balance-hero.tsx
import { cn } from "@/lib/utils"

interface BalanceHeroProps {
  balance: number
  totalHours: number
}

function getBalanceLevel(balance: number, total: number) {
  if (total === 0) return { label: "Indefinido", color: "text-zinc-400", bg: "bg-zinc-400", ring: "ring-zinc-100" }
  const ratio = balance / total
  if (ratio <= 0.2) return { label: "Baixo", color: "text-red-500", bg: "bg-red-500", ring: "ring-red-100" }
  if (ratio <= 0.5) return { label: "Moderado", color: "text-amber-500", bg: "bg-amber-500", ring: "ring-amber-100" }
  return { label: "Confortável", color: "text-brand", bg: "bg-brand", ring: "ring-brand-subtle" }
}

export function BalanceHero({ balance, totalHours }: BalanceHeroProps) {
  const level = getBalanceLevel(balance, totalHours)
  const progressPct = totalHours > 0 ? Math.round((balance / totalHours) * 100) : 0

  return (
    <div className="relative overflow-hidden rounded-2xl bg-brand-dark p-6 sm:p-8">
      {/* Background decorative elements */}
      <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-40 h-40 rounded-full bg-white/5 translate-y-1/2 -translate-x-1/4" />

      <div className="relative z-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-white/50">
          Saldo disponivel
        </p>

        <div className="mt-2 flex items-end gap-2">
          <span className="text-5xl sm:text-6xl font-bold text-white leading-none tabular-nums">
            {balance.toFixed(1).replace(".", ",")}
          </span>
          <span className="text-xl font-medium text-white/60 mb-1.5">horas</span>
        </div>

        {/* Balance level indicator */}
        <div className="mt-3 flex items-center gap-2">
          <span className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
            "bg-white/10 text-white/90"
          )}>
            <span className={cn("w-1.5 h-1.5 rounded-full", level.bg)} />
            {level.label}
          </span>
          <span className="text-xs text-white/40">
            {progressPct}% do plano
          </span>
        </div>

        {/* Progress bar */}
        <div className="mt-5">
          <div className="flex items-center justify-between mb-1.5 text-[10px] text-white/40 font-medium">
            <span>0h</span>
            <span>{totalHours}h contratadas</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-white/80 rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
