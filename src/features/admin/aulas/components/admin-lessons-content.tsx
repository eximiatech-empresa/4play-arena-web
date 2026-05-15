"use client"

import { useState, useMemo } from "react"
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Loader2,
  X,
  SlidersHorizontal,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAdminLessonsByMonth } from "../hooks/use-admin-lessons"
import { useTeachers } from "@/features/shared/auth/hooks/use-teachers"
import { CreateLessonModal } from "./create-lesson-modal"
import { DayDetailModal } from "./day-detail-modal"
import type { LessonDocument } from "@/core/entities/lesson"
import { STUDENT_LEVELS } from "@/core/constants/professors"
import { cn } from "@/lib/utils"
import {
  WEEKDAYS,
  MONTHS_PT,
  STATUS_OPTIONS,
} from "@/core/constants/lesson-labels"
import { buildCalendarGrid, toDatetimeInput } from "@/utils/calendar"

const LESSON_CHIP_CLASS: Record<string, string> = {
  scheduled: "bg-blue-100/50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20",
  finished: "bg-emerald-100/50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
  cancelled: "bg-rose-100/50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20",
}

// ─── Lesson chip ──────────────────────────────────────────────────────────────

function LessonChip({ lesson }: { lesson: LessonDocument }) {
  const time = new Date(lesson.dateTime).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  })
  return (
    <span
      title={`${lesson.description ?? lesson.level} — ${time}`}
      className={cn(
        "block truncate rounded px-1.5 py-0.5 text-[10px] leading-tight font-medium border",
        LESSON_CHIP_CLASS[lesson.status] ?? LESSON_CHIP_CLASS.scheduled,
      )}
    >
      {time} {lesson.description ?? lesson.level}
    </span>
  )
}

// ─── Day cell ─────────────────────────────────────────────────────────────────

function DayCell({
  day,
  lessons,
  isToday,
  onClick,
  weekdayLabel,
}: {
  day: number | null
  lessons: LessonDocument[]
  isToday: boolean
  onClick: () => void
  weekdayLabel?: string
}) {
  if (day === null) {
    return <div className="hidden lg:block bg-muted/20 border border-border/40 rounded-xl min-h-[90px] lg:min-h-27.5" />
  }

  const visible = lessons.slice(0, 3)
  const overflow = lessons.length - 3

  return (
    <button
      onClick={onClick}
      className="border border-border rounded-xl p-3 lg:p-2 min-h-[70px] lg:min-h-27.5 flex flex-col gap-2 lg:gap-1 text-left transition-all w-full bg-card hover:border-brand/40 hover:bg-muted/30 hover:shadow-sm cursor-pointer"
    >
      <div className="flex items-center justify-between w-full lg:justify-end">
        {weekdayLabel && (
          <span className="text-xs font-medium text-zinc-500 lg:hidden">
            {weekdayLabel}
          </span>
        )}
        <span
          className={cn(
            "text-xs font-bold leading-none w-6 h-6 lg:w-5 lg:h-5 flex items-center justify-center rounded-full shrink-0",
            isToday ? "bg-brand text-white" : "text-zinc-600 dark:text-zinc-300",
          )}
        >
          {day}
        </span>
      </div>
      <div className="flex flex-col gap-1 lg:gap-0.5 flex-1 min-w-0 w-full">
        {visible.map((l) => (
          <LessonChip key={l.id} lesson={l} />
        ))}
        {overflow > 0 && (
          <span className="text-[10px] text-zinc-400 pl-1 font-medium">+{overflow} aulas</span>
        )}
      </div>
    </button>
  )
}

// ─── Filters bar ──────────────────────────────────────────────────────────────

interface Filters {
  professorId: string
  level: string
  status: string
}

const EMPTY_FILTERS: Filters = { professorId: "", level: "", status: "" }

