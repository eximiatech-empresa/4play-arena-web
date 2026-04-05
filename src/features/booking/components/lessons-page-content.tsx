"use client"

import { useEffect, useRef, useState } from "react"
import gsap from "gsap"
import { CalendarCheck, Filter } from "lucide-react"
import { useLessons, type LessonFilters } from "@/features/booking/hooks/use-lessons"
import { PROFESSORS, STUDENT_LEVELS } from "@/core/constants/professors"
import { MOCK_STUDENT } from "@/features/profile/mock-data"
import { MOCK_WALLET } from "@/features/wallet/mock-data"
import { LessonCard } from "./lesson-card"
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
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null)

  const activeFilters: LessonFilters = { ...filters, availableOnly }
  const { data: lessons, isLoading } = useLessons(activeFilters)

  const gridRef = useRef<HTMLDivElement>(null)
  const isFirstRender = useRef(true)
  const prevIsLoading = useRef(false)

  // Fade the grid OUT when loading starts (filters changed)
  useEffect(() => {
    if (isLoading && !prevIsLoading.current && gridRef.current) {
      const children = Array.from(gridRef.current.children)
      if (children.length) {
        gsap.to(children, {
          opacity: 0,
          y: -10,
          duration: 0.18,
          ease: "power2.in",
          stagger: 0.03,
        })
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
      // First load: just make visible, no animation
      gsap.set(children, { opacity: 1, y: 0 })
      isFirstRender.current = false
      return
    }

    gsap.fromTo(
      children,
      { opacity: 0, y: 22 },
      {
        opacity: 1,
        y: 0,
        duration: 0.38,
        ease: "power3.out",
        stagger: 0.07,
      }
    )
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessons])

  const showGrid = isLoading || (lessons && lessons.length > 0)
  const showEmpty = !isLoading && (!lessons || lessons.length === 0)

  return (
    <div className="p-4 lg:p-6 pb-24 lg:pb-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-1">
          <CalendarCheck className="w-5 h-5 text-brand" />
          <h1 className="text-xl font-bold text-zinc-800">Aulas</h1>
        </div>
        <p className="text-sm text-zinc-500">Próximas aulas disponíveis para check-in</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-zinc-100 p-4 mb-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Filter
            className={cn(
              "w-3.5 h-3.5 transition-colors duration-200",
              isLoading ? "text-brand animate-pulse" : "text-zinc-400"
            )}
          />
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
            Filtros
          </span>
          {isLoading && (
            <span className="ml-auto text-[10px] font-medium text-brand animate-pulse">
              Filtrando…
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-35">
            <label className="block text-[11px] font-medium text-zinc-400 mb-1.5">
              Professor
            </label>
            <select
              className="w-full text-sm bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-1.5 text-zinc-700 focus:outline-none focus:ring-1 focus:ring-brand"
              value={filters.professorId ?? ""}
              onChange={(e) =>
                setFilters((f) => ({ ...f, professorId: e.target.value || undefined }))
              }
            >
              {PROFESSOR_OPTIONS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-35">
            <label className="block text-[11px] font-medium text-zinc-400 mb-1.5">
              Nível
            </label>
            <select
              className="w-full text-sm bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-1.5 text-zinc-700 focus:outline-none focus:ring-1 focus:ring-brand"
              value={filters.level ?? ""}
              onChange={(e) =>
                setFilters((f) => ({ ...f, level: e.target.value || undefined }))
              }
            >
              {LEVEL_OPTIONS.map((l) => (
                <option key={l} value={l === "Todos" ? "" : l}>
                  {l}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setAvailableOnly((v) => !v)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors",
                availableOnly
                  ? "bg-brand-subtle border-brand/30 text-brand-dark"
                  : "bg-zinc-50 border-zinc-200 text-zinc-500 hover:bg-zinc-100"
              )}
            >
              <span
                className={cn(
                  "w-3 h-3 rounded-full border",
                  availableOnly ? "bg-brand border-brand" : "border-zinc-300"
                )}
              />
              Com vagas
            </button>
          </div>
        </div>
      </div>

      {/* Lessons grid — always mounted when loading or has results so ref stays valid */}
      {showGrid && (
        <div
          ref={gridRef}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-48 rounded-2xl bg-zinc-100 animate-pulse" />
              ))
            : lessons!.map((lesson) => (
                <LessonCard
                  key={lesson.id}
                  lesson={lesson}
                  studentLevelIndex={MOCK_STUDENT.levelIndex}
                  walletBalance={MOCK_WALLET.balance}
                  onClick={() => setSelectedLesson(lesson)}
                />
              ))}
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
        studentLevelIndex={MOCK_STUDENT.levelIndex}
        walletBalance={MOCK_WALLET.balance}
      />
    </div>
  )
}
