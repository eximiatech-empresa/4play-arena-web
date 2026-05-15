"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { getTeacherClass, upsertTeacherClass } from "@/lib/firebase/teacher-class"
import type { TeacherClass } from "@/lib/firebase/teacher-class"

const key = (teacherId: string) => ["teacher-class", teacherId]

export function useTeacherClass(teacherId: string | undefined) {
  return useQuery({
    queryKey: key(teacherId ?? ""),
    queryFn: () => getTeacherClass(teacherId!),
    enabled: !!teacherId,
    staleTime: 2 * 60 * 1000,
  })
}

export function useUpdateTeacherClass(teacherId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (updates: Partial<Omit<TeacherClass, "teacherId" | "updatedAt">>) =>
      upsertTeacherClass(teacherId!, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: key(teacherId ?? "") })
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Erro ao atualizar turma")
    },
  })
}
