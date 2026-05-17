"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { getAllUsers, updateStudentLevel } from "@/lib/firebase/firestore"
import { getStudentAuditLogs } from "@/lib/firebase/audit-logs"

export function useStudents() {
  return useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const all = await getAllUsers()
      return all.filter((u) => u.role === "STUDENT" && u.isActive)
    },
    staleTime: 2 * 60 * 1000,
  })
}

export function useStudentAuditLogs(studentId: string | undefined) {
  return useQuery({
    queryKey: ["audit-logs", "student", studentId],
    queryFn: () => getStudentAuditLogs(studentId!),
    enabled: !!studentId,
    staleTime: 30 * 1000,
  })
}

export function useUpdateLevel() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      studentId,
      previousLevel,
      newLevel,
      actorId,
      actorName,
      studentName,
    }: {
      studentId: string
      previousLevel: string
      newLevel: string
      actorId: string
      actorName: string
      studentName: string
    }) => updateStudentLevel(studentId, previousLevel, newLevel, actorId, actorName, studentName),
    onSuccess: (_, v) => {
      queryClient.invalidateQueries({ queryKey: ["users"] })
      queryClient.invalidateQueries({ queryKey: ["audit-logs", "student", v.studentId] })
      toast.success(`Nível atualizado para ${v.newLevel}`)
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Erro ao atualizar nível")
    },
  })
}
