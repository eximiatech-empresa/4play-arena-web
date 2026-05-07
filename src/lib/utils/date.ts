/** Returns today's date string in BRT (UTC-3) as "YYYY-MM-DD". */
export function getTodayBRT(): string {
  const brtDate = new Date(new Date().getTime() - 3 * 60 * 60 * 1000)
  const y = brtDate.getUTCFullYear()
  const m = String(brtDate.getUTCMonth() + 1).padStart(2, "0")
  const d = String(brtDate.getUTCDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

/** Adds `days` to a "YYYY-MM-DD" string and returns the resulting date string. */
export function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number)
  const date = new Date(Date.UTC(y, m - 1, d + days))
  const yr = date.getUTCFullYear()
  const mo = String(date.getUTCMonth() + 1).padStart(2, "0")
  const dy = String(date.getUTCDate()).padStart(2, "0")
  return `${yr}-${mo}-${dy}`
}

/** Formats an ISO datetime string into separate BRT date and time strings. */
export function formatLessonDateTime(isoString: string): { date: string; time: string } {
  const dateObj = new Date(isoString)
  return {
    date: dateObj.toLocaleDateString("pt-BR", {
      weekday: "short",
      day: "numeric",
      month: "short",
      timeZone: "America/Sao_Paulo",
    }),
    time: dateObj.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Sao_Paulo",
    }),
  }
}
