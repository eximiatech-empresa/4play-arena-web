// src/app/users-management/page.tsx
"use client"
import { Loader2 } from "lucide-react"
import { useCurrentUser } from "@/hooks/use-current-user"
import { UsersManagementContent } from "@/features/admin/usuarios/components/users-management-content"

export default function UsersManagementPage() {
  const { isLoading } = useCurrentUser()

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
      </div>
    )
  }

  // Renderiza a tela direto! Se o cara chegou aqui, a Sidebar já deixou ele passar.
  return <UsersManagementContent />
}