"use client"

import { useState } from "react"
import { ClipboardList, Loader2 } from "lucide-react"
import { useLessons } from "@/features/student/aulas/hooks/use-lessons"
import { useCurrentUser } from "@/hooks/use-current-user"
import { ViewToggle } from "@/components/shared/view-toggle"
import { LessonCard } from "@/components/shared/lesson-card"
import { ClassManagementModal } from "./class-management-modal"
import type { Lesson } from "@/core/entities/lesson"
import { cn } from "@/lib/utils"

export function ClassManagementContent() {
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  const { data: currentUser } = useCurrentUser()
  const { data: lessons, isLoading } = useLessons(
    { professorId: currentUser?.uid },
    { enabled: !!currentUser?.uid },
  )

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

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
          <Loader2 className="w-8 h-8 animate-spin mb-2" />
          <p className="text-sm">Carregando suas aulas...</p>
        </div>
      ) : lessons && lessons.length > 0 ? (
        <div
          className={cn(
            "gap-4",
            viewMode === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
              : "flex flex-col",
          )}
        >
          {lessons.map((lesson) => (
            <LessonCard
              key={lesson.id}
              lesson={lesson}
              isTeacherView={true}
              onClick={(l) => setSelectedLesson(l)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 border-2 border-dashed border-zinc-100 rounded-2xl">
          <p className="text-zinc-500">Você não possui nenhuma aula agendada no momento.</p>
        </div>
      )}

      {selectedLesson && (
        <ClassManagementModal
          lesson={selectedLesson}
          onClose={() => setSelectedLesson(null)}
        />
      )}
    </div>
  )
}
