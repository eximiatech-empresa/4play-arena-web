"use client"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { LESSONS_QUERY_KEY } from "@/features/student/aulas/hooks/use-lessons"
import { STUDENT_HISTORY_QUERY_KEY } from "@/features/student/aulas/hooks/use-student-history"
import {
  markStudentAttendance,
  cancelLesson,
  rescheduleLesson,
  finishLesson,
} from "@/lib/firebase/booking"
import { applyAttendanceChange } from "@/core/math/attendance-calculator"
import type { Lesson } from "@/core/entities/lesson"

export function useMarkAttendance() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      lessonId,
      studentId,
      status,
    }: {
      lessonId: string
      studentId: string
      status: "present" | "absent" | "none"
    }) => markStudentAttendance(lessonId, studentId, status),

    onSuccess: (_data, { lessonId, studentId, status }) => {
      queryClient.setQueriesData<Lesson[]>({ queryKey: LESSONS_QUERY_KEY }, (old) => {
        if (!old) return old
        return old.map((l) => {
          if (l.id !== lessonId) return l
          const updated = applyAttendanceChange(
            l.checkedInStudentIds,
            l.absentStudentIds,
            studentId,
            status,
          )
          return { ...l, ...updated }
        })
      })
    },
  })
}

export function useCancelLesson() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ lessonId, reason }: { lessonId: string; reason: string }) =>
      cancelLesson(lessonId, reason),

    onSuccess: (_data, { lessonId }) => {
      queryClient.setQueriesData<Lesson[]>({ queryKey: LESSONS_QUERY_KEY }, (old) =>
        old
          ? old.map((l) => (l.id === lessonId ? { ...l, status: "cancelled" as const } : l))
          : old,
      )
      queryClient.invalidateQueries({ queryKey: ["wallet"] })
    },
  })
}

export function useRescheduleLesson() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ lessonId, newDateTimeISO }: { lessonId: string; newDateTimeISO: string }) =>
      rescheduleLesson(lessonId, newDateTimeISO),

    onSuccess: (_data, { lessonId, newDateTimeISO }) => {
      queryClient.setQueriesData<Lesson[]>({ queryKey: LESSONS_QUERY_KEY }, (old) => {
        if (!old) return old
        return old.map((l) =>
          l.id === lessonId ? { ...l, dateTime: newDateTimeISO, wasRescheduled: true } : l,
        )
      })
      queryClient.invalidateQueries({ queryKey: ["lessons", "by-date"] })
    },
  })
}

export function useFinishLesson() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ lessonId }: { lessonId: string }) => finishLesson(lessonId),

    onSuccess: (_data, { lessonId }) => {
      queryClient.setQueriesData<Lesson[]>({ queryKey: LESSONS_QUERY_KEY }, (old) =>
        old
          ? old.map((l) => (l.id === lessonId ? { ...l, status: "finished" as const } : l))
          : old,
      )
      queryClient.invalidateQueries({ queryKey: STUDENT_HISTORY_QUERY_KEY })
    },
  })
}
