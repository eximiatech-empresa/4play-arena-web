"use client"

import { MapPin, Users, Loader2, CheckCircle2, Lock } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Lesson } from "@/core/entities/lesson"
import { LevelBadge } from "@/components/shared/level-badge"
import { Button } from "@/components/ui/button"
import { useCheckIn } from "@/features/booking/hooks/use-lessons"

interface LessonCardProps {
  lesson: Lesson
  studentLevelIndex: number
  walletBalance: number
  onClick?: () => void
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
}: LessonCardProps) {
  const checkIn = useCheckIn()

  const spotsLeft = lesson.totalSpots - lesson.enrolledCount
  const hasSpot = spotsLeft > 0 || lesson.isEnrolled
  const isLevelBlocked = studentLevelIndex < lesson.levelIndex
  const hasBalance = walletBalance >= lesson.previewConsumption
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

  const statusColor = isDone
    ? "border-brand/30 bg-brand-subtle"
    : lesson.checkInStatus === "open"
    ? "border-brand/20"
    : "border-zinc-100"

  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-white rounded-2xl border shadow-sm overflow-hidden flex flex-col",
        onClick && "cursor-pointer hover:shadow-md transition-shadow",
        statusColor
      )}
    >
      {/* Header */}
      <div className="px-4 pt-4 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-brand-dark flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-white">
              {lesson.professorName.charAt(0)}
            </span>
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-800">
              {lesson.professorName}
            </p>
            <div className="flex items-center gap-1 mt-0.5">
              <LevelBadge level={lesson.level} size="xs" />
            </div>
          </div>
        </div>

        {lesson.checkInStatus === "open" && !isDone && (
          <span className="shrink-0 text-[9px] font-bold uppercase tracking-wide bg-brand text-white rounded-full px-2 py-0.5">
            Mar Aberto
          </span>
        )}
        {isDone && (
          <CheckCircle2 className="w-4 h-4 text-brand shrink-0 mt-0.5" />
        )}
      </div>

      {/* Details */}
      <div className="px-4 py-3 flex-1 space-y-1.5">
        <div className="flex items-center gap-1.5 text-xs text-zinc-500">
          <span className="font-medium text-zinc-700">
            {formattedDate} · {formattedTime}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-zinc-400">
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {lesson.court}
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {spotsLeft > 0 ? `${spotsLeft} vaga${spotsLeft > 1 ? "s" : ""}` : "Lotada"}
          </span>
        </div>

        <div className="flex items-center gap-1.5 pt-1">
          <span
            className={cn(
              "text-sm font-bold tabular-nums",
              lesson.isOffPeak ? "text-brand" : "text-zinc-700"
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
      </div>

      {/* Action area */}
      <div className="px-4 pb-4" onClick={(e) => e.stopPropagation()}>
        {isLevelBlocked ? (
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 justify-center py-1.5">
            <Lock className="w-3 h-3" />
            Nível insuficiente
          </div>
        ) : !hasBalance && !isDone ? (
          <div className="text-xs text-red-400 text-center py-1.5 font-medium">
            Saldo insuficiente
          </div>
        ) : isDone ? (
          <div className="flex items-center gap-1.5 justify-center text-xs text-brand font-semibold py-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Check-in confirmado
          </div>
        ) : (
          <Button
            onClick={() => checkIn.mutate(lesson.id)}
            disabled={!isActionable || checkIn.isPending}
            className={cn(
              "w-full h-8 text-xs font-semibold transition-colors",
              isActionable
                ? "bg-brand hover:bg-brand-dark text-white"
                : "bg-zinc-100 text-zinc-400 cursor-not-allowed"
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
