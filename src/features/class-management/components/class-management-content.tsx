// src/features/class-management/components/class-management-content.tsx
"use client"
import { useState } from "react"
import { ClipboardList, LayoutGrid, List } from "lucide-react"
import { MOCK_LESSONS } from "@/features/booking/mock-data"
import { LessonCard } from "@/components/shared/lesson-card"
import { ClassManagementModal } from "./class-management-modal"
import type { Lesson } from "@/core/entities/lesson"
import { cn } from "@/lib/utils"

function ViewToggle({
  value,
  onChange,
}: {
  value: "grid" | "list"
  onChange: (v: "grid" | "list") => void
}) {
  return (
    <div className="flex items-center gap-0.5 border border-zinc-200 rounded-lg p-0.5 bg-zinc-50 shrink-0">
      <button
        onClick={() => onChange("grid")}
        title="Visualização em grade"
        className={cn(
          "p-1.5 rounded-md transition-colors",
          value === "grid" ? "bg-white shadow-sm text-zinc-800" : "text-zinc-400 hover:text-zinc-600",
        )}
      >
        <LayoutGrid className="w-4 h-4" />
      </button>
      <button
        onClick={() => onChange("list")}
        title="Visualização em lista"
        className={cn(
          "p-1.5 rounded-md transition-colors",
          value === "list" ? "bg-white shadow-sm text-zinc-800" : "text-zinc-400 hover:text-zinc-600",
        )}
      >
        <List className="w-4 h-4" />
      </button>
    </div>
  )
}

export function ClassManagementContent() {
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  const professorLessons = MOCK_LESSONS

  return (
    <div className="px-5 py-6 lg:px-8 lg:py-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-brand" />
            Minhas Aulas
          </h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            Selecione uma aula para gerenciar a lista de chamada e ações.
          </p>
        </div>
        <ViewToggle value={viewMode} onChange={setViewMode} />
      </div>

      <div
        className={cn(
          "gap-4",
          viewMode === "grid"
            ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
            : "flex flex-col",
        )}
      >
        {professorLessons.map((lesson: Lesson) => (
          <LessonCard
            key={lesson.id}
            lesson={lesson}
            isTeacherView={true}
            onClick={(lesson: Lesson) => setSelectedLesson(lesson)}
          />
        ))}
      </div>

      <ClassManagementModal
        lesson={selectedLesson}
        open={!!selectedLesson}
        onOpenChange={(open) => {
          if (!open) setSelectedLesson(null)
        }}
      />
    </div>
  )
}
