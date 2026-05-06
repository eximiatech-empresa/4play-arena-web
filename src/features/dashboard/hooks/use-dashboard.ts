import { useCurrentUser } from "@/hooks/use-current-user"
import { useWallet } from "@/features/wallet/hooks/use-wallet"
import { useLessons } from "@/features/booking/hooks/use-lessons"
import { PLANS } from "@/core/constants/professors"
import { calculateUsedPlays, calculateProgressPct } from "@/core/math/wallet-math"
import { parsePlanExpiresAt, getDaysLeft } from "@/core/services/expiration-service"
import { formatStudentLevel } from "@/core/math/lesson-eligibility"
import { useMemo } from "react"
import type { AdminUser, TeacherUser, StudentUser } from "@/core/entities/user"
import type { Wallet } from "@/core/entities/wallet"
import type { Lesson } from "@/core/entities/lesson"

type PlanDetails = (typeof PLANS)[keyof typeof PLANS]

export interface DashboardState {
  isLoading: boolean
  role: "ADMIN" | "TEACHER" | "STUDENT" | undefined
  currentUser: AdminUser | TeacherUser | StudentUser | undefined
  student?: StudentUser
  wallet?: Wallet
  lessons?: Lesson[]
  plan?: PlanDetails
  usedPlays?: number
  progressPct?: number
  expiresAt?: Date | null
  daysLeft?: number
  isExpired?: boolean
  rawLevel?: string
  formattedCurrentLevel?: string
  studentLevelIndex?: number
  nextLesson?: Lesson
}

export function useDashboard(): DashboardState {
  const { data: currentUser, isLoading: isUserLoading } = useCurrentUser()
  const { data: walletData, isLoading: isWalletLoading } = useWallet()
  const { data: lessonsData, isLoading: isLessonsLoading } = useLessons()

  return useMemo((): DashboardState => {
    const isLoading = isUserLoading || isWalletLoading || isLessonsLoading

    if (isLoading || !currentUser) {
      return { isLoading, role: undefined, currentUser: undefined }
    }

    if (currentUser.role === "ADMIN") {
      return { isLoading: false, role: "ADMIN", currentUser }
    }

    if (currentUser.role === "TEACHER") {
      return { isLoading: false, role: "TEACHER", currentUser }
    }

    if (!walletData) {
      return { isLoading: true, role: undefined, currentUser: undefined }
    }

    const lessons = lessonsData ?? []
    const plan = PLANS[walletData.plan] || PLANS.mensal
    const usedPlays = calculateUsedPlays(walletData.totalPlays, walletData.balance)
    const progressPct = calculateProgressPct(walletData.totalPlays, walletData.balance)

    const expiresAt = parsePlanExpiresAt(currentUser.planExpiresAt)
    const { daysLeft, isExpired } = getDaysLeft(expiresAt)

    const rawLevel = currentUser.level || "Iniciante"
    const { formattedCurrentLevel, studentLevelIndex } = formatStudentLevel(rawLevel)

    const nextLesson = lessons.find((l) => l.checkInStatus !== "closed" && l.isEnrolled)

    return {
      isLoading: false,
      role: "STUDENT",
      currentUser,
      student: currentUser,
      wallet: walletData,
      lessons,
      plan,
      usedPlays,
      progressPct,
      expiresAt,
      daysLeft,
      isExpired,
      rawLevel,
      formattedCurrentLevel,
      studentLevelIndex,
      nextLesson,
    }
  }, [isUserLoading, isWalletLoading, isLessonsLoading, currentUser, walletData, lessonsData])
}
