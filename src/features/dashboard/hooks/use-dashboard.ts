import { useCurrentUser } from "@/hooks/use-current-user"
import { useWallet } from "@/features/wallet/hooks/use-wallet"
import { useLessons } from "@/features/booking/hooks/use-lessons"
import { PLANS } from "@/core/constants/professors"
import { calculateUsedPlays, calculateProgressPct } from "@/core/math/wallet-math"
import { parsePlanExpiresAt, getDaysLeft } from "@/core/services/expiration-service"
import { formatStudentLevel } from "@/core/math/lesson-eligibility"
import { useMemo } from "react"

export function useDashboard() {
  const { data: currentUser, isLoading: isUserLoading } = useCurrentUser()
  const { data: walletData, isLoading: isWalletLoading } = useWallet()
  const { data: lessonsData, isLoading: isLessonsLoading } = useLessons()

  const isLoading = isUserLoading || isWalletLoading || isLessonsLoading

  const processedData = useMemo(() => {
    if (!currentUser) {
      return { role: undefined, student: undefined, wallet: undefined, lessons: undefined, plan: undefined, currentUser: undefined }
    }

    if (currentUser.role === "ADMIN" || currentUser.role === "TEACHER") {
      return { role: currentUser.role, student: undefined, wallet: undefined, lessons: undefined, plan: undefined, currentUser }
    }

    const wallet = walletData || { balance: 0, totalPlays: 0, transactions: [], plan: "mensal" }
    const lessons = lessonsData || []
    
    const plan = PLANS[wallet.plan as keyof typeof PLANS] || PLANS["mensal"]
    const usedPlays = calculateUsedPlays(wallet.totalPlays, wallet.balance)
    const progressPct = calculateProgressPct(wallet.totalPlays, wallet.balance)

    const expiresAt = parsePlanExpiresAt(currentUser.planExpiresAt as any)
    const { daysLeft, isExpired } = getDaysLeft(expiresAt)

    const rawLevel = currentUser.level || "Iniciante"
    const { formattedCurrentLevel, studentLevelIndex } = formatStudentLevel(rawLevel)

    const nextLesson = lessons.find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (l: any) => l.checkInStatus !== "closed" && l.isEnrolled
    )

    return {
      role: currentUser.role,
      student: currentUser,
      wallet,
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
      currentUser
    }
  }, [currentUser, walletData, lessonsData])

  return {
    isLoading,
    ...processedData
  }
}
