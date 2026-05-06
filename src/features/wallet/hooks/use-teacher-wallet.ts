import { useQuery } from "@tanstack/react-query"
import type { TeacherWalletResponse } from "@/core/entities/teacher-wallet"

export const TEACHER_WALLET_QUERY_KEY = ["teacher-wallet"] as const

export type TimeFilter = "this_week" | "this_month" | "last_month" | "this_year" | "all_time"

type TeacherWalletQueryKey = readonly [string, TimeFilter]

// --- MOCK DATA PARA APRESENTAÇÃO ---

const COMMON_INSIGHTS_BASE = {
  monthlyComparison: {
    currentMonthClasses: 42,
    lastMonthClasses: 35,
    percentageChange: 20,
  },
}

const MOCK_DATA_BY_FILTER: Record<TimeFilter, TeacherWalletResponse> = {
  this_week: {
    teacherId: "mock-teacher",
    balance: 45.0,
    transactions: [
      { id: "tx-1", teacherId: "mock", studentId: "s-1", studentName: "Lucas Silva", type: "CHECK_IN_CREDIT", amount: 1.5, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() },
      { id: "tx-2", teacherId: "mock", studentId: "s-2", studentName: "Amanda Lima", type: "CHECK_IN_CREDIT", amount: 1.5, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString() },
    ],
    insights: {
      ...COMMON_INSIGHTS_BASE,
      topStudents: [{ name: "Lucas Silva", count: 3 }, { name: "Amanda Lima", count: 2 }, { name: "Roberto Dias", count: 1 }],
      mostMissed: [{ name: "Mariana Costa", count: 1 }],
      yearlyEarnings: 1250.5,
    }
  },
  this_month: {
    teacherId: "mock-teacher",
    balance: 145.5,
    transactions: [
      { id: "tx-m1", teacherId: "mock", studentId: "s-1", studentName: "Lucas Silva", type: "CHECK_IN_CREDIT", amount: 1.5, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() },
      { id: "tx-m2", teacherId: "mock", studentId: "s-2", studentName: "Mariana Costa", type: "LATE_CANCELLATION_CREDIT", amount: 1.5, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString() },
      { id: "tx-m3", teacherId: "mock", studentId: "s-3", studentName: "João Pedro", type: "EXPIRED_PLAN_TRANSFER", amount: 4.0, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString() },
    ],
    insights: {
      ...COMMON_INSIGHTS_BASE,
      topStudents: [{ name: "Lucas Silva", count: 12 }, { name: "Sofia Almeida", count: 9 }, { name: "Pedro Henrique", count: 7 }],
      mostMissed: [{ name: "Mariana Costa", count: 4 }, { name: "João Pedro", count: 3 }],
      yearlyEarnings: 1250.5,
    }
  },
  last_month: {
    teacherId: "mock-teacher",
    balance: 85.0,
    transactions: [
      { id: "tx-l1", teacherId: "mock", studentId: "s-1", studentName: "Carlos Edu", type: "CHECK_IN_CREDIT", amount: 1.0, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 32).toISOString() },
      { id: "tx-l2", teacherId: "mock", studentId: "s-4", studentName: "Fernanda", type: "CHECK_IN_CREDIT", amount: 1.5, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 34).toISOString() },
    ],
    insights: {
      monthlyComparison: {
        currentMonthClasses: 35,
        lastMonthClasses: 32,
        percentageChange: 9.3,
      },
      topStudents: [{ name: "Sofia Almeida", count: 10 }, { name: "Roberto Dias", count: 8 }, { name: "Fernanda", count: 6 }],
      mostMissed: [{ name: "Lucas Silva", count: 2 }],
      yearlyEarnings: 1250.5,
    }
  },
  this_year: {
    teacherId: "mock-teacher",
    balance: 1250.5,
    transactions: [
      { id: "tx-y1", teacherId: "mock", studentId: "s-1", studentName: "Lucas Silva", type: "CHECK_IN_CREDIT", amount: 1.5, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() },
      { id: "tx-y2", teacherId: "mock", studentId: "s-5", studentName: "Andréia", type: "EXPIRED_PLAN_TRANSFER", amount: 8.0, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 40).toISOString() },
      { id: "tx-y3", teacherId: "mock", studentId: "s-3", studentName: "João Pedro", type: "LATE_CANCELLATION_CREDIT", amount: 2.0, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 70).toISOString() },
    ],
    insights: {
      ...COMMON_INSIGHTS_BASE,
      topStudents: [{ name: "Lucas Silva", count: 45 }, { name: "Sofia Almeida", count: 38 }, { name: "Pedro Henrique", count: 32 }],
      mostMissed: [{ name: "Mariana Costa", count: 12 }, { name: "João Pedro", count: 9 }],
      yearlyEarnings: 1250.5,
    }
  },
  all_time: {
    teacherId: "mock-teacher",
    balance: 5430.0,
    transactions: [
      { id: "tx-a1", teacherId: "mock", studentId: "s-1", studentName: "Lucas Silva", type: "CHECK_IN_CREDIT", amount: 1.5, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() },
      { id: "tx-a2", teacherId: "mock", studentId: "s-7", studentName: "Rodrigo", type: "EXPIRED_PLAN_TRANSFER", amount: 12.0, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 120).toISOString() },
    ],
    insights: {
      ...COMMON_INSIGHTS_BASE,
      topStudents: [{ name: "Lucas Silva", count: 180 }, { name: "Sofia Almeida", count: 154 }, { name: "Andréia", count: 120 }],
      mostMissed: [{ name: "Mariana Costa", count: 25 }, { name: "João Pedro", count: 18 }],
      yearlyEarnings: 1250.5,
    }
  }
}
// -----------------------------------

async function fetchTeacherWallet({
  queryKey,
}: {
  queryKey: TeacherWalletQueryKey
}): Promise<TeacherWalletResponse> {
  const [, filter] = queryKey
  // Simula um delay de rede
  await new Promise((resolve) => setTimeout(resolve, 800))
  return MOCK_DATA_BY_FILTER[filter as TimeFilter] || MOCK_DATA_BY_FILTER.this_year
}

export function useTeacherWallet(filter: TimeFilter = "this_year") {
  const query = useQuery({
    queryKey: [...TEACHER_WALLET_QUERY_KEY, filter],
    queryFn: fetchTeacherWallet,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  // Format data for the view
  const balance = query.data?.balance || 0
  const transactions = query.data?.transactions || []
  const insights = query.data?.insights || { 
    topStudents: [], 
    mostMissed: [], 
    monthlyComparison: { currentMonthClasses: 0, lastMonthClasses: 0, percentageChange: 0 },
    yearlyEarnings: 0
  }

  return {
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    balance,
    transactions,
    insights,
  }
}
