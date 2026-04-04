// src/features/booking/hooks/use-lessons.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { MOCK_LESSONS } from "@/features/booking/mock-data"
import type { Lesson } from "@/core/entities/lesson"

const LESSONS_QUERY_KEY = ["lessons"] as const

export interface LessonFilters {
  professorId?: string
  level?: string
  availableOnly?: boolean
}

function fetchLessons(filters?: LessonFilters): Promise<Lesson[]> {
  // TODO (Supabase): Replace with real API call
  return new Promise((resolve) => {
    setTimeout(() => {
      let lessons = structuredClone(MOCK_LESSONS)

      if (filters?.professorId) {
        lessons = lessons.filter((l) => l.professorId === filters.professorId)
      }
      if (filters?.level) {
        lessons = lessons.filter((l) => l.level === filters.level)
      }
      if (filters?.availableOnly) {
        lessons = lessons.filter(
          (l) => l.enrolledCount < l.totalSpots || l.isEnrolled
        )
      }

      resolve(lessons)
    }, 300)
  })
}

function enrollInLesson(lessonId: string): Promise<Lesson> {
  // TODO (Supabase): Replace with real API call
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const lesson = MOCK_LESSONS.find((l) => l.id === lessonId)
      if (!lesson) {
        reject(new Error("Aula não encontrada"))
        return
      }
      if (lesson.enrolledCount >= lesson.totalSpots) {
        reject(new Error("Turma lotada"))
        return
      }
      resolve({
        ...lesson,
        enrolledCount: lesson.enrolledCount + 1,
        isEnrolled: true,
      })
    }, 500)
  })
}

function checkInToLesson(lessonId: string): Promise<Lesson> {
  // TODO (Supabase): Replace with real API call
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const lesson = MOCK_LESSONS.find((l) => l.id === lessonId)
      if (!lesson) {
        reject(new Error("Aula não encontrada"))
        return
      }
      resolve({ ...lesson, checkInStatus: "done" })
    }, 800)
  })
}

export function useLessons(filters?: LessonFilters) {
  return useQuery({
    queryKey: [...LESSONS_QUERY_KEY, filters],
    queryFn: () => fetchLessons(filters),
  })
}

export function useEnrollLesson() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: enrollInLesson,
    onSuccess: (updatedLesson) => {
      queryClient.setQueriesData<Lesson[]>(
        { queryKey: LESSONS_QUERY_KEY },
        (old) => {
          if (!old) return old
          return old.map((l) =>
            l.id === updatedLesson.id ? updatedLesson : l
          )
        }
      )
    },
  })
}

export function useCheckIn() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: checkInToLesson,
    onSuccess: (updatedLesson) => {
      queryClient.setQueriesData<Lesson[]>(
        { queryKey: LESSONS_QUERY_KEY },
        (old) => {
          if (!old) return old
          return old.map((l) =>
            l.id === updatedLesson.id ? updatedLesson : l
          )
        }
      )
    },
  })
}
