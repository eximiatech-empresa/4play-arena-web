"use client"

import { MapPin, Users, Loader2, CheckCircle2, Lock, X, CalendarClock } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatLessonDateTime } from "@/lib/utils/date"
import type { Lesson } from "@/core/entities/lesson"
import { LevelBadge } from "@/components/shared/level-badge"
import { Button } from "@/components/ui/button"
import { useCheckIn } from "@/features/student/aulas/hooks/use-lessons"
import { useLessonCardState } from "@/features/student/aulas/hooks/use-lesson-card-state"
import { useLessonCancelFlow } from "@/features/student/aulas/hooks/use-lesson-cancel-flow"
import { CancelConfirmationModal } from "@/features/student/aulas/components/cancel-confirmation-modal"

interface LessonCardProps {
  lesson: Lesson
  studentLevelIndex?: number
  walletBalance?: number
  onClick?: (lesson: Lesson) => void
  isTeacherView?: boolean
}

const CHECK_IN_LABELS: Record<string, string> = {
  not_open: "Abre em breve",
  enrolled_only: "Fazer Check-in",
  open: "Fazer Check-in",
  closed: "Encerrada",
  done: "Check-in feito",
}

export function LessonCard({
  lesson,
  studentLevelIndex,
  walletBalance,
  onClick,
  isTeacherView = false,
}: LessonCardProps) {
  const checkIn = useCheckIn()
  const {
    isCancelled, isRescheduled, isBlocked, isDone,
    spotsLeft, isLevelBlocked, hasBalance, isActionable,
    cardBorderColor,
  } = useLessonCardState(lesson, studentLevelIndex, walletBalance)
  const {
    handleCancelClick, executeCancel,
    showCancelModal, setShowCancelModal, isPending: isCancelPending,
  } = useLessonCancelFlow(lesson)

  const { date: formattedDate, time: formattedTime } = formatLessonDateTime(lesson.dateTime)

  return (
    <div
      onClick={() => !isBlocked && onClick?.(lesson)}
      className={cn(
        "bg-card border rounded-2xl shadow-sm overflow-hidden flex flex-col",
        !isBlocked && onClick && "cursor-pointer hover:shadow-md transition-shadow",
        isBlocked && "opacity-75",
        cardBorderColor,
      )}
    >
      {/* Header */}
      <div className="px-4 pt-4 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div
            className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
              isCancelled ? "bg-red-400" : isRescheduled ? "bg-amber-400" : "bg-chart-3",
            )}
          >
            <span className="text-xs font-bold text-white">
              {lesson.professorName.charAt(0)}
            </span>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{lesson.professorName}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <LevelBadge level={lesson.level} size="xs" />
            </div>
          </div>
        </div>

        {isCancelled ? (
          <span className="shrink-0 text-[9px] font-bold uppercase tracking-wide bg-red-500 rounded-full px-2 py-0.5 text-white">
            Cancelada
          </span>
        ) : isRescheduled ? (
          <span className="shrink-0 text-[9px] font-bold uppercase tracking-wide bg-amber-500 rounded-full px-2 py-0.5 text-white">
            Reagendada
          </span>
        ) : lesson.checkInStatus === "open" && !isDone ? (
          <span className="shrink-0 text-[9px] font-bold uppercase tracking-wide bg-brand rounded-full px-2 py-0.5 text-white">
            Mar Aberto
          </span>
        ) : isDone ? (
          <CheckCircle2 className="w-4 h-4 text-brand shrink-0 mt-0.5" />
        ) : null}
      </div>

      {/* Details */}
      <div className="px-4 py-3 flex-1 space-y-1.5">
        <div className="flex items-center gap-1.5 text-xs">
          <span className="font-medium text-foreground/60">
            {formattedDate} · {formattedTime}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-foreground/90">
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3 text-brand" />
            {lesson.court}
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3 text-brand" />
            {spotsLeft > 0
              ? `${spotsLeft} vaga${spotsLeft > 1 ? "s restantes" : " restante"}`
              : "Lotada"}
          </span>
        </div>

        {!isCancelled && (
          <div className="flex items-center gap-1.5 pt-1 flex-wrap">
            <span
              className={cn(
                "text-sm font-bold tabular-nums",
                lesson.isPeak ? "text-amber-500" : "text-brand",
              )}
            >
              -{lesson.previewConsumption}P
            </span>
            {!lesson.isPeak && (
              <span className="text-[10px] font-semibold text-brand bg-brand-subtle px-1.5 py-0.5 rounded-full">
                Fora de Pico
              </span>
            )}
            {lesson.isPeak && (
              <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">
                Pico +5%
              </span>
            )}
            {lesson.isReserva && (
              <span className="text-[10px] font-semibold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-full">
                Avulso +10%
              </span>
            )}
          </div>
        )}
      </div>

      {/* Action area */}
      <div className="px-4 pb-4" onClick={(e) => e.stopPropagation()}>
        {isTeacherView ? (
          isCancelled ? (
            <div className="flex items-center justify-center gap-1.5 text-xs text-red-400 font-semibold py-1.5">
              <X className="w-3.5 h-3.5" />
              Aula cancelada
            </div>
          ) : isRescheduled ? (
            <div className="flex items-center justify-center gap-1.5 text-xs text-amber-600 font-semibold py-1.5">
              <CalendarClock className="w-3.5 h-3.5" />
              Aula reagendada
            </div>
          ) : (
            <Button
              onClick={() => onClick && onClick(lesson)}
              className="w-full h-8 text-xs font-semibold bg-chart-3 hover:bg-chart-4 text-white transition-colors"
            >
              Gerenciar Aula
            </Button>
          )
        ) : isBlocked ? (
          isDone ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-1.5 justify-center text-xs text-green-800 font-semibold py-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Play&apos;s reembolsados
              </div>
              <div className="text-[10px] text-center text-red-500 font-medium">
                Inscrição cancelada
              </div>
            </div>
          ) : (
            <Button disabled className="w-full h-8 text-xs font-semibold bg-zinc-100 text-zinc-400 cursor-not-allowed opacity-100">
              {isCancelled ? "Aula cancelada" : "Aula adiada"}
            </Button>
          )
        ) : isLevelBlocked ? (
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 justify-center py-1.5">
            <Lock className="w-3 h-3" />
            Nível insuficiente
          </div>
        ) : !hasBalance && !isDone ? (
          <div className="text-xs text-red-400 text-center py-1.5 font-medium">
            Saldo insuficiente
          </div>
        ) : isDone ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1.5 justify-center text-xs text-brand font-semibold py-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Check-in confirmado
            </div>
            <Button
              variant="outline"
              onClick={handleCancelClick}
              disabled={isCancelPending}
              className="w-full h-7 text-[10px] text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
            >
              {isCancelPending && !showCancelModal ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                "Cancelar Inscrição"
              )}
            </Button>

            <CancelConfirmationModal
              open={showCancelModal}
              onOpenChange={setShowCancelModal}
              onConfirm={executeCancel}
              isPending={isCancelPending}
            />
          </div>
        ) : (
          <Button
            onClick={() => checkIn.mutate(lesson)}
            disabled={!isActionable || checkIn.isPending}
            className={cn(
              "w-full h-8 text-xs font-semibold transition-colors",
              isActionable
                ? "bg-chart-3 hover:bg-chart-4 text-white"
                : "bg-zinc-100 text-zinc-400 cursor-not-allowed",
            )}
          >
            {checkIn.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              CHECK_IN_LABELS[lesson.checkInStatus]
            )}
          </Button>
        )}
      </div>
    </div>
  )
}
