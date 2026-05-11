"use client"

import { useMutation } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"

import type { LoginInput, RegisterInput } from "@/core/entities/auth"
import { authService } from "@/lib/auth"
import { login } from "@/lib/auth/login-service"

export function useLogin() {
  const router = useRouter()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: LoginInput) => login(input),
    onSuccess: (data) => {
      queryClient.clear()
      router.replace(data.redirectTo)
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
