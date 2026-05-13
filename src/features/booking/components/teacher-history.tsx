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
  Users,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { formatLessonDateTime } from "@/lib/utils/date"
import { formatCurrency } from "@/utils/formatters"
import { LevelBadge } from "@/components/shared/level-badge"
import { useTeacherHistory, type TeacherLessonHistoryEntry } from "../hooks/use-teacher-history"

type HistoryTab = "finished" | "cancelled"

export function TeacherHistory() {
  const [activeTab, setActiveTab] = useState<HistoryTab>("finished")
  const { data: entries, isLoading, isError } = useTeacherHistory()

  const { finished, cancelled } = useMemo(() => {
    if (!entries) return { finished: [], cancelled: [] }
    return {
      finished: entries.filter((e) => e.status === "finished"),
      cancelled: entries.filter((e) => e.status === "cancelled"),
    }
  }, [entries])

  const totalEarned = useMemo(
    () => finished.reduce((sum, e) => sum + e.totalEarned, 0),
    [finished],
  )

  return (
    <div className="p-4 lg:p-6 pb-24 lg:pb-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <History className="w-5 h-5 text-brand" />
          <h1 className="text-xl font-bold text-foreground">Histórico de Aulas</h1>
        </div>
        <p className="text-sm text-muted-foreground">Aulas que você ministrou</p>
      </div>

      {!isLoading && !isError && (
        <div className="flex gap-3 mb-6">
          <StatCard
            label="Aulas finalizadas"
            value={String(finished.length)}
          />
          <StatCard
            label="Total ganho"
            value={formatCurrency(totalEarned)}
          />
          <StatCard
            label="Aulas canceladas"
            value={String(cancelled.length)}
          />
        </div>
      )}

      <div className="flex border-b border-border mb-5">
        <TabButton
          active={activeTab === "finished"}
          onClick={() => setActiveTab("finished")}
          label="Finalizadas"
          count={finished.length}
        />
        <TabButton
          active={activeTab === "cancelled"}
          onClick={() => setActiveTab("cancelled")}
          label="Canceladas"
          count={cancelled.length}
        />
      </div>

      {isLoading && <SkeletonList />}

      {isError && (
        <div className="flex items-center gap-2 text-sm text-red-500 py-8 justify-center">
          <AlertCircle className="w-4 h-4" />
          Erro ao carregar histórico
        </div>
      )}

      {!isLoading && !isError && activeTab === "finished" && (
        <LessonList
          entries={finished}
          variant="finished"
          emptyTitle="Nenhuma aula finalizada"
          emptySubtitle="Suas aulas concluídas aparecerão aqui"
        />
      )}

      {!isLoading && !isError && activeTab === "cancelled" && (
        <LessonList
          entries={cancelled}
          variant="cancelled"
          emptyTitle="Nenhuma aula cancelada"
          emptySubtitle="Aulas canceladas aparecerão aqui"
        />
      )}
    </div>
  )
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex-1 bg-card border border-border rounded-xl px-3 py-2.5">
      <p className="text-[10px] text-muted-foreground font-medium leading-none mb-1">{label}</p>
      <p className="text-sm font-bold text-foreground">{value}</p>
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
          active ? "bg-brand/10 text-brand" : "bg-muted text-muted-foreground",
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
  variant,
  emptyTitle,
  emptySubtitle,
}: {
  entries: TeacherLessonHistoryEntry[]
  variant: "finished" | "cancelled"
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
        <TeacherLessonCard key={entry.id} entry={entry} variant={variant} />
      ))}
    </div>
  )
}

// ─── Lesson card ──────────────────────────────────────────────────────────────

