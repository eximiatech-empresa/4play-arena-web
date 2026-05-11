"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { LevelBadge } from "@/components/shared/level-badge"
import {
  ArrowLeft,
  Plus,
  ClipboardList,
  Clock,
  Users,
  MapPin,
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Eye,
  CalendarClock,
  UserCircle2,
  Check,
  X,
} from "lucide-react"
import { useDeleteLesson } from "../hooks/use-admin-lessons"
import { useAttendanceManager, type AttendanceStatus } from "../hooks/use-attendance-manager"
import type { LessonDocument } from "@/core/entities/lesson"
import { cn } from "@/lib/utils"
import { LESSON_STATUS_PILL, LESSON_STATUS_LABEL } from "../constants"

const PAGE_SIZE = 3

type View = "actions" | "details" | "lesson-detail"

// ─── Lesson row (in paginated list) ──────────────────────────────────────────

function LessonRow({
  lesson,
  onViewDetail,
}: {
  lesson: LessonDocument
  onViewDetail: () => void
}) {
  const [confirming, setConfirming] = useState(false)
  const { mutate: del, isPending: deleting } = useDeleteLesson()

  return (
    <li className="flex items-start gap-3 p-3 rounded-lg border border-border bg-background">
      <button onClick={onViewDetail} className="flex-1 min-w-0 text-left group">
        <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100 truncate group-hover:text-brand transition-colors cursor-pointer">
          {lesson.description ?? lesson.level}
        </p>
        <div className="mt-1.5 flex flex-wrap gap-3 text-xs text-zinc-500">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {new Date(lesson.dateTime).toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {lesson.enrolledStudentIds.length}/{lesson.totalSpots}
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" />
            {lesson.court}
          </span>
        </div>
        <div className="mt-1 flex gap-2 text-xs">
          <span className="text-zinc-400">{lesson.professorName}</span>
          <span className="text-zinc-300 dark:text-zinc-600">·</span>
          <span className="text-zinc-400">{lesson.level}</span>
        </div>
      </button>

      <div className="shrink-0 flex flex-col items-end gap-2">
        <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", LESSON_STATUS_PILL[lesson.status] ?? LESSON_STATUS_PILL.scheduled)}>
          {LESSON_STATUS_LABEL[lesson.status] ?? lesson.status}
        </span>
        <div className="flex items-center gap-0.5">
          <button
            onClick={onViewDetail}
            title="Ver detalhes"
            className="p-1 text-zinc-300 hover:text-brand dark:text-zinc-600 dark:hover:text-brand transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          {!confirming ? (
            <button
              onClick={() => setConfirming(true)}
              title="Excluir"
              className="p-1 text-zinc-300 hover:text-red-500 dark:text-zinc-600 dark:hover:text-red-400 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          ) : (
            <div className="flex items-center gap-1 ml-1">
              <button onClick={() => setConfirming(false)} disabled={deleting} className="text-xs text-zinc-400 hover:text-zinc-600 px-1">
                Não
              </button>
              <button
                onClick={() => del(lesson.id, { onSuccess: () => setConfirming(false) })}
                disabled={deleting}
                className="text-xs text-red-500 hover:text-red-700 font-medium px-1 flex items-center gap-0.5"
              >
                {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : "Excluir"}
              </button>
            </div>
          )}
        </div>
      </div>
    </li>
  )
}

// ─── Attendance student row ───────────────────────────────────────────────────

