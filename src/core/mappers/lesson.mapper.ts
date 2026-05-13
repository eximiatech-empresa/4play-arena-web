// src/core/mappers/lesson.mapper.ts

import { LessonDocumentSchema } from "@/core/entities/lesson"
import { calculatePlaysConsumed, isPeakHour, getCheckInStatus } from "@/core/math/consumption"
import type { Lesson } from "@/core/entities/lesson"
import type { Plan } from "@/core/entities/wallet"

/**
 * Transforms a raw Firestore document (id + data object) into a Lesson view model.
 * Pure function — no Firebase imports; accepts raw data so it can be tested without
 * a Firebase instance.
 *
 * Accepts two call signatures for backward-compat:
 * - New:  mapRawDocToLesson(id, data, studentId, now, plan?)
 * - Legacy: mapRawDocToLesson(id, data, studentId, plan, now)
 *
 * `plan` is optional in both signatures: when omitted, `previewConsumption` defaults to 0.
 *
 * Returns null if the raw document fails schema validation.
 */
// New preferred signature
export function mapRawDocToLesson(
  id: string,
  data: Record<string, unknown>,
  studentId: string,
  now: Date,
  plan?: Plan,
): Lesson | null
// Legacy signature — plan in 4th position (used by lib/firebase/booking.ts)
export function mapRawDocToLesson(
  id: string,
  data: Record<string, unknown>,
  studentId: string,
  plan: Plan | undefined,
  now: Date,
): Lesson | null
export function mapRawDocToLesson(
  id: string,
  data: Record<string, unknown>,
  studentId: string,
  arg4: Date | Plan | undefined,
  arg5?: Date | Plan,
): Lesson | null {
  const parsed = LessonDocumentSchema.safeParse({ id, ...data })
  if (!parsed.success) return null

  const doc = parsed.data
  const lessonDate = new Date(doc.dateTime)

  const isLegacyCall = typeof arg4 === "string"
  const resolvedNow = isLegacyCall ? (arg5 as Date) : (arg4 as Date)
  const resolvedPlan = isLegacyCall ? (arg4 as Plan) : (arg5 as Plan | undefined)

  // Determina se a aula é num horário de pico
  const isPeak = isPeakHour(lessonDate)
  const isReserva = !doc.titularIds.includes(studentId)

  let previewConsumption = 0
  if (resolvedPlan !== undefined) {
    // Agora lemos os valores diretamente do documento da aula (Desnormalização)
    // Sem try/catch silencioso e sem pesquisar por IDs de professores!
    if (doc.professorBasePlays !== undefined && doc.professorRoundingRule !== undefined) {
      previewConsumption = calculatePlaysConsumed({
        basePlays: doc.professorBasePlays,
        roundingRule: doc.professorRoundingRule,
        isPeak,
        isReserva,
      })
    } else {
      // Aviso de segurança caso o Admin crie uma aula sem as regras de consumo
      console.warn(`[Aviso] Aula ${doc.id} não possui os campos financeiros do professor (professorBasePlays).`)
      previewConsumption = 0
    }
  }

  const isEnrolled = doc.enrolledStudentIds.includes(studentId)
  const isTitularOrReserva = doc.titularIds.includes(studentId) || doc.reservaIds.includes(studentId)
  
  const checkInStatus = isEnrolled
    ? ("done" as const)
    : getCheckInStatus(lessonDate, isTitularOrReserva, resolvedNow)

  return {
    id: doc.id,
    professorId: doc.professorId,
    professorName: doc.professorName,
    level: doc.level,
    levelIndex: doc.levelIndex,
    dateTime: doc.dateTime,
    court: doc.court,
    totalSpots: doc.totalSpots,
    enrolledCount: doc.enrolledStudentIds.length,
    isEnrolled,
    checkInStatus,
    previewConsumption,
    isPeak,
    isReserva,
    /** @deprecated backward-compat alias for isPeak — use isPeak in new code */
    isOffPeak: !isPeak,
    status: doc.status,
    wasRescheduled: doc.wasRescheduled ?? false,
    description: doc.description,
    titularIds: doc.titularIds,
    reservaIds: doc.reservaIds,
    enrolledStudentIds: doc.enrolledStudentIds,
    checkedInStudentIds: doc.checkedInStudentIds,
    absentStudentIds: doc.absentStudentIds,
    
    // Novos campos financeiros desnormalizados exportados para a Entidade Lesson:
    professorBasePlays: doc.professorBasePlays,
    professorRoundingRule: doc.professorRoundingRule,
    professorSharePct: doc.professorSharePct,
    arenaSharePct: doc.arenaSharePct,
  }
}