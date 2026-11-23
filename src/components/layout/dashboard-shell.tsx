"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Sidebar } from "./sidebar"
import { LoadingScreen } from "@/components/shared/loading-screen"
import { NotificationsWatcher } from "@/components/shared/notifications-watcher"
import { ReferralBonusModal } from "@/components/shared/referral-bonus-modal"
import { useCurrentUser } from "@/hooks/use-current-user"

const ADMIN_ONLY_ROUTES = [
  "/painel",
  "/users-management",
  "/admin-lessons",
  "/admin-plans",
]

const STAFF_ROUTES = [
  "/class-management",
  "/gestao-turma",
  "/niveis-alunos",
  "/carteira-professor",
  "/historico-professor",
]

function homeForRole(role: string): string {
  if (role === "ADMIN") return "/painel"
  if (role === "TEACHER") return "/class-management"
  return "/dashboard"
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading } = useCurrentUser()
  const router = useRouter()
  const pathname = usePathname()

  const isAdminOnly = ADMIN_ONLY_ROUTES.some((r) => pathname?.startsWith(r))
  const isStaffRoute = STAFF_ROUTES.some((r) => pathname?.startsWith(r))
  const isUnauthorized =
    !!user &&
    ((isAdminOnly && user.role !== "ADMIN") ||
      (isStaffRoute && user.role !== "ADMIN" && user.role !== "TEACHER"))

  useEffect(() => {
    if (isLoading) return
    if (!user) {
      router.replace("/login")
      return
    }
    if (user.mustChangePassword) {
      router.replace("/force-password-change")
      return
    }
    if (isUnauthorized) {
      router.replace(homeForRole(user.role))
    }
  }, [isLoading, user, isUnauthorized, router])

  if (isLoading) return <LoadingScreen />
  if (!user || user.mustChangePassword || isUnauthorized) return null

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <NotificationsWatcher />
      <ReferralBonusModal />
      <Sidebar />
      <main className="flex-1 overflow-y-auto pb-16 lg:pb-0">
        {children}
      </main>
    </div>
  )
}
