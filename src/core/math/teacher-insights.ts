import type { TeacherTransaction, TeacherWalletInsights } from "@/core/entities/teacher-wallet"

/**
 * Derives wallet insights (top students, yearly earnings) from a filtered
 * set of teacher transactions.
 *
 * Pure function — no side effects, no Firebase.
 */
export function calculateTeacherInsights(transactions: TeacherTransaction[]): TeacherWalletInsights {
  const yearlyEarnings = transactions.reduce((sum, tx) => sum + tx.amount, 0)

  const studentCheckIns: Record<string, { name: string; count: number }> = {}
  for (const tx of transactions) {
    if (tx.type === "CHECK_IN_CREDIT") {
      const key = tx.studentId
      if (!studentCheckIns[key])
        studentCheckIns[key] = { name: tx.studentName ?? tx.studentId, count: 0 }
      studentCheckIns[key].count++
    }
  }

  const topStudents = Object.values(studentCheckIns)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  return {
    topStudents,
    mostMissed: [],
    monthlyComparison: { currentMonthClasses: 0, lastMonthClasses: 0, percentageChange: 0 },
    yearlyEarnings,
  }
}