function StudentRow({
  student,
  onMark,
}: {
  student: { id: string; name: string; status: AttendanceStatus }
  onMark: (id: string, s: AttendanceStatus) => void
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-background">
      <div className="flex items-center gap-3">
        <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-zinc-400 font-bold text-xs shrink-0">
          {student.name.charAt(0).toUpperCase()}
        </div>
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200 truncate max-w-[160px]">
          {student.name}
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {student.status === "pending" ? (
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={() => onMark(student.id, "absent")}
              className="w-7 h-7 rounded-full border-red-100 text-red-500 hover:bg-red-50 hover:border-red-300"
            >
              <X className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onMark(student.id, "present")}
              className="w-7 h-7 rounded-full border-emerald-100 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-300"
            >
              <Check className="w-3.5 h-3.5" />
            </Button>
          </div>
        ) : (
          <>
            <span className={cn(
              "flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold border",
              student.status === "present"
                ? "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/40"
                : "bg-red-50 text-red-600 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/40",
            )}>
              {student.status === "present"
                ? <><Check className="w-3 h-3" />Presente</>
                : <><X className="w-3 h-3" />Faltou</>}
            </span>
            <button onClick={() => onMark(student.id, "pending")} className="text-[10px] text-zinc-400 hover:text-zinc-600 underline">
              Desfazer
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Lesson detail view (embedded — no nested Dialog) ────────────────────────

function LessonDetailView({
  lesson,
  onBack,
}: {
  lesson: LessonDocument
  onBack: () => void
}) {
  const { students, summary, isLoadingStudents, handleMark } = useAttendanceManager(lesson)
  const { presentCount, absentCount, pendingCount } = summary

  const lessonDate    = new Date(lesson.dateTime)
  const formattedDate = lessonDate.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })
  const formattedTime = lessonDate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })

  return (
    <div className="space-y-4 py-1">
      {/* Back */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Voltar para lista
      </button>

      {/* Title + level */}
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 leading-snug">
          {lesson.description ?? lesson.level}
        </p>
        <LevelBadge level={lesson.level} />
      </div>

      {/* Info grid */}
      <div className="space-y-2 p-3 rounded-xl border border-border bg-muted/30 text-xs">
        {[
          { icon: CalendarClock, label: "Data",      value: formattedDate },
          { icon: Clock,         label: "Horário",   value: formattedTime },
          { icon: UserCircle2,   label: "Professor", value: lesson.professorName },
          { icon: MapPin,        label: "Quadra",    value: lesson.court },
          { icon: Users,         label: "Vagas",     value: `${lesson.enrolledStudentIds.length} / ${lesson.totalSpots}` },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-center gap-2">
            <Icon className="w-3.5 h-3.5 text-brand shrink-0" />
            <span className="text-zinc-500 w-20 shrink-0">{label}</span>
            <span className="text-zinc-800 dark:text-zinc-100 font-medium">{value}</span>
          </div>
        ))}
        <div className="flex items-center gap-2 pt-0.5">
          <span className="text-zinc-500 w-20 shrink-0 pl-5.5">Status</span>
          <span className={cn("px-2 py-0.5 rounded-full text-[11px] font-medium", LESSON_STATUS_PILL[lesson.status] ?? LESSON_STATUS_PILL.scheduled)}>
            {LESSON_STATUS_LABEL[lesson.status] ?? lesson.status}
          </span>
        </div>
      </div>

      {/* Attendance summary */}
      {lesson.enrolledStudentIds.length > 0 && (
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          {[
            { count: presentCount, label: "Presentes", cls: "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/30" },
            { count: absentCount,  label: "Faltas",    cls: "bg-red-50 text-red-600 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30" },
            { count: pendingCount, label: "Pendentes", cls: "bg-muted text-zinc-500 border-border" },
          ].map(({ count, label, cls }) => (
            <div key={label} className={cn("rounded-xl border p-2.5", cls)}>
              <p className="text-xl font-bold leading-none">{count}</p>
              <p className="font-medium mt-1">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Student list */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-0.5">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            Lista de Chamada ({students.length})
          </span>
          {isLoadingStudents && <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-400" />}
        </div>

        {students.length === 0 ? (
          <div className="text-center py-6 rounded-xl border border-dashed border-border">
            <Users className="w-5 h-5 text-zinc-300 mx-auto mb-1" />
            <p className="text-xs text-zinc-400">Nenhum aluno inscrito.</p>
          </div>
        ) : (
          <div className="space-y-1.5 max-h-[260px] overflow-y-auto pr-0.5">
            {students.map((s) => (
              <StudentRow key={s.id} student={s} onMark={handleMark} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main modal ───────────────────────────────────────────────────────────────

interface DayDetailModalProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  day: number
  month: number
  year: number
  lessons: LessonDocument[]
  onCreateLesson: () => void
}

export function DayDetailModal({
  open,
  onOpenChange,
  day,
  month,
  year,
  lessons,
  onCreateLesson,
}: DayDetailModalProps) {
  const [view, setView] = useState<View>("actions")
  const [page, setPage] = useState(1)
  const [detailLesson, setDetailLesson] = useState<LessonDocument | null>(null)

  useEffect(() => {
    if (open) {
      setView("actions")
      setPage(1)
      setDetailLesson(null)
    }
  }, [open])

  const totalPages = Math.max(1, Math.ceil(lessons.length / PAGE_SIZE))
  const pageLessons = lessons.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const dateLabel = new Date(year, month, day).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  })

  function handleCreate() {
    onOpenChange(false)
    onCreateLesson()
  }

  function openDetail(lesson: LessonDocument) {
    setDetailLesson(lesson)
    setView("lesson-detail")
  }

  function backFromDetail() {
    setDetailLesson(null)
    setView("details")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {view === "details" && (
              <button
                onClick={() => { setView("actions"); setPage(1) }}
                className="p-1 rounded hover:bg-muted transition-colors text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <DialogTitle className="capitalize leading-snug">{dateLabel}</DialogTitle>
          </div>
        </DialogHeader>

        {/* ── Actions view ─────────────────────────────────────────────── */}
        {view === "actions" && (
          <div className="space-y-3 py-2">
            {lessons.length > 0 && (
              <p className="text-sm text-zinc-500">
                {lessons.length} {lessons.length === 1 ? "aula" : "aulas"} neste dia
              </p>
            )}
            <Button onClick={handleCreate} className="w-full bg-brand hover:bg-brand-dark text-white gap-2">
              <Plus className="w-4 h-4" />
              Criar Aula
            </Button>
            <Button
              variant="outline"
              onClick={() => setView("details")}
              disabled={lessons.length === 0}
              className="w-full gap-2"
            >
              <ClipboardList className="w-4 h-4" />
              {lessons.length === 0
                ? "Sem aulas neste dia"
                : `Ver ${lessons.length} ${lessons.length === 1 ? "aula" : "aulas"}`}
            </Button>
          </div>
        )}

        {/* ── Details view (paginated list) ────────────────────────────── */}
        {view === "details" && (
          <div className="space-y-3 py-2">
            <ul className="space-y-2 min-h-[180px]">
              {pageLessons.map((lesson) => (
                <LessonRow key={lesson.id} lesson={lesson} onViewDetail={() => openDetail(lesson)} />
              ))}
            </ul>

            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded hover:bg-muted disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 text-zinc-500" />
                </button>
                <span className="text-xs text-zinc-400">{page} / {totalPages}</span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1.5 rounded hover:bg-muted disabled:opacity-40 transition-colors"
                >
                  <ChevronRight className="w-4 h-4 text-zinc-500" />
                </button>
              </div>
            )}

            <Button onClick={handleCreate} className="w-full bg-brand hover:bg-brand-dark text-white gap-2">
              <Plus className="w-4 h-4" />
              Criar Aula para este dia
            </Button>
          </div>
        )}

        {/* ── Lesson detail view (embedded — single Dialog, no nesting) ── */}
        {view === "lesson-detail" && detailLesson && (
          <LessonDetailView lesson={detailLesson} onBack={backFromDetail} />
        )}
      </DialogContent>
    </Dialog>
  )
}
