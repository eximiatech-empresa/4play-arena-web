// src/hooks/use-current-user.ts
"use client"
import { useQuery } from "@tanstack/react-query"
import { waitForAuthInit } from "@/lib/firebase/auth"
import { getUserDocument } from "@/lib/firebase/firestore"
import type { User } from "@/core/entities/user"

export function useCurrentUser() {
  return useQuery<User | null>({
    queryKey: ["currentUser"],
    queryFn: async () => {
      const fbUser = await waitForAuthInit()
      if (!fbUser) return null
      
      return getUserDocument(fbUser.uid)
    },
    staleTime: 5 * 60 * 1000,
  })
}