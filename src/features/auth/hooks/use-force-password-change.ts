"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { updatePassword } from "firebase/auth"
import { doc, updateDoc, getDoc } from "firebase/firestore"
import { getFirebaseAuth } from "@/lib/firebase/auth"
import { db } from "@/lib/firebase/firestore"

export function useForcePasswordChange() {
  const router = useRouter()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (newPassword: string) => {
      const auth = getFirebaseAuth()
      const fbUser = auth.currentUser
      if (!fbUser) throw new Error("Sessão expirada. Faça login novamente.")

      try {
        await updatePassword(fbUser, newPassword)
      } catch (err: unknown) {
        const code = (err as { code?: string }).code
        if (code === "auth/requires-recent-login") {
          throw new Error("Por segurança, faça login novamente antes de alterar a senha.")
        }
        throw new Error("Erro ao atualizar a senha. Tente novamente.")
      }

      await updateDoc(doc(db, "users", fbUser.uid), { mustChangePassword: false })

      const snap = await getDoc(doc(db, "users", fbUser.uid))
      return snap.exists() ? (snap.data().role as string) : null
    },
    onSuccess: (role) => {
      queryClient.invalidateQueries({ queryKey: ["currentUser"] })
      if (role === "ADMIN") router.replace("/painel")
      else if (role === "TEACHER") router.replace("/class-management")
      else router.replace("/dashboard")
    },
  })
}
