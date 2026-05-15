"use client"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { useCurrentUser } from "@/hooks/use-current-user"
import { ClassManagementContent } from "@/features/teacher/gestao/components/class-management-content"

export default function ClassManagementPage() {
  const { data: user, isLoading } = useCurrentUser()
  const router = useRouter()

  useEffect(() => {
    // Redireciona o aluno comum caso tente acessar a rota do professor pela URL
    if (!isLoading && user && user.role === "STUDENT") {
      router.replace("/dashboard")
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
      </div>
    )
  }

  // Se não for aluno (é ADMIN ou TEACHER), exibe o painel de gestão
  if (user?.role === "TEACHER" || user?.role === "ADMIN") {
    return <ClassManagementContent />
  }

  // Retorno de fallback enquanto redireciona
  return null
}