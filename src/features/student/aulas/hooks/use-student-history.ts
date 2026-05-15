"use client"
import { useQuery } from "@tanstack/react-query"
import { useCurrentUser } from "@/hooks/use-current-user"
import { getStudentLessonHistory } from "@/lib/firebase/booking"
import type { LessonHistoryEntry } from "@/core/entities/lesson"

export type { LessonHistoryEntry }

export const STUDENT_HISTORY_QUERY_KEY = ["student-history"] as const

export function useStudentHistory() {
  const { data: currentUser } = useCurrentUser()
  const studentId = currentUser?.role === "STUDENT" ? currentUser.uid : undefined

  return useQuery({
    queryKey: [...STUDENT_HISTORY_QUERY_KEY, studentId],
    queryFn: () => getStudentLessonHistory(studentId!),
    enabled: !!studentId,
    staleTime: 3 * 60 * 1000,
  })
}
