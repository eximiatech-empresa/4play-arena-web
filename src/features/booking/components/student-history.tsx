"use client"

import { useState, useMemo } from "react"
import {
  History,
  CalendarClock,
  MapPin,
  CheckCircle2,
  XCircle,
  MinusCircle,
  AlertCircle,
  Coins,
  ArrowRight,
  CalendarX,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { formatLessonDateTime } from "@/lib/utils/date"
import { LevelBadge } from "@/components/shared/level-badge"
import { useStudentHistory, type LessonHistoryEntry } from "../hooks/use-student-history"
import { useCurrentUser } from "@/hooks/use-current-user"

type HistoryTab = "upcoming" | "past"

export function StudentHistory() {
  const [activeTab, setActiveTab] = useState<HistoryTab>("upcoming")
  const { data: entries, isLoading, isError } = useStudentHistory()
  const { data: currentUser } = useCurrentUser()
  const studentId = currentUser?.uid ?? ""

  const { upcoming, past } = useMemo(() => {
    if (!entries) return { upcoming: [], past: [] }

    const up = entries
      .filter((e) => e.status === "scheduled")
      .sort((a, b) => a.dateTime.localeCompare(b.dateTime)) // nearest first

    const done = entries
      .filter((e) => e.status !== "scheduled")
      .sort((a, b) => b.dateTime.localeCompare(a.dateTime)) // most recent first

    return { upcoming: up, past: done }
  }, [entries])

  return (
    <div className="p-4 lg:p-6 pb-24 lg:pb-6 max-w-3xl mx-auto">
      {/* Page header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <History className="w-5 h-5 text-brand" />
          <h1 className="text-xl font-bold text-foreground">Meu Histórico</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Todas as aulas em que você se inscreveu
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border mb-5">
        <TabButton
          active={activeTab === "upcoming"}
          onClick={() => setActiveTab("upcoming")}
          label="Próximas"
          count={upcoming.length}
        />
        <TabButton
          active={activeTab === "past"}
          onClick={() => setActiveTab("past")}
          label="Concluídas"
          count={past.length}
        />
      </div>

      {/* Content */}
      {isLoading && <SkeletonList />}

      {isError && (
        <div className="flex items-center gap-2 text-sm text-red-500 py-8 justify-center">
          <AlertCircle className="w-4 h-4" />
          Erro ao carregar histórico. Tente novamente.
        </div>
      )}

      {!isLoading && !isError && activeTab === "upcoming" && (
        <LessonList
          entries={upcoming}
          studentId={studentId}
          emptyTitle="Nenhuma aula agendada"
          emptySubtitle="Faça check-in em uma aula para ela aparecer aqui"
        />
      )}

      {!isLoading && !isError && activeTab === "past" && (
        <LessonList
          entries={past}
          studentId={studentId}
          emptyTitle="Nenhuma aula concluída ainda"
          emptySubtitle="Suas aulas finalizadas e canceladas aparecerão aqui"
        />
      )}
    </div>
  )
}

// ─── Tab button ───────────────────────────────────────────────────────────────

function TabButton({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean
  onClick: () => void
  label: string
  count: number
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
        active
          ? "border-brand text-brand"
          : "border-transparent text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
      <span
        className={cn(
          "inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full text-[10px] font-bold",
          active
            ? "bg-brand/10 text-brand"
            : "bg-muted text-muted-foreground",
        )}
      >
        {count}
      </span>
    </button>
  )
}

// ─── List ─────────────────────────────────────────────────────────────────────

function LessonList({
  entries,
  studentId,
  emptyTitle,
  emptySubtitle,
}: {
  entries: LessonHistoryEntry[]
  studentId: string
  emptyTitle: string
  emptySubtitle: string
}) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-16">
        <History className="w-10 h-10 text-zinc-200 mx-auto mb-3" />
        <p className="text-sm font-medium text-zinc-400">{emptyTitle}</p>
        <p className="text-xs text-zinc-300 mt-1">{emptySubtitle}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {entries.map((entry) => (
        <HistoryCard key={entry.id} entry={entry} studentId={studentId} />
      ))}
    </div>
  )
}

// ─── History card ─────────────────────────────────────────────────────────────

function HistoryCard({
  entry,
  studentId,
}: {
  entry: LessonHistoryEntry
  studentId: string
}) {
  const { date, time } = formatLessonDateTime(entry.dateTime)

  const isCancelled = entry.status === "cancelled"
  const isFinished = entry.status === "finished"
  const isScheduled = entry.status === "scheduled"

  const attendance = isFinished
    ? entry.checkedInStudentIds.includes(studentId)
      ? "present"
      : entry.absentStudentIds.includes(studentId)
      ? "absent"
      : "none"
    : null

  const borderColor = isCancelled
    ? "border-l-red-400"
    : isFinished && attendance === "present"
    ? "border-l-emerald-400"
    : isFinished && attendance === "absent"
    ? "border-l-red-400"
    : entry.wasRescheduled
    ? "border-l-amber-400"
    : "border-l-brand"

  return (
    <div
      className={cn(
        "bg-card border border-border rounded-2xl overflow-hidden",
        "border-l-4",
        borderColor,
      )}
    >
      {/* Card header */}
      <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-white text-xs font-bold",
              isCancelled
                ? "bg-red-400"
                : entry.wasRescheduled
                ? "bg-amber-400"
                : isFinished
                ? "bg-zinc-400"
                : "bg-chart-3",
            )}
          >
            {entry.professorName.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">
              {entry.professorName}
            </p>
            <LevelBadge level={entry.level} size="xs" />
          </div>
        </div>

        <StatusBadge entry={entry} />
      </div>

      {/* Meta row */}
      <div className="px-4 pb-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <CalendarClock className="w-3 h-3" />
          {date} · {time}
        </span>
        <span className="flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          {entry.court}
        </span>
      </div>

      {/* Contextual bottom band */}
      <ContextBand entry={entry} attendance={attendance} />
    </div>
  )
}

