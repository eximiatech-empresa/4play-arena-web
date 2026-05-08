// src/features/class-management/components/class-management-modal.tsx
"use client"
import { useState, useMemo } from "react"
import {
  Clock,
  Check,
  X,
  UserCircle2,
  CalendarClock,
  AlertTriangle,
  Calendar,
  ArrowLeft,
  Loader2,
  Flag,
} from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { LevelBadge } from "@/components/shared/level-badge"
import type { Lesson } from "@/core/entities/lesson"
import { useStudents } from "@/features/users-management/hooks/use-students"
import {
  useMarkAttendance,
  useCancelLesson,
  useRescheduleLesson,
  useFinishLesson,
} from "@/features/class-management/hooks/use-class-management"

interface ClassManagementModalProps {
  lesson: Lesson
  onClose: () => void
}

type AttendanceStatus = "pending" | "present" | "absent"
type ModalView = "attendance" | "confirm-cancel" | "confirm-reschedule" | "confirm-finish"

export function ClassManagementModal({ lesson, onClose }: ClassManagementModalProps) {
  const [view, setView] = useState<ModalView>("attendance")
  const [localAttendance, setLocalAttendance] = useState<Record<string, AttendanceStatus>>({})
  const [cancelReason, setCancelReason] = useState("")
  const [newDateTime, setNewDateTime] = useState("")

  const { data: studentsData, isLoading: isLoadingStudents } = useStudents(lesson.enrolledStudentIds)
  const { mutate: markAttendance } = useMarkAttendance()
  const { mutate: cancelLessonMutation, isPending: isCancelling } = useCancelLesson()
  const { mutate: rescheduleMutation, isPending: isRescheduling } = useRescheduleLesson()
  const { mutate: finishLessonMutation, isPending: isFinishing } = useFinishLesson()

  // Derive each student's status: local override → Firestore checkedIn → Firestore absent → pending
  const students = useMemo(() => {
    return lesson.enrolledStudentIds.map((id: string) => {
      const info = studentsData?.find((s) => s.id === id)
      const firestoreStatus: AttendanceStatus = lesson.checkedInStudentIds.includes(id)
        ? "present"
        : lesson.absentStudentIds.includes(id)
        ? "absent"
        : "pending"

      return {
        id,
        name: info
          ? info.name
          : isLoadingStudents
          ? "Carregando..."
          : `Aluno (${id.slice(0, 5)}…)`,
        status: (localAttendance[id] ?? firestoreStatus) as AttendanceStatus,
      }
    })
  }, [lesson, localAttendance, studentsData, isLoadingStudents])

  function handleAttendance(studentId: string, status: AttendanceStatus) {
    setLocalAttendance((prev) => ({ ...prev, [studentId]: status }))
    markAttendance(
      {
        lessonId: lesson.id,
        studentId,
        status: status === "pending" ? "none" : status,
      },
      { onError: () => toast.error("Erro ao atualizar presença") },
    )
    if (status === "present") toast.success("Presença confirmada")
    else if (status === "absent") toast.info("Falta registrada")
    else toast.info("Status resetado")
  }

  function handleCancelLesson() {
    cancelLessonMutation(
      { lessonId: lesson.id, reason: cancelReason },
      {
        onSuccess: () => {
          toast.success("Aula cancelada. Alunos notificados e Plays reembolsados.")
          onClose()
        },
        onError: (err) =>
          toast.error(err instanceof Error ? err.message : "Erro ao cancelar aula"),
      },
    )
  }

  function handleRescheduleLesson() {
    if (!newDateTime) {
      toast.error("Selecione um novo horário")
      return
    }
    rescheduleMutation(
      { lessonId: lesson.id, newDateTimeISO: newDateTime },
      {
        onSuccess: () => {
          toast.success("Aula reagendada. Alunos notificados.")
          setView("attendance")
          setNewDateTime("")
        },
        onError: (err) =>
          toast.error(err instanceof Error ? err.message : "Erro ao reagendar aula"),
      },
    )
  }

  function handleFinishLesson() {
    finishLessonMutation(
      { lessonId: lesson.id },
      {
        onSuccess: () => {
          toast.success("Aula finalizada. Alunos notificados.")
          onClose()
        },
        onError: (err) =>
          toast.error(err instanceof Error ? err.message : "Erro ao finalizar aula"),
      },
    )
  }

  // ── Derived display values ───────────────────────────────────────────────────
  const lessonDate = new Date(lesson.dateTime)
  const formattedDate = lessonDate.toLocaleDateString("pt-BR")
  const formattedTime = lessonDate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
  const currentDateTimeLocal = lesson.dateTime.slice(0, 16)

  const presentCount  = students.filter((s) => s.status === "present").length
  const absentCount   = students.filter((s) => s.status === "absent").length
  const pendingCount  = students.filter((s) => s.status === "pending").length

  return (
    <Dialog open={true} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden border-none bg-zinc-50/95 backdrop-blur-xl">
        <div className="p-6 space-y-6">

          {/* ── Header ──────────────────────────────────────────────────────── */}
          <DialogHeader className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <DialogTitle className="text-2xl font-bold text-zinc-900">
                  {view === "attendance"          && "Gestão da Aula"}
                  {view === "confirm-cancel"       && "Cancelar Aula"}
                  {view === "confirm-reschedule"   && "Reagendar Aula"}
                  {view === "confirm-finish"       && "Finalizar Aula"}
                </DialogTitle>
                <DialogDescription className="text-zinc-500">
                  {view === "attendance" &&
                    `Lista de presença e ações para a turma de ${lesson.level}`}
                  {view === "confirm-cancel" &&
                    "Esta ação é irreversível e notificará todos os alunos inscritos."}
                  {view === "confirm-reschedule" &&
                    "Escolha a nova data e horário. Os alunos serão notificados automaticamente."}
                  {view === "confirm-finish" &&
                    "Confirme para registrar o encerramento e notificar os alunos."}
                </DialogDescription>
              </div>
              <LevelBadge level={lesson.level} />
            </div>

            {/* Lesson info row */}
            <div className="flex flex-wrap gap-4 p-4 bg-white rounded-xl border border-zinc-200 shadow-sm text-sm">
              <div className="flex items-center gap-2 text-zinc-600">
                <CalendarClock className="w-4 h-4 text-brand" />
                {formattedDate}
              </div>
              <div className="flex items-center gap-2 text-zinc-600">
                <Clock className="w-4 h-4 text-brand" />
                {formattedTime}
              </div>
              <div className="flex items-center gap-2 text-zinc-600">
                <UserCircle2 className="w-4 h-4 text-brand" />
                {lesson.enrolledCount} / {lesson.totalSpots} Alunos
              </div>
            </div>
          </DialogHeader>

          {/* ── Attendance view ──────────────────────────────────────────────── */}
          {view === "attendance" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Lista de Chamada ({students.length})
                </h3>
                {students.length > 0 && (
                  <div className="flex items-center gap-3 text-xs text-zinc-400">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                      {presentCount} presente{presentCount !== 1 && "s"}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
                      {absentCount} falta{absentCount !== 1 && "s"}
                    </span>
                    {pendingCount > 0 && (
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-zinc-300 inline-block" />
                        {pendingCount} pendente{pendingCount !== 1 && "s"}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="grid gap-2">
                {students.length > 0 ? (
                  students.map((student) => (
                    <StudentRow
                      key={student.id}
                      student={student}
                      onMark={handleAttendance}
                    />
                  ))
                ) : (
                  <div className="text-center py-10 bg-zinc-100/50 rounded-xl border-2 border-dashed border-zinc-200">
                    <p className="text-xs text-zinc-400">Nenhum aluno inscrito nesta aula.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Cancel confirmation view ─────────────────────────────────────── */}
          {view === "confirm-cancel" && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-red-50 rounded-xl border border-red-100">
                <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-700">Tem certeza que deseja cancelar?</p>
                  <p className="text-sm text-red-500 mt-1">
                    {lesson.enrolledStudentIds.length > 0
                      ? `${lesson.enrolledStudentIds.length} aluno(s) serão notificados e seus Plays, reembolsados.`
                      : "A aula será marcada como cancelada."}
                  </p>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                  Motivo do cancelamento (opcional)
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  rows={3}
                  placeholder="Ex: Professor indisponível, quadra em manutenção..."
                  className="w-full resize-none rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-brand/40"
                />
              </div>
            </div>
          )}

          {/* ── Reschedule view ──────────────────────────────────────────────── */}
          {view === "confirm-reschedule" && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                  Novo horário
                </label>
                <input
                  type="datetime-local"
                  defaultValue={currentDateTimeLocal}
                  onChange={(e) => setNewDateTime(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-brand/40"
                />
              </div>
              {lesson.enrolledStudentIds.length > 0 && (
                <p className="text-xs text-zinc-500 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {lesson.enrolledStudentIds.length} aluno(s) receberão uma notificação com o novo horário.
                </p>
              )}
            </div>
          )}

          {/* ── Finish confirmation view ─────────────────────────────────────── */}
          {view === "confirm-finish" && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                <Flag className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-emerald-800">Finalizar esta aula?</p>
                  <p className="text-sm text-emerald-700">
                    O status será alterado para <strong>Finalizada</strong> e todos os{" "}
                    {lesson.enrolledStudentIds.length} aluno(s) inscritos receberão uma notificação.
                  </p>
                </div>
              </div>

              {/* Attendance summary */}
              <div className="grid grid-cols-3 gap-3">
                <SummaryCard count={presentCount}  label="Presentes"  color="emerald" />
                <SummaryCard count={absentCount}   label="Faltas"     color="red" />
                <SummaryCard count={pendingCount}  label="Pendentes"  color="zinc" />
              </div>

              {pendingCount > 0 && (
                <p className="text-xs text-amber-600 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {pendingCount} aluno(s) ainda sem presença registrada. Você pode voltar e completar a chamada.
                </p>
              )}
            </div>
          )}
        </div>

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        <div className="p-4 bg-zinc-100/80 border-t border-zinc-200 flex items-center justify-between gap-3">
          <div>
            {view !== "attendance" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setView("attendance")}
                className="text-zinc-500 hover:bg-zinc-200 gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {view === "attendance" && (
              <>
                <Button
                  variant="ghost"
                  onClick={onClose}
                  className="text-zinc-500 hover:bg-zinc-200"
                >
                  Fechar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setView("confirm-reschedule")}
                  className="border-amber-200 text-amber-700 hover:bg-amber-50 gap-1.5"
                >
                  <Calendar className="w-4 h-4" />
                  Adiar Aula
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setView("confirm-cancel")}
                  className="border-red-200 text-red-600 hover:bg-red-50 gap-1.5"
                >
                  <X className="w-4 h-4" />
                  Cancelar Aula
                </Button>
                <Button
                  onClick={() => setView("confirm-finish")}
                  disabled={lesson.status === "finished" || lesson.status === "cancelled"}
                  className="bg-brand hover:bg-brand-dark text-white shadow-lg shadow-brand/20 gap-1.5"
                >
                  <Flag className="w-4 h-4" />
                  Finalizar Aula
                </Button>
              </>
            )}

            {view === "confirm-cancel" && (
              <Button
                onClick={handleCancelLesson}
                disabled={isCancelling}
                className="bg-red-600 hover:bg-red-700 text-white gap-1.5"
              >
                {isCancelling && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirmar Cancelamento
              </Button>
            )}

            {view === "confirm-reschedule" && (
              <Button
                onClick={handleRescheduleLesson}
                disabled={isRescheduling || !newDateTime}
                className="bg-brand hover:bg-brand-dark text-white gap-1.5"
              >
                {isRescheduling && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirmar Novo Horário
              </Button>
            )}

            {view === "confirm-finish" && (
              <Button
                onClick={handleFinishLesson}
                disabled={isFinishing}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
              >
                {isFinishing && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirmar Finalização
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

interface StudentRowProps {
  student: { id: string; name: string; status: AttendanceStatus }
  onMark: (id: string, status: AttendanceStatus) => void
}

function StudentRow({ student, onMark }: StudentRowProps) {
  return (
    <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-zinc-100 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400 font-bold text-xs">
          {student.name.charAt(0)}
        </div>
        <span className="text-sm font-medium text-zinc-700">{student.name}</span>
      </div>

      <div className="flex items-center gap-2">
        {student.status === "pending" ? (
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={() => onMark(student.id, "absent")}
              title="Registrar falta"
              className="w-8 h-8 rounded-full border-red-100 text-red-500 hover:bg-red-50 hover:border-red-300"
            >
              <X className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onMark(student.id, "present")}
              title="Confirmar presença"
              className="w-8 h-8 rounded-full border-emerald-100 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-300"
            >
              <Check className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <>
            {student.status === "present" ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-md text-xs font-semibold border border-emerald-100">
                <Check className="w-3.5 h-3.5" /> Presente
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-md text-xs font-semibold border border-red-100">
                <X className="w-3.5 h-3.5" /> Faltou
              </div>
            )}
            <button
              onClick={() => onMark(student.id, "pending")}
              className="text-[10px] text-zinc-400 hover:text-zinc-600 underline ml-1"
            >
              Desfazer
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function SummaryCard({
  count,
  label,
  color,
}: {
  count: number
  label: string
  color: "emerald" | "red" | "zinc"
}) {
  const styles = {
    emerald: "bg-emerald-50 border-emerald-100 text-emerald-700",
    red:     "bg-red-50 border-red-100 text-red-700",
    zinc:    "bg-zinc-100 border-zinc-200 text-zinc-500",
  }

  return (
    <div className={`flex flex-col items-center p-3 rounded-xl border ${styles[color]}`}>
      <span className="text-2xl font-bold">{count}</span>
      <span className="text-xs font-medium mt-0.5">{label}</span>
    </div>
  )
}
