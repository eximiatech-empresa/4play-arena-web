"use client"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getAllUsers, updateUserActiveStatus } from "@/lib/firebase/firestore"
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
