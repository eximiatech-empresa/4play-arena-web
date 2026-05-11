import { useQuery } from "@tanstack/react-query"
import { useCurrentUser } from "@/hooks/use-current-user"
import { getTeacherWallet } from "@/lib/firebase/teacher-wallet"
import { calculateTeacherInsights } from "@/core/math/teacher-insights"
import type { TeacherTransaction } from "@/core/entities/teacher-wallet"

export const TEACHER_WALLET_QUERY_KEY = ["teacher-wallet"] as const

export type TimeFilter = "this_week" | "this_month" | "last_month" | "this_year" | "all_time"

export function useTeacherWallet(filter: TimeFilter = "this_year") {
  const { data: currentUser } = useCurrentUser()
  const teacherId = currentUser?.role === "TEACHER" ? currentUser.uid : null

  const result = useQuery({
    queryKey: [...TEACHER_WALLET_QUERY_KEY, teacherId, filter],
    queryFn: () => getTeacherWallet(teacherId!, filter),
    enabled: !!teacherId,
    staleTime: 1000 * 60 * 5,
  })

  const balance = result.data?.balance ?? 0
  const transactions: TeacherTransaction[] = result.data?.transactions ?? []
  const insights = calculateTeacherInsights(transactions)

  return {
    isLoading: result.isLoading,
    isError: result.isError,
    error: result.error,
    balance,
    transactions,
    insights,
  }
}
