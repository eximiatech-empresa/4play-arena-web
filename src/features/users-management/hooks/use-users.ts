"use client"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getAllUsers, updateUserActiveStatus, updateTeacherLessonPrice, updateUserRole, updateStudentLevel } from "@/lib/firebase/firestore"
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
    mutationFn: (input: CreateStaffUserInput) => createStaffUser(input),
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