function FiltersBar({
  filters,
  onChange,
}: {
  filters: Filters
  onChange: (f: Filters) => void
}) {
  const { data: teachers = [] } = useTeachers()
  const hasActive = Object.values(filters).some(Boolean)

  return (
    <div className="flex flex-col sm:flex-row flex-wrap sm:items-center gap-2">
      <div className="hidden sm:flex items-center gap-2 mr-1">
        <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
      </div>

      {/* Professor */}
      <Select
        value={filters.professorId || "__all__"}
        onValueChange={(v) => onChange({ ...filters, professorId: v === "__all__" ? "" : v })}
      >
        <SelectTrigger className="h-9 sm:h-8 text-xs w-full sm:w-40 border-border cursor-pointer hover:bg-zinc-200">
          <SelectValue placeholder="Professor" />
        </SelectTrigger>
        <SelectContent >
          <SelectItem value="__all__">Todos os professores</SelectItem>
          {teachers.map((t) => (
            <SelectItem className="cursor-pointer" key={t.uid} value={t.uid}>{t.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Nível */}
      <Select
        value={filters.level || "__all__"}
        onValueChange={(v) => onChange({ ...filters, level: v === "__all__" ? "" : v })}
      >
        <SelectTrigger className="h-9 sm:h-8 text-xs w-full sm:w-36 border-border cursor-pointer hover:bg-zinc-200">
          <SelectValue placeholder="Nível" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">Todos os níveis</SelectItem>
          {STUDENT_LEVELS.map((lvl) => (
            <SelectItem className="cursor-pointer" key={lvl} value={lvl}>{lvl}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Status */}
      <Select
        value={filters.status || "__all__"}
        onValueChange={(v) => onChange({ ...filters, status: v === "__all__" ? "" : v })}
      >
        <SelectTrigger className="h-9 sm:h-8 text-xs w-full sm:w-32 border-border cursor-pointer hover:bg-zinc-200">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">Todos os status</SelectItem>
          {STATUS_OPTIONS.map((s) => (
            <SelectItem className="cursor-pointer" key={s.value} value={s.value}>{s.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasActive && (
        <button
          onClick={() => onChange(EMPTY_FILTERS)}
          className="flex items-center justify-center sm:justify-start gap-1 text-xs text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors ml-1 h-9 sm:h-auto"
        >
          <X className="w-3 h-3" />
          Limpar
        </button>
      )}
    </div>
  )
}

// ─── Main content ─────────────────────────────────────────────────────────────

export function AdminLessonsContent() {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)

  // Modal state
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [defaultDateTime, setDefaultDateTime] = useState("")

  const { data: lessons = [], isLoading } = useAdminLessonsByMonth(year, month)

  // Apply filters client-side
  const filtered = useMemo(() => {
    return lessons.filter((l) => {
      if (filters.professorId && l.professorId !== filters.professorId) return false
      if (filters.level      && l.level !== filters.level)               return false
      if (filters.status     && l.status !== filters.status)             return false
      return true
    })
  }, [lessons, filters])

  // Group filtered lessons by day-of-month
  const byDay = useMemo(() => {
    const map: Record<number, LessonDocument[]> = {}
    for (const lesson of filtered) {
      const d = new Date(lesson.dateTime).getDate()
      if (!map[d]) map[d] = []
      map[d].push(lesson)
    }
    for (const d of Object.keys(map)) {
      map[Number(d)].sort((a, b) => a.dateTime.localeCompare(b.dateTime))
    }
    return map
  }, [filtered])

  const cells = buildCalendarGrid(year, month)

  function prevMonth() {
    if (month === 0) { setYear((y) => y - 1); setMonth(11) }
    else setMonth((m) => m - 1)
  }

  function nextMonth() {
    if (month === 11) { setYear((y) => y + 1); setMonth(0) }
    else setMonth((m) => m + 1)
  }

  function handleDayClick(day: number) {
    setSelectedDay(day)
    setDefaultDateTime(toDatetimeInput(year, month, day))
  }

  function handleCreateFromDay() {
    setSelectedDay(null)
    setCreateModalOpen(true)
  }

  return (
    <div className="p-4 lg:p-8 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-zinc-800 dark:text-zinc-100">Grade de Aulas</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Gerencie a grade mensal de aulas</p>
        </div>
        <Button
          onClick={() => { setDefaultDateTime(toDatetimeInput(year, month, today.getDate())); setCreateModalOpen(true) }}
          className="bg-brand hover:bg-brand-dark text-white gap-2 cursor-pointer w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          Criar Aula
        </Button>
      </div>

      {/* Filters */}
      <FiltersBar filters={filters} onChange={setFilters} />

      {/* Month navigation */}
      <div className="flex items-center justify-between sm:justify-start w-full sm:w-auto gap-3 py-2">
        <div className="flex items-center gap-3">
          <button
            onClick={prevMonth}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors cursor-pointer"
            aria-label="Mês anterior"
          >
            <ChevronLeft className="w-5 h-5 text-zinc-500" />
          </button>
          <span className="text-base font-semibold text-zinc-800 dark:text-zinc-100 min-w-[140px] text-center capitalize">
            {MONTHS_PT[month]} {year}
          </span>
          <button
            onClick={nextMonth}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors cursor-pointer"
            aria-label="Próximo mês"
          >
            <ChevronRight className="w-5 h-5 text-zinc-500" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          {isLoading && <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />}
          {Object.values(filters).some(Boolean) && (
            <span className="text-xs text-brand font-medium hidden sm:inline-block">
              {filtered.length} de {lessons.length} aulas
            </span>
          )}
        </div>
      </div>

      {/* Calendar grid */}
      <div className="-mx-4 px-4 lg:mx-0 lg:px-0 pb-4">
        <div className="w-full">
          {/* Weekday headers for desktop only */}
          <div className="hidden lg:grid grid-cols-7 gap-1.5 mb-1.5">
            {WEEKDAYS.map((wd) => (
              <div key={wd} className="text-center text-xs font-medium text-zinc-400 py-1">
                {wd}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-2 lg:grid-cols-7 lg:gap-1.5">
            {cells.map((day, idx) => (
              <DayCell
                key={idx}
                day={day}
                weekdayLabel={WEEKDAYS[idx % 7]}
                lessons={day !== null ? (byDay[day] ?? []) : []}
                isToday={
                  day !== null &&
                  day === today.getDate() &&
                  month === today.getMonth() &&
                  year === today.getFullYear()
                }
                onClick={() => day !== null && handleDayClick(day)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Day detail modal */}
      {selectedDay !== null && (
        <DayDetailModal
          open={selectedDay !== null}
          onOpenChange={(v) => { if (!v) setSelectedDay(null) }}
          day={selectedDay}
          month={month}
          year={year}
          lessons={byDay[selectedDay] ?? []}
          onCreateLesson={handleCreateFromDay}
        />
      )}

      {/* Create lesson modal */}
      <CreateLessonModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        defaultDateTime={defaultDateTime}
      />
    </div>
  )
}
