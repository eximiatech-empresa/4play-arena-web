import type { LessonStatus } from "@/core/entities/lesson"

export const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"] as const

export const MONTHS_PT = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
] as const

export const STATUS_OPTIONS: { value: LessonStatus; label: string }[] = [
  { value: "scheduled", label: "Agendada" },
  { value: "finished",  label: "Concluída" },
  { value: "cancelled", label: "Cancelada" },
]

export const LESSON_CHIP_CLASS: Record<string, string> = {
  scheduled: "bg-brand/10 text-brand-dark dark:bg-brand/20 dark:text-brand border-brand/20",
  finished:  "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700",
  cancelled: "bg-red-50 text-red-400 dark:bg-red-900/20 dark:text-red-400 border-red-100 dark:border-red-900/40",
}

export const LESSON_STATUS_PILL: Record<string, string> = {
  scheduled: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  finished:  "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
  cancelled: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
}

export const LESSON_STATUS_LABEL: Record<string, string> = {
  scheduled: "Agendada",
  finished:  "Concluída",
  cancelled: "Cancelada",
}
