"use client"

import { useMutation } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase/firestore"
import { useQueryClient } from "@tanstack/react-query"

import type { LoginInput, RegisterInput } from "@/core/entities/auth"
import { authService } from "@/lib/auth"

export function useLogin() {
  const router = useRouter()
  const queryClient = useQueryClient()


  return useMutation({
    mutationFn: async (input: LoginInput) => {
      const result = await authService.signInWithPassword({
        email: input.email,
        password: input.password,
      })

      if (result.error) throw new Error(result.error.message)

      const user = result.data?.user
      if (!user) {
        throw new Error("Erro ao recuperar os dados do usuário após o login.")
      } 

      const userId = user.id

      const userRef = doc(db, "users", userId)
      const userSnap = await getDoc(userRef)

      let redirectRoute = "/dashboard"

      if (userSnap.exists()) {
        const userData = userSnap.data()

        if (userData.isActive === false) {
          
          await authService.signOut()
          
          throw new Error("Sua conta foi desativada. Entre em contato com a administração.")
        }
        if (userData.role === "ADMIN") {
          redirectRoute = "/painel"
        }
      }

      return { 
        authData: result.data, 
        route: redirectRoute 
      }
    },
    onSuccess: (data) => {
      // Limpa qualquer cache fantasma antigo antes de entrar
      queryClient.clear()
      router.replace(data.route)
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
