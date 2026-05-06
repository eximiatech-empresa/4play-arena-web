// src/core/math/booking-rules.ts
import { MS_PER_HOUR } from "@/core/constants/booking-rules"

export type BookingPhase = "TITULARES" | "RESERVAS" | "OPEN" | "CLOSED"

export function getBookingPhase(lessonDate: Date, now: Date): BookingPhase {
  const hoursToClass = (lessonDate.getTime() - now.getTime()) / MS_PER_HOUR

  if (hoursToClass <= 0) return "CLOSED"
  if (hoursToClass < 4) return "OPEN"
  if (hoursToClass <= 8) return "RESERVAS"
  return "TITULARES"
}

export function getBookingPhaseLabel(phase: BookingPhase, isEnrolled: boolean): string {
  switch (phase) {
    case "TITULARES":
      return isEnrolled ? "Fazer Reserva" : "Exclusivo Titulares"
    case "RESERVAS":
      return "Reservar Vaga"
    case "OPEN":
      return "Entrar na Aula"
    case "CLOSED":
      return "Encerrada"
  }
}

export function getLessonAvailabilityStatus(
  enrolledCount: number,
  totalSpots: number,
): "available" | "limited" | "full" {
  if (enrolledCount >= totalSpots) return "full"
  if (totalSpots - enrolledCount <= 2) return "limited"
  return "available"
}
