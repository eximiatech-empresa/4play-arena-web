"use client"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { LESSONS_QUERY_KEY } from "@/features/booking/hooks/use-lessons"
import {
  updateStudentAttendance,
  cancelLesson,
  rescheduleLesson,
} from "@/lib/firebase/booking"
import type { Lesson } from "@/core/entities/lesson"

export function useUpdateAttendance() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      lessonId,
      studentId,
      action,
    }: {
      lessonId: string
      studentId: string
      action: "checkin" | "undo"
    }) => updateStudentAttendance(lessonId, studentId, action),

    onSuccess: (_data, { lessonId, studentId, action }) => {
      queryClient.setQueriesData<Lesson[]>({ queryKey: LESSONS_QUERY_KEY }, (old) => {
        if (!old) return old
        return old.map((l) => {
          if (l.id !== lessonId) return l
          const updated =
            action === "checkin"
              ? [...new Set([...l.checkedInStudentIds, studentId])]
              : l.checkedInStudentIds.filter((id) => id !== studentId)
          return { ...l, checkedInStudentIds: updated }
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
      // Mark as cancelled in cache — card stays visible with red style
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
      // Update dateTime and mark as rescheduled in cache — card stays visible with amber style
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
