"use client"

import { useState } from "react"
import { CalendarCheck, ChevronLeft, ChevronRight, Filter, X } from "lucide-react"
import { useLessons, useLessonsByDate, type LessonFilters } from "@/features/student/aulas/hooks/use-lessons"
import { useLessonFilters, type StatusFilter } from "@/features/student/aulas/hooks/use-lesson-filters"
import { useLessonGridAnimation } from "@/features/student/aulas/hooks/use-lesson-grid-animation"
import { PROFESSORS, STUDENT_LEVELS } from "@/core/constants/professors"
import { useCurrentUser } from "@/hooks/use-current-user"
import { useWallet } from "@/features/student/carteira/hooks/use-wallet"
import { formatStudentLevel } from "@/core/math/lesson-eligibility"
import { getTodayBRT } from "@/lib/utils/date"
import { ViewToggle } from "@/components/shared/view-toggle"
import { DaySelector } from "@/components/shared/day-selector"
import { LessonCard } from "@/components/shared/lesson-card"
import { LessonDetailsModal } from "./lesson-details-modal"
import type { Lesson } from "@/core/entities/lesson"
import { cn } from "@/lib/utils"

const LEVEL_OPTIONS = ["Todos", ...STUDENT_LEVELS]
const PROFESSOR_OPTIONS = [
  { id: "", name: "Todos" },
  ...PROFESSORS.map((p) => ({ id: p.id, name: p.name })),
]

