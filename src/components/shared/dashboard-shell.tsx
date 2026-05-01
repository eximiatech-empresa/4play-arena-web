"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "./sidebar"
import { LoadingScreen } from "./loading-screen"
import { useCurrentUser } from "@/hooks/use-current-user"

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading } = useCurrentUser()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login")
    }
  }, [isLoading, user, router])

  if (isLoading) return <LoadingScreen />
  if (!user) return null

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto pb-16 lg:pb-0">
        {children}
      </main>
    </div>
  )
}
