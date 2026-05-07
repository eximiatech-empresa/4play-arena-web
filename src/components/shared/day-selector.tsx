"use client"

import { cn } from "@/lib/utils"
import { addDays } from "@/lib/utils/date"

const DAY_ABBR = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]

interface DaySelectorProps {
  today: string
  selected: string
  showAll: boolean
  onSelect: (date: string) => void
  onShowAll: () => void
}

export function DaySelector({ today, selected, showAll, onSelect, onShowAll }: DaySelectorProps) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i))

  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1 mb-5">
      <button
        onClick={onShowAll}
        className={cn(
          "flex flex-col items-center justify-center shrink-0 w-16 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer",
          showAll ? "bg-brand text-white" : "bg-muted text-muted-foreground hover:bg-muted/80",
        )}
      >
        <span className="text-[10px] font-semibold uppercase tracking-wide leading-none mb-1">Todas</span>
        <span className="text-base font-bold leading-none">∞</span>
      </button>

      {days.map((dateStr) => {
        const [y, m, d] = dateStr.split("-").map(Number)
        const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay()
        const isToday = dateStr === today
        const isActive = !showAll && dateStr === selected

        return (
          <button
            key={dateStr}
            onClick={() => onSelect(dateStr)}
            className={cn(
              "flex flex-col items-center justify-center shrink-0 w-14 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer",
              isActive ? "bg-brand text-white" : "bg-muted text-muted-foreground hover:bg-brand/40",
            )}
          >
            <span className="text-[10px] font-semibold uppercase tracking-wide leading-none mb-1">
              {isToday ? "Hoje" : DAY_ABBR[dow]}
            </span>
            <span className="text-base font-bold leading-none">{d}</span>
          </button>
        )
      })}
    </div>
  )
}
