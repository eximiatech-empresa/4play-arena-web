"use client"

import { useEffect, useRef, useState } from "react"
import gsap from "gsap"
import { CalendarCheck, ChevronLeft, ChevronRight, Filter, LayoutGrid, List } from "lucide-react"
import { useLessons, useLessonsByDate, type LessonFilters } from "@/features/booking/hooks/use-lessons"
import { PROFESSORS, STUDENT_LEVELS } from "@/core/constants/professors"
import { useCurrentUser } from "@/hooks/use-current-user"
import { useWallet } from "@/features/wallet/hooks/use-wallet"
import { formatStudentLevel } from "@/core/math/lesson-eligibility"
import { LessonCard } from "../../../components/shared/lesson-card"
import { LessonDetailsModal } from "./lesson-details-modal"
import type { Lesson } from "@/core/entities/lesson"
import { cn } from "@/lib/utils"

function getTodayBRT(): string {
  // now.getTime() is UTC ms; subtract 3h to get BRT, then read UTC fields
  const brtDate = new Date(new Date().getTime() - 3 * 60 * 60 * 1000)
  const y = brtDate.getUTCFullYear()
  const m = String(brtDate.getUTCMonth() + 1).padStart(2, "0")
  const d = String(brtDate.getUTCDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number)
  const date = new Date(Date.UTC(y, m - 1, d + days))
  const yr = date.getUTCFullYear()
  const mo = String(date.getUTCMonth() + 1).padStart(2, "0")
  const dy = String(date.getUTCDate()).padStart(2, "0")
  return `${yr}-${mo}-${dy}`
}

const DAY_ABBR = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]

function DaySelector({
  today,
  selected,
  showAll,
  onSelect,
  onShowAll,
}: {
  today: string
  selected: string
  showAll: boolean
  onSelect: (date: string) => void
  onShowAll: () => void
}) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i))

  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1 mb-5">
      <button
        onClick={onShowAll}
        className={cn(
          "flex flex-col items-center justify-center shrink-0 w-16 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer",
          showAll ? "bg-brand text-white" : "bg-muted text-muted-foreground hover:bg-muted/80",
        )}
      >
        <span className="text-[10px] font-semibold uppercase tracking-wide leading-none mb-1">Todas</span>
        <span className="text-base font-bold leading-none">∞</span>
      </button>

      {days.map((dateStr) => {
        const [y, m, d] = dateStr.split("-").map(Number)
        const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay()
        const isToday = dateStr === today
        const isActive = !showAll && dateStr === selected

        return (
          <button
            key={dateStr}
            onClick={() => onSelect(dateStr)}
            className={cn(
              "flex flex-col items-center justify-center shrink-0 w-14 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer",
              isActive ? "bg-brand text-white" : "bg-muted text-muted-foreground hover:bg-brand/40",
            )}
          >
            <span className="text-[10px] font-semibold uppercase tracking-wide leading-none mb-1">
              {isToday ? "Hoje" : DAY_ABBR[dow]}
            </span>
            <span className="text-base font-bold leading-none">{d}</span>
          </button>
        )
      })}
    </div>
  )
}

const PAGE_SIZE = 7

const LEVEL_OPTIONS = ["Todos", ...STUDENT_LEVELS]
const PROFESSOR_OPTIONS = [
  { id: "", name: "Todos" },
  ...PROFESSORS.map((p) => ({ id: p.id, name: p.name })),
]

function ViewToggle({
  value,
  onChange,
}: {
  value: "grid" | "list"
  onChange: (v: "grid" | "list") => void
}) {
  return (
    <div className="flex items-center gap-0.5 border border-border rounded-lg p-0.5 bg-muted shrink-0">
      <button
        onClick={() => onChange("grid")}
        title="Visualização em grade"
        className={cn(
          "p-1.5 rounded-md transition-colors",
          value === "grid" ? "bg-card shadow-sm text-foreground" : "text-zinc-400 hover:text-zinc-600",
        )}
      >
        <LayoutGrid className="w-4 h-4" />
      </button>
      <button
        onClick={() => onChange("list")}
        title="Visualização em lista"
        className={cn(
          "p-1.5 rounded-md transition-colors",
          value === "list" ? "bg-card shadow-sm text-foreground" : "text-zinc-400 hover:text-zinc-600",
        )}
      >
        <List className="w-4 h-4" />
      </button>
    </div>
  )
}

