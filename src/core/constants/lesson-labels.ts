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

export const LESSON_STATUS_LABEL: Record<string, string> = {
  scheduled: "Agendada",
  finished:  "Concluída",
  cancelled: "Cancelada",
}