// ─── Status badge (top-right corner of card) ─────────────────────────────────

function StatusBadge({ entry }: { entry: LessonHistoryEntry }) {
  if (entry.status === "cancelled") {
    return (
      <span className="shrink-0 text-[9px] font-bold uppercase tracking-wide bg-red-500 rounded-full px-2 py-0.5 text-white">
        Cancelada
      </span>
    )
  }
  if (entry.status === "finished") {
    return (
      <span className="shrink-0 text-[9px] font-bold uppercase tracking-wide bg-zinc-400 rounded-full px-2 py-0.5 text-white">
        Finalizada
      </span>
    )
  }
  if (entry.wasRescheduled) {
    return (
      <span className="shrink-0 text-[9px] font-bold uppercase tracking-wide bg-amber-500 rounded-full px-2 py-0.5 text-white">
        Reagendada
      </span>
    )
  }
  return (
    <span className="shrink-0 text-[9px] font-bold uppercase tracking-wide bg-brand rounded-full px-2 py-0.5 text-white">
      Inscrito
    </span>
  )
}

// ─── Contextual band at the bottom of each card ───────────────────────────────

function ContextBand({
  entry,
  attendance,
}: {
  entry: LessonHistoryEntry
  attendance: "present" | "absent" | "none" | null
}) {
  // Finished lesson — show attendance + cost
  if (entry.status === "finished") {
    return (
      <div className="px-4 py-2.5 bg-muted/40 border-t border-border flex items-center justify-between gap-4 flex-wrap">
        <AttendanceBadge status={attendance!} />
        {entry.playsSpent !== null && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Coins className="w-3.5 h-3.5 text-brand" />
            <span>
              Custo:{" "}
              <strong className="text-foreground">
                {entry.playsSpent}P
              </strong>
            </span>
          </span>
        )}
      </div>
    )
  }

  // Cancelled lesson — show reason if available
  if (entry.status === "cancelled") {
    return (
      <div className="px-4 py-2.5 bg-red-50 dark:bg-red-950/20 border-t border-red-100 dark:border-red-900/30 flex items-start gap-2">
        <CalendarX className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
        <p className="text-xs text-red-600 dark:text-red-400">
          {entry.cancellationReason
            ? `Cancelada: ${entry.cancellationReason}`
            : "Aula cancelada pelo professor ou administrador."}
        </p>
      </div>
    )
  }

  // Rescheduled but still scheduled — show new datetime note
  if (entry.wasRescheduled) {
    const { date, time } = formatLessonDateTime(entry.dateTime)
    return (
      <div className="px-4 py-2.5 bg-amber-50 dark:bg-amber-950/20 border-t border-amber-100 dark:border-amber-900/30 flex items-center gap-2">
        <ArrowRight className="w-3.5 h-3.5 text-amber-500 shrink-0" />
        <p className="text-xs text-amber-700 dark:text-amber-400">
          Horário alterado para{" "}
          <strong>
            {date} às {time}
          </strong>
        </p>
      </div>
    )
  }

  return null
}

// ─── Attendance badge ─────────────────────────────────────────────────────────

function AttendanceBadge({ status }: { status: "present" | "absent" | "none" }) {
  if (status === "present") {
    return (
      <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
        <CheckCircle2 className="w-4 h-4" />
        Presente
      </span>
    )
  }
  if (status === "absent") {
    return (
      <span className="flex items-center gap-1.5 text-xs font-semibold text-red-500">
        <XCircle className="w-4 h-4" />
        Falta
      </span>
    )
  }
  return (
    <span className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400">
      <MinusCircle className="w-4 h-4" />
      Chamada não realizada
    </span>
  )
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function SkeletonList() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-card border border-border rounded-2xl overflow-hidden animate-pulse">
          <div className="px-4 pt-4 pb-3 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-zinc-200" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 bg-zinc-200 rounded w-32" />
              <div className="h-3 bg-zinc-100 rounded w-20" />
            </div>
          </div>
          <div className="px-4 pb-3 flex gap-4">
            <div className="h-3 bg-zinc-100 rounded w-28" />
            <div className="h-3 bg-zinc-100 rounded w-20" />
          </div>
          <div className="h-9 bg-zinc-50 border-t border-border" />
        </div>
      ))}
    </div>
  )
}
