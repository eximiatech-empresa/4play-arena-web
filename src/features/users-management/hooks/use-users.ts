"use client"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getAllUsers, createUserDocument, updateUserActiveStatus } from "@/lib/firebase/firestore"
import type { CreateUserInput } from "@/lib/firebase/firestore"

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
    mutationFn: (input: CreateUserInput) => createUserDocument(input),
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
