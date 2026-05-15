"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  getAdminLessonsByDate,
  getAdminLessonsByMonth,
  createBulkLessons,
  deleteLesson,
} from "@/lib/firebase/admin-lessons"
import type { CreateLessonInput } from "@/core/entities/lesson"
import { LESSONS_QUERY_KEY } from "@/features/student/aulas/hooks/use-lessons"

export const ADMIN_LESSONS_KEY = ["admin-lessons"] as const

export function useAdminLessonsByDate(dateStr: string) {
  return useQuery({
    queryKey: [...ADMIN_LESSONS_KEY, "by-date", dateStr],
    queryFn: () => getAdminLessonsByDate(dateStr),
    enabled: !!dateStr,
    staleTime: 2 * 60 * 1000,
  })
}

export function useAdminLessonsByMonth(year: number, month: number) {
  return useQuery({
    queryKey: [...ADMIN_LESSONS_KEY, "by-month", year, month],
    queryFn: () => getAdminLessonsByMonth(year, month),
    staleTime: 2 * 60 * 1000,
  })
}

export function useCreateLessons() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateLessonInput) => createBulkLessons(data),
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ADMIN_LESSONS_KEY })
      queryClient.invalidateQueries({ queryKey: LESSONS_QUERY_KEY })
      toast.success(`${count} aula(s) criada(s) na grade`)
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Erro ao criar aulas.")
    },
  })
}

export function useDeleteLesson() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (lessonId: string) => deleteLesson(lessonId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_LESSONS_KEY })
      queryClient.invalidateQueries({ queryKey: LESSONS_QUERY_KEY })
      toast.success("Aula excluída")
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Erro ao excluir aula.")
    },
  })
}