export function LessonsPageContent() {
  const [filters, setFilters] = useState<LessonFilters>({})
  const [availableOnly, setAvailableOnly] = useState(false)
  const [openOnly, setOpenOnly] = useState(false)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("")
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [selectedDate, setSelectedDate] = useState<string>(() => getTodayBRT())
  const [showAll, setShowAll] = useState(false)
  const [page, setPage] = useState(1)
  const today = getTodayBRT()

  const { data: currentUser } = useCurrentUser()
  const { data: wallet } = useWallet()

  const rawLevel = currentUser?.role === "STUDENT" ? currentUser.level : undefined
  const { studentLevelIndex } = formatStudentLevel(rawLevel)
  const walletBalance = wallet?.balance ?? 0

  const { data: allLessons, isLoading: isLoadingAll } = useLessons(filters, { enabled: showAll })
  const { data: dateLessons, isLoading: isLoadingDate } = useLessonsByDate(selectedDate, { enabled: !showAll })

  const isLoading = showAll ? isLoadingAll : isLoadingDate
  const rawLessons = showAll ? allLessons : dateLessons

  const { paginatedLessons: lessons, totalPages, safePage } = useLessonFilters(
    rawLessons,
    filters,
    availableOnly,
    statusFilter,
    openOnly,
    page,
  )

  const gridRef = useLessonGridAnimation(lessons, isLoading)

  const activeFilterCount = [
    !!filters.professorId,
    !!filters.level,
    statusFilter !== "",
    availableOnly,
    openOnly,
  ].filter(Boolean).length

  function clearAllFilters() {
    setFilters({})
    setAvailableOnly(false)
    setOpenOnly(false)
    setStatusFilter("")
    setPage(1)
  }

  function handleSelectDate(date: string) {
    setSelectedDate(date)
    setShowAll(false)
    setPage(1)
  }

  function handleShowAll() {
    setShowAll(true)
    setPage(1)
  }

  const showGrid = isLoading || (lessons && lessons.length > 0)
  const showEmpty = !isLoading && (!lessons || lessons.length === 0)

  return (
    <div className="p-4 lg:p-6 pb-24 lg:pb-6 max-w-5xl mx-auto">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <CalendarCheck className="w-5 h-5 text-brand" />
            <h1 className="text-xl font-bold text-foreground">Aulas</h1>
          </div>
          <p className="text-sm text-muted-foreground">Próximas aulas disponíveis para check-in</p>
        </div>
        <ViewToggle value={viewMode} onChange={setViewMode} />
      </div>

      <DaySelector
        today={today}
        selected={selectedDate}
        showAll={showAll}
        onSelect={handleSelectDate}
        onShowAll={handleShowAll}
      />

      {/* Filters */}
      <div className="bg-card rounded-2xl border border-border p-4 mb-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Filter
            className={cn(
              "w-3.5 h-3.5 transition-colors duration-200",
              isLoading ? "text-brand animate-pulse" : activeFilterCount > 0 ? "text-brand" : "text-zinc-400",
            )}
          />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Filtros</span>
          {activeFilterCount > 0 && (
            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-brand text-white text-[9px] font-bold">
              {activeFilterCount}
            </span>
          )}
          {isLoading && (
            <span className="ml-auto text-[10px] font-medium text-brand animate-pulse">Filtrando…</span>
          )}
          {!isLoading && activeFilterCount > 0 && (
            <button
              onClick={clearAllFilters}
              className="ml-auto flex items-center gap-1 text-[11px] font-medium text-zinc-400 hover:text-zinc-600 transition-colors"
            >
              <X className="w-3 h-3" />
              Limpar filtros
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          {/* Professor */}
          <div className="flex-1 min-w-35">
            <label className="block text-[11px] font-medium text-zinc-400 mb-1.5">Professor</label>
            <select
              className={cn(
                "w-full text-sm bg-muted border rounded-lg px-3 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-brand transition-colors",
                filters.professorId ? "border-brand/40 bg-brand/5" : "border-border",
              )}
              value={filters.professorId ?? ""}
              onChange={(e) => { setFilters((f) => ({ ...f, professorId: e.target.value || undefined })); setPage(1) }}
            >
              {PROFESSOR_OPTIONS.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Nível */}
          <div className="flex-1 min-w-35">
            <label className="block text-[11px] font-medium text-zinc-400 mb-1.5">Nível</label>
            <select
              className={cn(
                "w-full text-sm bg-muted border rounded-lg px-3 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-brand transition-colors",
                filters.level ? "border-brand/40 bg-brand/5" : "border-border",
              )}
              value={filters.level ?? ""}
              onChange={(e) => { setFilters((f) => ({ ...f, level: e.target.value || undefined })); setPage(1) }}
            >
              {LEVEL_OPTIONS.map((l) => (
                <option key={l} value={l === "Todos" ? "" : l}>{l}</option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div className="flex-1 min-w-35">
            <label className="block text-[11px] font-medium text-zinc-400 mb-1.5">Status</label>
            <select
              className={cn(
                "w-full text-sm bg-muted border rounded-lg px-3 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-brand transition-colors",
                statusFilter ? "border-brand/40 bg-brand/5" : "border-border",
              )}
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value as StatusFilter); setPage(1) }}
            >
              <option value="">Todas</option>
              <option value="active">Ativas</option>
              <option value="rescheduled">Reagendadas</option>
              <option value="cancelled">Canceladas</option>
            </select>
          </div>

          {/* Toggle buttons */}
          <div className="flex items-end gap-2">
            <FilterToggle
              active={availableOnly}
              onClick={() => { setAvailableOnly((v) => !v); setPage(1) }}
              label="Com vagas"
            />
            <FilterToggle
              active={openOnly}
              onClick={() => { setOpenOnly((v) => !v); setPage(1) }}
              label="Aberta p/ inscrição"
            />
          </div>
        </div>
      </div>

      {showGrid && (
        <div
          ref={gridRef}
          className={cn(
            "gap-4",
            viewMode === "grid"
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
              : "flex flex-col",
          )}
        >
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "rounded-2xl bg-zinc-100 animate-pulse",
                    viewMode === "grid" ? "h-48" : "h-24",
                  )}
                />
              ))
            : lessons!.map((lesson) => (
                <LessonCard
                  key={lesson.id}
                  lesson={lesson}
                  studentLevelIndex={studentLevelIndex}
                  walletBalance={walletBalance}
                  onClick={
                    lesson.status !== "cancelled" && !lesson.wasRescheduled
                      ? () => setSelectedLesson(lesson)
                      : undefined
                  }
                />
              ))}
        </div>
      )}

      {!isLoading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={safePage === 1}
            className="p-1.5 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={cn(
                "w-8 h-8 rounded-lg text-sm font-semibold transition-colors",
                p === safePage ? "bg-brand text-white" : "bg-muted text-muted-foreground hover:bg-muted/80",
              )}
            >
              {p}
            </button>
          ))}

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage === totalPages}
            className="p-1.5 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {showEmpty && (
        <div className="text-center py-16">
          <CalendarCheck className="w-10 h-10 text-zinc-200 mx-auto mb-3" />
          <p className="text-sm text-zinc-400 font-medium">Nenhuma aula encontrada</p>
          <p className="text-xs text-zinc-300 mt-1">Tente ajustar os filtros</p>
        </div>
      )}

      <LessonDetailsModal
        lesson={selectedLesson}
        open={!!selectedLesson}
        onClose={() => setSelectedLesson(null)}
        studentLevelIndex={studentLevelIndex}
        walletBalance={walletBalance}
      />
    </div>
  )
}

function FilterToggle({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors",
        active
          ? "bg-brand-subtle border-brand/30 text-brand-dark"
          : "bg-muted border-border text-muted-foreground hover:bg-muted/80",
      )}
    >
      <span
        className={cn(
          "w-3 h-3 rounded-full border shrink-0",
          active ? "bg-brand border-brand" : "border-zinc-300",
        )}
      />
      {label}
    </button>
  )
}
