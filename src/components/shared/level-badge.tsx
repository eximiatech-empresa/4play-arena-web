import { cn } from "@/lib/utils"
import type { StudentLevel } from "@/core/constants/professors"

interface LevelBadgeProps {
  level: StudentLevel | string
  size?: "xs" | "sm" | "md"
  className?: string
}

const LEVEL_COLORS: Record<string, string> = {
  Principiante: "bg-zinc-100 text-zinc-600 border-zinc-200",
  Iniciante: "bg-blue-50 text-blue-700 border-blue-200",
  "Nível D": "bg-teal-50 text-teal-700 border-teal-200",
  "Nível C": "bg-brand-subtle text-brand-dark border-brand/20",
  "Nível B": "bg-brand-subtle text-brand-dark border-brand/30",
  "Nível A": "bg-amber-50 text-amber-700 border-amber-200",
  Profissional: "bg-violet-50 text-violet-700 border-violet-200",
  Professor: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-700/30",
  Admin: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-700/30",
}

const SIZE_CLASSES = {
  xs: "text-[10px] px-1.5 py-0.5 font-semibold tracking-wide",
  sm: "text-[11px] px-2 py-0.5 font-semibold tracking-wide",
  md: "text-xs px-2.5 py-1 font-semibold tracking-wide",
}

export function LevelBadge({ level, size = "sm", className }: LevelBadgeProps) {
  // 1. Interceptamos o valor. Se for só A, B, C ou D, adicionamos o "Nível "
  const displayLevel = ["A", "B", "C", "D"].includes(level) 
    ? `Nível ${level}` 
    : level

  // 2. Agora ele busca a cor usando o nome formatado corretamente
  const colors = LEVEL_COLORS[displayLevel] ?? "bg-zinc-100 text-zinc-600 border-zinc-200"

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border uppercase whitespace-nowrap",
        colors,
        SIZE_CLASSES[size],
        className
      )}
    >
      {displayLevel}
    </span>
  )
}