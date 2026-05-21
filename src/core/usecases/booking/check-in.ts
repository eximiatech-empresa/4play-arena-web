// src/core/usecases/booking/check-in.ts

import { getCheckInStatus } from "@/core/math/consumption"
import { CheckInNotOpenError, LessonClosedError, NotAuthenticatedError } from "@/core/errors/exceptions"
import { ERROS } from "@/core/errors/erros"
import type { Lesson } from "@/core/entities/lesson"

type CheckInFn = (
  userId: string,
  lessonId: string,
  consumption: number,
  professorId: string,
  professorName: string,
  level: string,
  isPeak: boolean,
  isReserva: boolean,
) => Promise<void>

export async function executeCheckIn(
  userId: string | null,
  lesson: Lesson,
  checkInFn: CheckInFn,
): Promise<void> {
  if (!userId) throw new NotAuthenticatedError(ERROS.NAO_AUTENTICADO)

  const status = getCheckInStatus(new Date(lesson.dateTime), lesson.isEnrolled, new Date())
  if (status === "not_open") throw new CheckInNotOpenError(ERROS.CHECK_IN_NAO_LIBERADO)
  if (status === "closed") throw new LessonClosedError(ERROS.AULA_ENCERRADA)

  const isReserva = !lesson.titularIds.includes(userId)

  await checkInFn(
    userId,
    lesson.id,
    lesson.previewConsumption,
    lesson.professorId,
    lesson.professorName,
    lesson.level,
    lesson.isPeak,
    isReserva,
  )
}
