"use client"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getAllUsers, updateUserActiveStatus, updateTeacherLessonPrice, updateUserRole, updateStudentLevel, adjustStudentWallet } from "@/lib/firebase/firestore"
import { getFirebaseAuth } from "@/lib/firebase/auth"
import { getStudentTransactions } from "@/lib/firebase/transactions"
import { createStaffUser, type CreateStaffUserInput } from "@/app/actions/create-staff-user"

const QUERY_KEY = ["users"] as const

export { type UserListItem } from "@/lib/firebase/firestore"

export function useUsers() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: getAllUsers,
    staleTime: 2 * 60 * 1000,
  })
}

export function useCreateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateStaffUserInput) => {
      const idToken = await getFirebaseAuth().currentUser?.getIdToken()
      if (!idToken) throw new Error("Sessão expirada. Faça login novamente.")
      return createStaffUser({ ...input, idToken })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

export function useSetUserStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ uid, isActive }: { uid: string; isActive: boolean }) =>
      updateUserActiveStatus(uid, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ uid, role }: { uid: string; role: string }) => updateUserRole(uid, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

export function useUpdateLessonPrice() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ uid, lessonPrice }: { uid: string; lessonPrice: number }) =>
      updateTeacherLessonPrice(uid, lessonPrice),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

export function useUpdateStudentLevel() {
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: ["audit-logs"] })
    },
  })
}

export function useStudentTransactions(studentId: string | null) {
  return useQuery({
    queryKey: ["student-transactions", studentId] as const,
    queryFn: () => getStudentTransactions(studentId!),
    enabled: !!studentId,
    staleTime: 30 * 1000,
  })
}

export function useAdjustStudentWallet() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: {
      studentId: string
      studentName?: string
      plays: number
      currentBalance?: number
      note: string
      planId?: string
      renewDays?: number
      actorId?: string
      actorName?: string
    }) => adjustStudentWallet(input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: ["wallet"] })
      queryClient.invalidateQueries({ queryKey: ["audit-logs"] })
      queryClient.invalidateQueries({
        queryKey: ["student-transactions", variables.studentId],
      })
    },
  })
}
