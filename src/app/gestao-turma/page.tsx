"use client"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { useCurrentUser } from "@/hooks/use-current-user"
import { TeacherRosterContent } from "@/features/teacher/turma/components/teacher-roster-content"

export default function TeacherRosterPage() {
  const { data: user, isLoading } = useCurrentUser()
  const router = useRouter()

  useEffect(() => {
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

  if (user?.role === "TEACHER" || user?.role === "ADMIN") {
    return <TeacherRosterContent />
  }

  return null
}
