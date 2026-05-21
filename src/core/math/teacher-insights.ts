import type { TeacherTransaction, TeacherWalletInsights, PlanDistributionItem } from "@/core/entities/teacher-wallet"
import { PLAN_CONFIGS } from "@/core/constants/plan-pricing"

const PLAN_ORDER = ["mensal", "trimestral", "semestral"]

function inferPlanId(playValue: number | undefined): string {
  if (!playValue) return "outros"
  for (const [id, cfg] of Object.entries(PLAN_CONFIGS)) {
    if (Math.abs(cfg.playValue - playValue) < 0.01) return id
  }
  return "outros"
}

function calculatePlanDistribution(transactions: TeacherTransaction[]): PlanDistributionItem[] {
  const acc: Record<string, { label: string; playsCount: number; brlAmount: number; transactionCount: number }> = {
    mensal: { label: "Mensal", playsCount: 0, brlAmount: 0, transactionCount: 0 },
    trimestral: { label: "Trimestral", playsCount: 0, brlAmount: 0, transactionCount: 0 },
    semestral: { label: "Semestral", playsCount: 0, brlAmount: 0, transactionCount: 0 },
  }

  for (const tx of transactions) {
    if (tx.type !== "CHECK_IN_CREDIT") continue
    const planId = inferPlanId(tx.playValue)
    const bucket = acc[planId] ?? (acc[planId] = { label: "Outros", playsCount: 0, brlAmount: 0, transactionCount: 0 })
    bucket.playsCount += tx.playsConsumed ?? 0
    bucket.brlAmount += tx.amount
    bucket.transactionCount++
  }

  return [
    ...PLAN_ORDER.map((id) => ({ planId: id, ...acc[id] })),
    ...Object.entries(acc)
      .filter(([id, v]) => !PLAN_ORDER.includes(id) && v.transactionCount > 0)
      .map(([id, v]) => ({ planId: id, ...v })),
  ]
}

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
    planDistribution: calculatePlanDistribution(transactions),
  }
}
