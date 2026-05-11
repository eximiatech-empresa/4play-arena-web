"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { forceChangePassword } from "@/lib/auth/password-service"

export function useForcePasswordChange() {
  const router = useRouter()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (newPassword: string) => forceChangePassword(newPassword),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["currentUser"] })
      router.replace(data.redirectTo)
    },
  })
}
