"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { getTeacherClass, upsertTeacherClass, syncTeacherClassToLessons } from "@/lib/firebase/teacher-class"
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

export function useSyncTeacherClass(teacherId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const current = await getTeacherClass(teacherId!)
      return syncTeacherClassToLessons(teacherId!, current.titularIds, current.reservaIds)
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: key(teacherId ?? "") })
      toast.success(
        count > 0
          ? `${count} aula${count === 1 ? "" : "s"} sincronizada${count === 1 ? "" : "s"} com sucesso`
          : "Nenhuma aula futura encontrada para sincronizar",
      )
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Erro ao sincronizar aulas")
    },
  })
}

export function useUpdateTeacherClass(teacherId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (updates: Partial<Omit<TeacherClass, "teacherId" | "updatedAt">>) =>
      upsertTeacherClass(teacherId!, updates),
    onSuccess: async (_, variables) => {
      const needsSync = variables.titularIds !== undefined || variables.reservaIds !== undefined

      if (teacherId && needsSync) {
        const cached = queryClient.getQueryData<TeacherClass>(key(teacherId))
        const newTitularIds = variables.titularIds ?? cached?.titularIds ?? []
        const newReservaIds = variables.reservaIds ?? cached?.reservaIds ?? []

        const count = await syncTeacherClassToLessons(teacherId, newTitularIds, newReservaIds)
        toast.success(
          count > 0
            ? `Turma atualizada — ${count} aula${count === 1 ? "" : "s"} sincronizada${count === 1 ? "" : "s"}`
            : "Turma atualizada",
        )
      }

      queryClient.invalidateQueries({ queryKey: key(teacherId ?? "") })
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Erro ao atualizar turma")
    },
  })
}