export function LessonsPageContent() {
  const [filters, setFilters] = useState<LessonFilters>({})
  const [availableOnly, setAvailableOnly] = useState(false)
  const [statusFilter, setStatusFilter] = useState<"" | "active" | "cancelled" | "rescheduled">("")
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

  // Both hooks always called; only the active one is enabled
  const { data: allLessons, isLoading: isLoadingAll } = useLessons(filters, { enabled: showAll })
  const { data: dateLessons, isLoading: isLoadingDate } = useLessonsByDate(selectedDate, { enabled: !showAll })

  const isLoading = showAll ? isLoadingAll : isLoadingDate

  const rawLessons = showAll ? allLessons : dateLessons

  const filteredLessons = rawLessons?.filter((l) => {
    if (filters.professorId && l.professorId !== filters.professorId) return false
    if (filters.level && l.level !== filters.level) return false
    if (availableOnly && l.enrolledCount >= l.totalSpots && !l.isEnrolled) return false
    
    // Filtro de status
    const isCancelled = l.status === "cancelled"
    const isRescheduled = l.wasRescheduled && !isCancelled
    const isActive = !isCancelled && !isRescheduled

    if (statusFilter === "active" && !isActive) return false
    if (statusFilter === "cancelled" && !isCancelled) return false
    if (statusFilter === "rescheduled" && !isRescheduled) return false

    return true
  })

  const totalPages = Math.max(1, Math.ceil((filteredLessons?.length ?? 0) / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const lessons = filteredLessons?.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  function handleSelectDate(date: string) {
    setSelectedDate(date)
    setShowAll(false)
    setPage(1)
  }

  function handleShowAll() {
    setShowAll(true)
    setPage(1)
  }

  const gridRef = useRef<HTMLDivElement>(null)
  const isFirstRender = useRef(true)
  const prevIsLoading = useRef(false)

  // Fade the grid OUT when loading starts (filters changed)
  useEffect(() => {
    if (isLoading && !prevIsLoading.current && gridRef.current) {
      const children = Array.from(gridRef.current.children)
      if (children.length) {
        gsap.to(children, { opacity: 0, y: -10, duration: 0.18, ease: "power2.in", stagger: 0.03 })
      }
    }
    prevIsLoading.current = isLoading
  }, [isLoading])

  // Stagger cards IN when new data arrives
  useEffect(() => {
    if (isLoading || !gridRef.current) return
    const children = Array.from(gridRef.current.children)
    if (!children.length) return

    if (isFirstRender.current) {
      gsap.set(children, { opacity: 1, y: 0 })
      isFirstRender.current = false
      return
    }

    gsap.fromTo(
      children,
      { opacity: 0, y: 22 },
      { opacity: 1, y: 0, duration: 0.38, ease: "power3.out", stagger: 0.07 },
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessons])

  const showGrid = isLoading || (lessons && lessons.length > 0)
  const showEmpty = !isLoading && (!lessons || lessons.length === 0)

  return (
    <div className="p-4 lg:p-6 pb-24 lg:pb-6 max-w-5xl mx-auto">
      {/* Header */}
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
              isLoading ? "text-brand animate-pulse" : "text-zinc-400",
            )}
          />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Filtros</span>
          {isLoading && (
            <span className="ml-auto text-[10px] font-medium text-brand animate-pulse">Filtrando…</span>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-35">
            <label className="block text-[11px] font-medium text-zinc-400 mb-1.5">Professor</label>
            <select
              className="w-full text-sm bg-muted border border-border rounded-lg px-3 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-brand"
              value={filters.professorId ?? ""}
              onChange={(e) => { setFilters((f) => ({ ...f, professorId: e.target.value || undefined })); setPage(1) }}
            >
              {PROFESSOR_OPTIONS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-35">
            <label className="block text-[11px] font-medium text-zinc-400 mb-1.5">Nível</label>
            <select
              className="w-full text-sm bg-muted border border-border rounded-lg px-3 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-brand"
              value={filters.level ?? ""}
              onChange={(e) => { setFilters((f) => ({ ...f, level: e.target.value || undefined })); setPage(1) }}
            >
              {LEVEL_OPTIONS.map((l) => (
                <option key={l} value={l === "Todos" ? "" : l}>
                  {l}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-35">
            <label className="block text-[11px] font-medium text-zinc-400 mb-1.5">Status</label>
            <select
              className="w-full text-sm bg-muted border border-border rounded-lg px-3 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-brand"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value as "" | "active" | "cancelled" | "rescheduled"); setPage(1) }}
            >
              <option value="">Todas</option>
              <option value="active">Ativas</option>
              <option value="rescheduled">Reagendadas</option>
              <option value="cancelled">Canceladas</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => { setAvailableOnly((v) => !v); setPage(1) }}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors",
                availableOnly
                  ? "bg-brand-subtle border-brand/30 text-brand-dark"
                  : "bg-muted border-border text-muted-foreground hover:bg-muted/80",
              )}
            >
              <span
                className={cn(
                  "w-3 h-3 rounded-full border",
                  availableOnly ? "bg-brand border-brand" : "border-zinc-300",
                )}
              />
              Com vagas
            </button>
          </div>
        </div>
      </div>

      {/* Lessons grid/list */}
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

      {/* Pagination */}
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

      {/* Empty state */}
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