function TeacherLessonCard({
  entry,
  variant,
}: {
  entry: TeacherLessonHistoryEntry
  variant: "finished" | "cancelled"
}) {
  const { date, time } = formatLessonDateTime(entry.dateTime)

  return (
    <div
      className={cn(
        "bg-card border border-border rounded-2xl overflow-hidden border-l-4",
        variant === "finished" ? "border-l-emerald-400" : "border-l-red-400",
      )}
    >
      <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-3">
        <LevelBadge level={entry.level} size="sm" />
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-muted-foreground">
            {date} · {time}
          </span>
          {variant === "finished" ? (
            <span className="text-[9px] font-bold uppercase tracking-wide bg-zinc-400 rounded-full px-2 py-0.5 text-white">
              Finalizada
            </span>
          ) : (
            <span className="text-[9px] font-bold uppercase tracking-wide bg-red-500 rounded-full px-2 py-0.5 text-white">
              Cancelada
            </span>
          )}
        </div>
      </div>

      <div className="px-4 pb-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          {entry.court}
        </span>
        <span className="flex items-center gap-1">
          <CalendarClock className="w-3 h-3" />
          {date} às {time}
        </span>
      </div>

      {variant === "finished" ? (
        <FinishedBands entry={entry} />
      ) : (
        <CancelledBand entry={entry} />
      )}
    </div>
  )
}

// ─── Finished lesson bands ────────────────────────────────────────────────────

function FinishedBands({ entry }: { entry: TeacherLessonHistoryEntry }) {
  const visibleStudents = entry.presentStudents.slice(0, 3)
  const overflow = entry.presentStudents.length - 3

  return (
    <>
      <div className="px-4 py-2.5 bg-emerald-50 dark:bg-emerald-950/20 border-t border-emerald-100 dark:border-emerald-900/30 flex items-center gap-2">
        <Coins className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
        <span className="text-xs text-emerald-700 dark:text-emerald-400">
          Ganhos:{" "}
          <strong>
            {formatCurrency(entry.totalEarned)}
          </strong>
        </span>
      </div>

      <div className="px-4 py-2.5 bg-muted/40 border-t border-border flex flex-wrap items-center gap-x-4 gap-y-1.5">
        {entry.presentStudents.length > 0 && (
          <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            {visibleStudents.map((s) => s.name ?? "Aluno").join(", ")}
            {overflow > 0 && ` +${overflow} mais`}
          </span>
        )}
        {entry.absentCount > 0 && (
          <span className="flex items-center gap-1.5 text-xs text-red-500 font-medium">
            <XCircle className="w-3.5 h-3.5 shrink-0" />
            {entry.absentCount} falta{entry.absentCount !== 1 ? "s" : ""}
          </span>
        )}
        {entry.pendingCount > 0 && (
          <span className="flex items-center gap-1.5 text-xs text-zinc-400 font-medium">
            <MinusCircle className="w-3.5 h-3.5 shrink-0" />
            {entry.pendingCount} sem registro
          </span>
        )}
        {entry.presentStudents.length === 0 && entry.absentCount === 0 && entry.pendingCount === 0 && (
          <span className="text-xs text-muted-foreground">Nenhum aluno inscrito</span>
        )}
      </div>
    </>
  )
}

// ─── Cancelled lesson band ────────────────────────────────────────────────────

function CancelledBand({ entry }: { entry: TeacherLessonHistoryEntry }) {
  return (
    <div className="px-4 py-2.5 bg-red-50 dark:bg-red-950/20 border-t border-red-100 dark:border-red-900/30 flex flex-col gap-1.5">
      <span className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
        <Users className="w-3.5 h-3.5 shrink-0" />
        {entry.totalEnrolled} aluno{entry.totalEnrolled !== 1 ? "s" : ""} inscrito{entry.totalEnrolled !== 1 ? "s" : ""}
      </span>
      {entry.cancellationReason ? (
        <span className="flex items-start gap-1.5 text-xs text-red-600 dark:text-red-400">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          Motivo: {entry.cancellationReason}
        </span>
      ) : (
        <span className="text-xs text-red-400 dark:text-red-500">Sem motivo informado</span>
      )}
    </div>
  )
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function SkeletonList() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-card border border-border rounded-2xl overflow-hidden animate-pulse">
          <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-3">
            <div className="h-5 bg-zinc-200 rounded-full w-20" />
            <div className="flex items-center gap-2">
              <div className="h-3.5 bg-zinc-100 rounded w-28" />
              <div className="h-4 bg-zinc-200 rounded-full w-16" />
            </div>
          </div>
          <div className="px-4 pb-3 flex gap-4">
            <div className="h-3 bg-zinc-100 rounded w-20" />
            <div className="h-3 bg-zinc-100 rounded w-28" />
          </div>
          <div className="h-9 bg-zinc-50 border-t border-border" />
          <div className="h-9 bg-zinc-50 border-t border-border" />
        </div>
      ))}
    </div>
  )
}
