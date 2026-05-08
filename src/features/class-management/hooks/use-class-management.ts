"use client"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { LESSONS_QUERY_KEY } from "@/features/booking/hooks/use-lessons"
import { STUDENT_HISTORY_QUERY_KEY } from "@/features/booking/hooks/use-student-history"
import {
  markStudentAttendance,
  cancelLesson,
  rescheduleLesson,
  finishLesson,
} from "@/lib/firebase/booking"
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

          let checkedIn = [...l.checkedInStudentIds]
          let absent = [...l.absentStudentIds]

          if (status === "present") {
            checkedIn = [...new Set([...checkedIn, studentId])]
            absent = absent.filter((id) => id !== studentId)
          } else if (status === "absent") {
            absent = [...new Set([...absent, studentId])]
            checkedIn = checkedIn.filter((id) => id !== studentId)
          } else {
            checkedIn = checkedIn.filter((id) => id !== studentId)
            absent = absent.filter((id) => id !== studentId)
          }

          return { ...l, checkedInStudentIds: checkedIn, absentStudentIds: absent }
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
