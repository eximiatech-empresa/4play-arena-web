import { canCancelCheckIn } from "@/core/math/consumption"
import { NotAuthenticatedError } from "@/core/errors/exceptions"
import { ERROS } from "@/core/errors/erros"
import type { Lesson } from "@/core/entities/lesson"

type CheckOutFn = (
  userId: string,
  lessonId: string,
  refundAmount: number,
  professorName: string,
) => Promise<void>

export function calculateRefundAmount(lesson: Lesson): number {
  return canCancelCheckIn(new Date(lesson.dateTime)) ? lesson.previewConsumption : 0
}

export async function executeCheckOut(
  userId: string | null,
  lesson: Lesson,
  checkOutFn: CheckOutFn,
): Promise<{ refunded: boolean }> {
  if (!userId) throw new NotAuthenticatedError(ERROS.NAO_AUTENTICADO)

  const refundAmount = calculateRefundAmount(lesson)
  await checkOutFn(userId, lesson.id, refundAmount, lesson.professorName)
  return { refunded: refundAmount > 0 }
}
