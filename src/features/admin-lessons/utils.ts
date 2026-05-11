/**
 * Builds a 7-column calendar grid for the given year/month.
 * Returns an array of day numbers (1-based) interspersed with `null` padding
 * cells so that the first day falls on the correct weekday column and the
 * total length is always a multiple of 7.
 */
export function buildCalendarGrid(year: number, month: number): (number | null)[] {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = Array(firstDay).fill(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

/**
 * Converts a year/month/day triple into the `datetime-local` input format
 * with a default time of 08:00, ready to pre-fill the create-lesson form.
 */
export function toDatetimeInput(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}T08:00`
}
