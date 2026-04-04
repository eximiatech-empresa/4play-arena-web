"use client"

import {
  MapPin,
  Users,
  Clock,
  CalendarDays,
  Zap,
  Loader2,
  CheckCircle2,
  Lock,
  TrendingDown,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { LevelBadge } from "@/components/shared/level-badge"
import { cn } from "@/lib/utils"
import type { Lesson } from "@/core/entities/lesson"
import { useCheckIn } from "@/features/booking/hooks/use-lessons"

interface LessonDetailsModalProps {
  lesson: Lesson | null
  open: boolean
  onClose: () => void
  studentLevelIndex: number
  walletBalance: number
}

const CHECK_IN_LABELS: Record<string, string> = {
  not_open: "Check-in ainda não aberto",
  enrolled_only: "Fazer Check-in",
  open: "Fazer Check-in",
  closed: "Aula encerrada",
  done: "Check-in já realizado",
}

export function LessonDetailsModal({
  lesson,
  open,
  onClose,
  studentLevelIndex,
  walletBalance,
}: LessonDetailsModalProps) {
  const checkIn = useCheckIn()

  if (!lesson) return null

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
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "America/Sao_Paulo",
  })
  const formattedTime = dateObj.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  })

  const occupancyPct = Math.round((lesson.enrolledCount / lesson.totalSpots) * 100)

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md p-0 overflow-hidden rounded-2xl">
        {/* Colored header strip */}
        <div className="bg-brand-dark px-6 pt-6 pb-5">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                <span className="text-base font-bold text-white">
                  {lesson.professorName.charAt(0)}
                </span>
              </div>
              <div>
                <DialogTitle className="text-white text-lg leading-tight">
                  {lesson.professorName}
                </DialogTitle>
                <LevelBadge level={lesson.level} size="xs" className="mt-1 opacity-90" />
              </div>
            </div>
          </DialogHeader>

          <div className="mt-4 flex items-center gap-2">
            <span className="text-2xl font-bold text-white tabular-nums">
              -{lesson.previewConsumption.toFixed(2)}h
            </span>
            {lesson.isOffPeak && (
              <span className="flex items-center gap-1 text-[11px] font-semibold bg-white/15 text-white px-2 py-1 rounded-full">
                <TrendingDown className="w-3 h-3" />
                Fora de Pico −5%
              </span>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {/* Info grid */}
          <div className="grid grid-cols-2 gap-3">
            <InfoItem icon={CalendarDays} label="Data">
              <span className="capitalize">{formattedDate}</span>
            </InfoItem>
            <InfoItem icon={Clock} label="Horário">
              {formattedTime}
            </InfoItem>
            <InfoItem icon={MapPin} label="Quadra">
              {lesson.court}
            </InfoItem>
            <InfoItem icon={Users} label="Vagas">
              {spotsLeft > 0 ? `${spotsLeft} de ${lesson.totalSpots}` : "Lotada"}
            </InfoItem>
          </div>

          {/* Occupancy bar */}
          <div>
            <div className="flex justify-between text-xs text-zinc-400 mb-1.5">
              <span>{lesson.enrolledCount} inscritos</span>
              <span>{lesson.totalSpots} vagas totais</span>
            </div>
            <div className="h-1.5 rounded-full bg-zinc-100 overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  occupancyPct >= 100 ? "bg-red-400" : occupancyPct >= 75 ? "bg-amber-400" : "bg-brand"
                )}
                style={{ width: `${Math.min(occupancyPct, 100)}%` }}
              />
            </div>
          </div>

          {/* Description */}
          {lesson.description && (
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1.5">
                Sobre a aula
              </p>
              <p className="text-sm text-zinc-600 leading-relaxed">
                {lesson.description}
              </p>
            </div>
          )}

          {/* Check-in timing info */}
          {lesson.checkInStatus === "not_open" && (
            <div className="flex items-start gap-2 bg-zinc-50 rounded-xl p-3 text-xs text-zinc-500">
              <Zap className="w-3.5 h-3.5 text-zinc-400 mt-0.5 shrink-0" />
              <span>
                Check-in abre <strong>24h antes</strong> para inscritos e{" "}
                <strong>6h antes</strong> para todos os alunos elegíveis.
              </span>
            </div>
          )}

          {/* CTA */}
          <div className="pt-1">
            {isDone ? (
              <div className="flex items-center justify-center gap-2 bg-brand-subtle rounded-xl py-3 text-brand-dark font-semibold text-sm">
                <CheckCircle2 className="w-4 h-4" />
                Check-in confirmado!
              </div>
            ) : isLevelBlocked ? (
              <div className="flex items-center justify-center gap-2 bg-zinc-50 rounded-xl py-3 text-zinc-400 text-sm">
                <Lock className="w-3.5 h-3.5" />
                Seu nível não é suficiente para esta aula
              </div>
            ) : !hasBalance ? (
              <div className="text-center bg-red-50 rounded-xl py-3 text-red-400 text-sm font-medium">
                Saldo insuficiente — recarregue sua carteira
              </div>
            ) : !hasSpot ? (
              <div className="text-center bg-zinc-50 rounded-xl py-3 text-zinc-400 text-sm font-medium">
                Turma lotada
              </div>
            ) : (
              <Button
                onClick={() => checkIn.mutate(lesson.id)}
                disabled={!isActionable || checkIn.isPending}
                className={cn(
                  "w-full h-10 font-semibold transition-colors",
                  isActionable
                    ? "bg-brand hover:bg-brand-dark text-white"
                    : "bg-zinc-100 text-zinc-400 cursor-not-allowed"
                )}
              >
                {checkIn.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  CHECK_IN_LABELS[lesson.checkInStatus]
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function InfoItem({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ElementType
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-zinc-50 rounded-xl p-3">
      <div className="flex items-center gap-1.5 text-zinc-400 mb-1">
        <Icon className="w-3 h-3" />
        <span className="text-[10px] font-semibold uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-sm font-medium text-zinc-700 leading-snug">{children}</p>
    </div>
  )
}
