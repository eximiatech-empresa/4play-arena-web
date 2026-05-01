// src/features/class-management/components/class-management-modal.tsx
"use client"
import { useState } from "react"
import { Clock, Check, X, UserCircle2, CalendarClock, Ban } from "lucide-react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { LevelBadge } from "@/components/shared/level-badge"
import type { Lesson } from "@/core/entities/lesson"

interface ClassManagementModalProps {
  lesson: Lesson | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

type AttendanceStatus = "pending" | "present" | "absent"

export function ClassManagementModal({ lesson, open, onOpenChange }: ClassManagementModalProps) {
  // Lista de alunos mockada para a apresentação
  const [students, setStudents] = useState([
    { id: "1", name: "Guilherme Carvalho", level: "Iniciante", status: "pending" as AttendanceStatus },
    { id: "2", name: "João Silva", level: "Iniciante", status: "present" as AttendanceStatus },
    { id: "3", name: "Maria Souza", level: "Iniciante", status: "absent" as AttendanceStatus },
  ])

  if (!lesson) return null

  const handleAttendance = (studentId: string, newStatus: AttendanceStatus) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, status: newStatus } : s))
    )
  }

  // Ações do Professor
  const handleCancelClass = () => {
    toast.error("Aula cancelada! Os alunos foram notificados e os Plays estornados.")
    onOpenChange(false)
  }

  const handlePostponeClass = () => {
    toast.success("Aula adiada! Um aviso foi enviado para a turma.")
    onOpenChange(false)
  }

  const presentCount = students.filter(s => s.status === "present").length
  const absentCount = students.filter(s => s.status === "absent").length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden bg-white">
        <DialogHeader className="p-6 pb-0">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                Gestão da Aula
                <LevelBadge level={lesson.level} size="sm" />
              </DialogTitle>
              <DialogDescription className="mt-1 flex items-center gap-4 text-xs font-medium">
                <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {new Date(lesson.dateTime).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
                {/* <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {lesson.location}</span> */}
              </DialogDescription>
            </div>
            
            {/* BOTÕES DE ADIAR E CANCELAR AULA */}
            <div className="flex items-center gap-2 w-full sm:w-auto pr-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handlePostponeClass}
                className="flex-1 sm:flex-none text-xs h-8 text-amber-600 border-amber-200 hover:bg-amber-50"
              >
                <CalendarClock className="w-3.5 h-3.5 mr-1.5" /> Adiar
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleCancelClass}
                className="flex-1 sm:flex-none text-xs h-8 text-red-600 border-red-200 hover:bg-red-50"
              >
                <Ban className="w-3.5 h-3.5 mr-1.5" /> Cancelar Aula
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* LISTA DE CHAMADA */}
        <div className="mt-4 border-t border-zinc-100">
          <div className="px-6 py-3 bg-zinc-50 border-b border-zinc-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Lista de Chamada ({students.length})</span>
            <div className="flex items-center gap-3 text-xs font-medium">
              <span className="text-emerald-600">{presentCount} Presentes</span>
              <span className="text-red-500">{absentCount} Faltas</span>
            </div>
          </div>

          <div className="divide-y divide-zinc-100 max-h-[50vh] overflow-y-auto">
            {students.map((student) => (
              <div key={student.id} className="p-4 sm:px-6 flex items-center justify-between gap-4 transition-colors hover:bg-zinc-50/50">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center shrink-0">
                    <UserCircle2 className="w-6 h-6 text-zinc-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-zinc-900 truncate">{student.name}</p>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{student.level}</p>
                  </div>
                </div>

                {/* Botões de Presença/Falta */}
                <div className="flex items-center gap-2 shrink-0">
                  {student.status === "present" ? (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-md text-xs font-semibold border border-emerald-100">
                      <Check className="w-3.5 h-3.5" /> Presente
                    </div>
                  ) : student.status === "absent" ? (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-md text-xs font-semibold border border-red-100">
                      <X className="w-3.5 h-3.5" /> Faltou
                    </div>
                  ) : (
                    <>
                      <Button variant="outline" size="icon" onClick={() => handleAttendance(student.id, "absent")} className="w-8 h-8 rounded-full border-red-100 text-red-500 hover:bg-red-50">
                        <X className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => handleAttendance(student.id, "present")} className="w-8 h-8 rounded-full border-emerald-100 text-emerald-600 hover:bg-emerald-50">
                        <Check className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                  {student.status !== "pending" && (
                    <button onClick={() => handleAttendance(student.id, "pending")} className="text-[10px] text-zinc-400 hover:text-zinc-600 underline ml-2 cursor-pointer">Desfazer</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}