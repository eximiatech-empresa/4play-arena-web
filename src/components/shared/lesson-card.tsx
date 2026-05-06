"use client"
import { useState } from "react"
import { MapPin, Users, Loader2, CheckCircle2, Lock, X, CalendarClock } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Lesson } from "@/core/entities/lesson"
import { LevelBadge } from "@/components/shared/level-badge"
import { Button } from "@/components/ui/button"
import { useCheckIn, useCancelCheckIn } from "@/features/booking/hooks/use-lessons"
import { toast } from "sonner"
import { CancelConfirmationModal } from "../../features/booking/components/cancel-confirmation-modal"
import { canCancelCheckIn } from "@/core/math/consumption"

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
  const cancelCheckIn = useCancelCheckIn()
  const [showCancelModal, setShowCancelModal] = useState(false)

  const isCancelled = lesson.status === "cancelled"
  const isRescheduled = lesson.wasRescheduled && !isCancelled
  const isBlocked = isCancelled || isRescheduled

  function handleCancelClick() {
    const isValidForRefund = canCancelCheckIn(new Date(lesson.dateTime))
    if (isValidForRefund) {
      executeCancel()
    } else {
      setShowCancelModal(true)
    }
  }

  function executeCancel() {
    cancelCheckIn.mutate(lesson, {
      onSuccess: (data) => {
        setShowCancelModal(false)
        if (data.refunded) {
          toast.success("Check-in cancelado! Os Play's foram reembolsados para sua carteira.")
        } else {
          toast.warning("Inscrição cancelada (sem reembolso devido ao prazo de 4h).")
        }
      },
      onError: (err: Error) => {
        toast.error("Erro ao cancelar: " + err.message)
      },
    })
  }

  const spotsLeft = lesson.totalSpots - lesson.enrolledCount
  const hasSpot = spotsLeft > 0 || lesson.isEnrolled
  const isLevelBlocked = (studentLevelIndex ?? 0) < lesson.levelIndex
  const hasBalance = (walletBalance ?? 0) >= lesson.previewConsumption
  const isDone = lesson.checkInStatus === "done"
  const isActionable =
    !isLevelBlocked &&
    hasBalance &&
    hasSpot &&
    (lesson.checkInStatus === "enrolled_only" || lesson.checkInStatus === "open")

  const dateObj = new Date(lesson.dateTime)
  const formattedDate = dateObj.toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "America/Sao_Paulo",
  })
  const formattedTime = dateObj.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  })

  const cardBorderColor = isCancelled
    ? "border-red-200 bg-red-50/50"
    : isRescheduled
      ? "border-amber-200 bg-amber-50/50"
      : isDone
        ? "border-brand/30 bg-brand-subtle"
        : "border-brand/50"

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

        {/* Status badge — only one shows at a time */}
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
          <div className="flex items-center gap-1.5 pt-1">
            <span
              className={cn(
                "text-sm font-bold tabular-nums",
                lesson.isOffPeak ? "text-brand" : "text-foreground",
              )}
            >
              -{lesson.previewConsumption.toFixed(2)}h
            </span>
            {lesson.isOffPeak && (
              <span className="text-[10px] font-semibold text-brand bg-brand-subtle px-1.5 py-0.5 rounded-full">
                Fora de Pico −5%
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
                Play's reembolsados
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
              disabled={cancelCheckIn.isPending}
              className="w-full h-7 text-[10px] text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
            >
              {cancelCheckIn.isPending && !showCancelModal ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                "Cancelar Inscrição"
              )}
            </Button>

            <CancelConfirmationModal
              open={showCancelModal}
              onOpenChange={setShowCancelModal}
              onConfirm={executeCancel}
              isPending={cancelCheckIn.isPending}
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
