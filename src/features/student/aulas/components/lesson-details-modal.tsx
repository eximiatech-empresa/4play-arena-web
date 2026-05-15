"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { Lesson } from "@/core/entities/lesson"
import gsap from "gsap"
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
  TrendingUp,
  X,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogClose,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { LevelBadge } from "@/components/shared/level-badge"
import { cn } from "@/lib/utils"
import { useCheckIn } from "@/features/student/aulas/hooks/use-lessons"
import { computeLessonEligibility } from "@/core/math/lesson-eligibility"

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
  const [localOpen, setLocalOpen] = useState(false)
  const [lessonOverride, setLessonOverride] = useState<Lesson | null>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  // Refs to avoid stale closures and setState-on-unmount
  const localOpenRef = useRef(false)
  const closingRef = useRef(false)
  const mountedRef = useRef(true)

  useEffect(() => {
    const el = contentRef.current
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      if (el) gsap.killTweensOf(el)
    }
  }, [])

  // Reset override when a new lesson is selected
  const [prevLesson, setPrevLesson] = useState(lesson)
  if (lesson !== prevLesson) {
    setPrevLesson(lesson)
    if (open) setLessonOverride(null)
  }

  const runExit = useCallback(() => {
    closingRef.current = true
    if (contentRef.current) {
      gsap.to(contentRef.current, {
        y: 20,
        opacity: 0,
        scale: 0.97,
        duration: 0.22,
        ease: "power2.in",
        onComplete: () => {
          if (!mountedRef.current) return
          closingRef.current = false
          localOpenRef.current = false
          setLocalOpen(false)
          onClose()
        },
      })
    } else {
      closingRef.current = false
      localOpenRef.current = false
      setLocalOpen(false)
      onClose()
    }
  }, [onClose])

  // Sync parent open → local open (uses ref to avoid stale closure on localOpen)
  const [prevOpenSync, setPrevOpenSync] = useState(open)
  if (open !== prevOpenSync) {
    setPrevOpenSync(open)
    if (open) {
      setLocalOpen(true)
    }
  }

   
  useEffect(() => {
    if (open) {
      closingRef.current = false
      localOpenRef.current = true
    } else if (localOpenRef.current && !closingRef.current) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      runExit()
    }
  }, [open, runExit])

  // Animate in when dialog opens
  useEffect(() => {
    if (!localOpen) return
    const raf = requestAnimationFrame(() => {
      if (!contentRef.current || !mountedRef.current) return
      gsap.fromTo(
        contentRef.current,
        { y: 28, opacity: 0, scale: 0.96 },
        { y: 0, opacity: 1, scale: 1, duration: 0.38, ease: "power3.out" }
      )
    })
    return () => cancelAnimationFrame(raf)
  }, [localOpen])

  function handleOpenChange(v: boolean) {
    if (!v && !closingRef.current) runExit()
  }

  const checkIn = useCheckIn()

  if (!lesson) return null

  const displayLesson = lessonOverride ?? lesson

  const { spotsLeft, hasSpot, isLevelBlocked, hasBalance, isDone, isActionable } =
    computeLessonEligibility(displayLesson, studentLevelIndex, walletBalance)

  const dateObj = new Date(displayLesson.dateTime)
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

  const occupancyPct = Math.round((displayLesson.enrolledCount / displayLesson.totalSpots) * 100)

  return (
    <Dialog open={localOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-w-md p-0 bg-transparent border-none shadow-none"
        showClose={false}
        aria-describedby={undefined}
      >
        <div ref={contentRef} className="relative bg-card rounded-2xl overflow-hidden shadow-lg border border-border">
          <DialogClose className="absolute right-3 top-3 z-10 rounded-full w-7 h-7 flex items-center justify-center bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer">
            <X className="w-4 h-4" />
            <span className="sr-only">Fechar</span>
          </DialogClose>

          {/* Colored header strip */}
          <div className="bg-brand-dark px-6 pt-6 pb-5">
            <DialogHeader>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                  <span className="text-base font-bold text-white">
                    {displayLesson.professorName.charAt(0)}
                  </span>
                </div>
                <div>
                  <DialogTitle className="text-white text-lg leading-tight">
                    {displayLesson.professorName}
                  </DialogTitle>
                  <LevelBadge level={displayLesson.level} size="xs" className="mt-1 opacity-90" />
                </div>
              </div>
            </DialogHeader>

            <div className="mt-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-2xl font-bold text-white tabular-nums">
                  -{displayLesson.previewConsumption}P
                </span>
                {!displayLesson.isPeak && (
                  <span className="flex items-center gap-1 text-[11px] font-semibold bg-white/15 text-white px-2 py-1 rounded-full">
                    <TrendingDown className="w-3 h-3" />
                    Fora de Pico
                  </span>
                )}
                {displayLesson.isPeak && (
                  <span className="flex items-center gap-1 text-[11px] font-semibold bg-amber-400/25 text-amber-200 px-2 py-1 rounded-full">
                    <TrendingUp className="w-3 h-3" />
                    Horário de Pico +5%
                  </span>
                )}
                {displayLesson.isReserva && (
                  <span className="flex items-center gap-1 text-[11px] font-semibold bg-white/10 text-white/80 px-2 py-1 rounded-full">
                    <Users className="w-3 h-3" />
                    Avulso +10%
                  </span>
                )}
              </div>
              {displayLesson.professorBasePlays !== undefined && (
                <p className="text-[11px] text-white/55 mt-1.5">
                  Base {displayLesson.professorName}: {displayLesson.professorBasePlays}P
                  {displayLesson.isPeak && " × 1,05 (pico)"}
                  {displayLesson.isReserva && " × 1,10 (avulso)"}
                </p>
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
                {displayLesson.court}
              </InfoItem>
              <InfoItem icon={Users} label="Vagas">
                {spotsLeft > 0 ? `${spotsLeft} de ${displayLesson.totalSpots}` : "Lotada"}
              </InfoItem>
            </div>

            {/* Occupancy bar */}
            <div>
              <div className="flex justify-between text-xs text-zinc-400 mb-1.5">
                <span>{displayLesson.enrolledCount} inscritos</span>
                <span>{displayLesson.totalSpots} vagas totais</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
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
            {displayLesson.description && (
              <div>
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1.5">
                  Sobre a aula
                </p>
                <p className="text-sm text-zinc-600 leading-relaxed">
                  {displayLesson.description}
                </p>
              </div>
            )}

            {/* Check-in timing info */}
            {displayLesson.checkInStatus === "not_open" && (
              <div className="flex items-start gap-2 bg-muted rounded-xl p-3 text-xs text-muted-foreground">
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
                <div className="flex items-center justify-center gap-2 bg-muted rounded-xl py-3 text-muted-foreground text-sm">
                  <Lock className="w-3.5 h-3.5" />
                  Seu nível não é suficiente para esta aula
                </div>
              ) : !hasBalance ? (
                <div className="text-center bg-red-50 rounded-xl py-3 text-red-400 text-sm font-medium">
                  Saldo insuficiente — recarregue sua carteira
                </div>
              ) : !hasSpot ? (
                <div className="text-center bg-muted rounded-xl py-3 text-muted-foreground text-sm font-medium">
                  Turma lotada
                </div>
              ) : (
                <Button
                  onClick={() => {
                    console.log("Iniciando Check-in com os dados:", displayLesson)
                    checkIn.mutate(displayLesson, {
                      onSuccess: (updated) => {
                        setLessonOverride(updated)
                        toast.success("Check-in realizado com sucesso!")
                      },
                      onError: (error) => {
                        console.error("Erro no check-in:", error)
                        toast.error(error.message || "Erro ao realizar check-in.")
                      }
                    })
                  }}
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
                    CHECK_IN_LABELS[displayLesson.checkInStatus]
                  )}
                </Button>
              )}
            </div>
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
    <div className="bg-muted rounded-xl p-3">
      <div className="flex items-center gap-1.5 text-zinc-400 mb-1">
        <Icon className="w-3 h-3 text-brand" />
        <span className="text-[10px] font-semibold uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-sm font-medium text-foreground leading-snug">{children}</p>
    </div>
  )
}
