// src/features/wallet/components/metric-cards.tsx
import { Clock, CalendarCheck, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"
import type { WalletMetrics } from "@/features/wallet/utils/wallet-metrics"

interface MetricCardsProps {
  metrics: WalletMetrics
  totalPlays: number
}

export function MetricCards({ metrics, totalPlays }: MetricCardsProps) {
  const cards = [
    {
      label: "Consumido no mês",
      value: `${metrics.playsUsedThisMonth.toFixed(2)}`,
      sub: `${metrics.lessonsThisMonth} aula${metrics.lessonsThisMonth !== 1 ? "s" : ""}`,
      icon: <Clock className="w-4 h-4" />,
      iconColor: "text-brand",
    },
    {
      label: "Total utilizado",
      value: `${metrics.usedPlays.toFixed(2)}`,
      sub: `de ${totalPlays.toFixed(1)} Plays`,
      icon: <TrendingDown className="w-4 h-4" />,
      iconColor: "text-zinc-400",
    },
    {
      label: "Aulas assistidas",
      value: `${metrics.totalLessonsAttended}`,
      sub: "desde o início",
      icon: <CalendarCheck className="w-4 h-4" />,
      iconColor: "text-zinc-400",
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-card rounded-xl border border-border shadow-sm p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-muted-foreground">{card.label}</p>
            <div className={cn(card.iconColor)}>{card.icon}</div>
          </div>
          <p className="text-xl font-bold text-foreground tabular-nums flex items-baseline gap-1">
            {card.value} <span className="text-sm text-zinc-400 font-normal">Plays</span>
          </p>
          <p className="text-xs text-zinc-400 mt-0.5">{card.sub}</p>
        </div>
      ))}
    </div>
  )
}