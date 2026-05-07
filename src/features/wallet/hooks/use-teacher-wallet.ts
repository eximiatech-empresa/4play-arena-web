import { useQuery } from "@tanstack/react-query"
import { useCurrentUser } from "@/hooks/use-current-user"
import { getTeacherWallet } from "@/lib/firebase/teacher-wallet"
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

  // Compute yearlyEarnings from all-time data is expensive; derive from filtered transactions
  const yearlyEarnings = transactions.reduce((sum, tx) => sum + tx.amount, 0)

  // Derive top students and most missed from filtered transactions
  const studentCheckIns: Record<string, { name: string; count: number }> = {}
  for (const tx of transactions) {
    if (tx.type === "CHECK_IN_CREDIT") {
      const key = tx.studentId
      if (!studentCheckIns[key]) studentCheckIns[key] = { name: tx.studentName ?? tx.studentId, count: 0 }
      studentCheckIns[key].count++
    }
  }
  const topStudents = Object.values(studentCheckIns)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  const insights = {
    topStudents,
    mostMissed: [],
    monthlyComparison: { currentMonthClasses: 0, lastMonthClasses: 0, percentageChange: 0 },
    yearlyEarnings,
  }

  return {
    isLoading: result.isLoading,
    isError: result.isError,
    error: result.error,
    balance,
    transactions,
    insights,
  }
}
