"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { getFirebaseAuth } from "@/lib/firebase/auth"
import { updateUserProfile } from "@/lib/firebase/users"

export function useUpdateProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ name, phone }: { name: string; phone?: string }) => {
      const user = getFirebaseAuth().currentUser
      if (!user) throw new Error("Sessão expirada.")
      await updateUserProfile(user.uid, { name, phone })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUser"] })
    },
  })
}
