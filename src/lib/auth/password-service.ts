import { updatePassword } from "firebase/auth"
import { doc, updateDoc, getDoc } from "firebase/firestore"
import { getFirebaseAuth } from "@/lib/firebase/auth"
import { db } from "@/lib/firebase/firestore"
import { ERROS } from "@/core/errors/erros"

type UserRole = "ADMIN" | "TEACHER" | "STUDENT"

function resolveRedirectRoute(role: UserRole | null): string {
  if (role === "ADMIN") return "/painel"
  if (role === "TEACHER") return "/class-management"
  return "/dashboard"
}

export async function forceChangePassword(newPassword: string): Promise<{ redirectTo: string }> {
  const auth = getFirebaseAuth()
  const fbUser = auth.currentUser
  if (!fbUser) throw new Error(ERROS.SESSAO_EXPIRADA)

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
  const role = snap.exists() ? (snap.data().role as UserRole) : null

  return { redirectTo: resolveRedirectRoute(role) }
}
