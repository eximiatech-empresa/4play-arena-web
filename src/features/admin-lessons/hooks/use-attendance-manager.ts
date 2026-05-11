"use client"

import { useState, useMemo } from "react"
import { toast } from "sonner"
import { useStudents } from "@/features/users-management/hooks/use-students"
import { useMarkAttendance } from "@/features/class-management/hooks/use-class-management"
import { getAttendanceStatus, computeAttendanceSummary } from "@/core/math/attendance-calculator"
import type { AttendanceStatus, AttendanceStudent, AttendanceSummary } from "@/core/entities/attendance"
import type { LessonDocument } from "@/core/entities/lesson"

export type { AttendanceStatus, AttendanceStudent, AttendanceSummary }

export interface UseAttendanceManagerResult {
  students: AttendanceStudent[]
  summary: AttendanceSummary
  isLoadingStudents: boolean
  handleMark: (studentId: string, status: AttendanceStatus) => void
}

/**
 * Encapsulates the optimistic local-attendance state and the fire-and-forget
 * mutation that persists it. The component only needs to call `handleMark` and
 * render the returned `students` array.
 */
export function useAttendanceManager(lesson: LessonDocument): UseAttendanceManagerResult {
  const [localAttendance, setLocalAttendance] = useState<Record<string, AttendanceStatus>>({})

  const { data: studentsData = [], isLoading: isLoadingStudents } = useStudents(
    lesson.enrolledStudentIds,
  )
  const { mutate: markAttendance } = useMarkAttendance()

  const students = useMemo<AttendanceStudent[]>(() => {
    return lesson.enrolledStudentIds.map((id) => {
      const info = studentsData.find((s) => s.id === id)
      const persistedStatus = getAttendanceStatus(
        id,
        lesson.checkedInStudentIds,
        lesson.absentStudentIds,
      )

      return {
        id,
        name: info
          ? info.name
          : isLoadingStudents
          ? "Carregando..."
          : `Aluno (${id.slice(0, 6)}…)`,
        status: localAttendance[id] ?? persistedStatus,
      }
    })
  }, [lesson, studentsData, isLoadingStudents, localAttendance])

  const summary = computeAttendanceSummary(students)

  function handleMark(studentId: string, status: AttendanceStatus) {
    setLocalAttendance((prev) => ({ ...prev, [studentId]: status }))
    markAttendance(
      { lessonId: lesson.id, studentId, status: status === "pending" ? "none" : status },
      {
        onSuccess: () => {
          if (status === "present") toast.success("Presença confirmada")
          else if (status === "absent") toast.info("Falta registrada")
          else toast.info("Status resetado")
        },
        onError: () => toast.error("Erro ao atualizar presença"),
      },
    )
  }

  return { students, summary, isLoadingStudents, handleMark }
}
