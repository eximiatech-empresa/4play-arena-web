import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase/firestore"
import { authService } from "@/lib/auth"
import type { LoginInput } from "@/core/entities/auth"
import type { UserRole } from "@/core/entities/user"
import { ERROS } from "@/core/errors/erros"

function resolveRedirectRoute(role: UserRole, mustChangePassword: boolean): string {
  if (mustChangePassword) return "/force-password-change"
  if (role === "ADMIN") return "/painel"
  if (role === "TEACHER") return "/class-management"
  return "/dashboard"
}

export async function login(input: LoginInput): Promise<{ redirectTo: string }> {
  const result = await authService.signInWithPassword({
    email: input.email,
    password: input.password,
  })

  if (result.error) throw new Error(result.error.message)

  const user = result.data?.user
  if (!user) throw new Error("Erro ao recuperar os dados do usuário após o login.")

  const userSnap = await getDoc(doc(db, "users", user.id))
  if (!userSnap.exists()) return { redirectTo: "/dashboard" }

  const userData = userSnap.data()

  if (userData.isActive === false) {
    await authService.signOut()
    throw new Error(ERROS.USUARIO_INATIVO)
  }

  return {
    redirectTo: resolveRedirectRoute(
      userData.role as UserRole,
      userData.mustChangePassword === true,
    ),
  }
}
