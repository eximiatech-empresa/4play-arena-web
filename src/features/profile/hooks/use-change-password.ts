"use client"

import { useMutation } from "@tanstack/react-query"
import { updateUserPassword } from "@/lib/firebase/auth"

export function useChangePassword() {
  return useMutation({
    mutationFn: ({
      currentPassword,
      newPassword,
    }: {
      currentPassword: string
      newPassword: string
    }) => updateUserPassword(currentPassword, newPassword),
  })
}
