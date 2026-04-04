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
}

const SIZE_CLASSES = {
  xs: "text-[10px] px-1.5 py-0.5 font-semibold tracking-wide",
  sm: "text-[11px] px-2 py-0.5 font-semibold tracking-wide",
  md: "text-xs px-2.5 py-1 font-semibold tracking-wide",
}

export function LevelBadge({ level, size = "sm", className }: LevelBadgeProps) {
  const colors = LEVEL_COLORS[level] ?? "bg-zinc-100 text-zinc-600 border-zinc-200"

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border uppercase",
        colors,
        SIZE_CLASSES[size],
        className
      )}
    >
      {level}
    </span>
  )
}
