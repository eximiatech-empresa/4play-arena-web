"use client"
import { useQuery } from "@tanstack/react-query"
import { useCurrentUser } from "@/hooks/use-current-user"
import { getTeacherLessonHistory } from "@/lib/firebase/booking"
import type { TeacherLessonHistoryEntry } from "@/core/entities/lesson"

export type { TeacherLessonHistoryEntry }
export const TEACHER_HISTORY_QUERY_KEY = ["teacher-history"] as const

export function useTeacherHistory() {
  const { data: currentUser } = useCurrentUser()
  const teacherId = currentUser?.role === "TEACHER" ? currentUser.uid : undefined

  return useQuery({
    queryKey: [...TEACHER_HISTORY_QUERY_KEY, teacherId],
    queryFn: () => getTeacherLessonHistory(teacherId!),
    enabled: !!teacherId,
    staleTime: 3 * 60 * 1000,
  })
}
