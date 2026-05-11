import { RecurrenceInputError } from "@/core/errors/exceptions"
import { ERROS } from "@/core/errors/erros"
import type { CreateLessonInput } from "@/core/entities/lesson"

/**
 * Builds the list of ISO datetime strings for a lesson creation request.
 *
 * - "avulsa": returns a single-element array with the provided dateTime.
 * - "recorrente": generates weekly occurrences from dateTime up to repeatUntil
 *   (inclusive), capped at 400 weeks.
 *
 * Throws RecurrenceInputError if repeatUntil is not after dateTime.
 */
export function buildDateList(input: CreateLessonInput): string[] {
  if (input.type === "avulsa") return [input.dateTime]

  const start = new Date(input.dateTime)
  const limit = input.repeatUntil ? new Date(input.repeatUntil) : start

  if (input.repeatUntil && limit <= start) {
    throw new RecurrenceInputError(ERROS.RECORRENCIA_INVALIDA)
  }

  const dates: string[] = []
  const maxWeeks = 400
  let current = new Date(start)
  let count = 0

  while (current <= limit && count < maxWeeks) {
    dates.push(current.toISOString())
    current = new Date(current.getTime() + 7 * 24 * 60 * 60 * 1000)
    count++
  }

  return dates
}
