"use client"

import { Loader2 } from "lucide-react"
import { useCurrentUser } from "@/hooks/use-current-user"
import { AdminPlansContent } from "@/features/admin-plans"

export default function AdminPlansPage() {
  const { isLoading } = useCurrentUser()

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
      </div>
    )
  }

  return <AdminPlansContent />
}
