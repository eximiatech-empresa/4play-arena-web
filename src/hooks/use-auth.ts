"use client"

import { useMutation } from "@tanstack/react-query"
import { useRouter } from "next/navigation"

import type { LoginInput, RegisterInput } from "@/core/entities/auth"
import { authService } from "@/lib/auth"

export function useLogin() {
  const router = useRouter()

  return useMutation({
    mutationFn: async (input: LoginInput) => {
      const result = await authService.signInWithPassword({
        email: input.email,
        password: input.password,
      })
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
    onSuccess: () => {
      router.replace("/dashboard")
    },
  })
}

export function useRegister() {
  const router = useRouter()

  return useMutation({
    mutationFn: async (input: RegisterInput) => {
      const result = await authService.signUp({
        email: input.email,
        password: input.password,
        options: { data: { name: input.name } },
      })
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
    onSuccess: () => {
      router.replace("/dashboard")
    },
  })
}
