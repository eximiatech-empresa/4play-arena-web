import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { useLessons } from "@/features/booking/hooks/use-lessons"
import { runOperationalRadar } from "@/core/math/operational-radar"
import type { OperationalAlert } from "@/core/math/operational-radar"

// ─── Re-export so the view layer imports from one place ──────────────────────
export type { OperationalAlert, OperationalAlertType } from "@/core/math/operational-radar"

// ─── Domain types ─────────────────────────────────────────────────────────────

export type LessonStatus = "confirmed" | "in_progress" | "completed" | "cancelled"
export type AlertType = "plan_expiring" | "cancellation" | "low_occupancy"

export interface AdminMetrics {
  packagesSoldThisMonth: number
  occupancyRateToday: number   // 0–100
  cancellationsToday: number
  estimatedRevenue: number     // BRL
}

export interface TodaysLesson {
  id: string
  professorName: string
  court: string
  time: string           // "HH:MM"
  level: string
  enrolledCount: number
  totalSpots: number
  status: LessonStatus
}

export interface AdminAlert {
  id: string
  type: AlertType
  message: string
  detail: string
  href: string
}

// A single "level changed" audit entry.
// TODO: replace mock with real-time Firestore query on `audit_logs` collection.
export type AuditLogType = "level_change"

export interface AuditLog {
  id: string
  type: AuditLogType
  actorName: string      // professor who made the change
  targetName: string     // student whose level changed
  previousValue: string
  newValue: string
  createdAt: string      // ISO 8601
}

export interface AdminDashboardData {
  isLoading: boolean
  metrics: AdminMetrics
  todaysLessons: TodaysLesson[]
  alerts: AdminAlert[]
  operationalAlerts: OperationalAlert[]
  auditLogs: AuditLog[]
}

// ─── Mock data ────────────────────────────────────────────────────────────────
// TODO: replace with real Firebase/Firestore aggregation queries

const MOCK_METRICS: AdminMetrics = {
  packagesSoldThisMonth: 14,
  occupancyRateToday: 72,
  cancellationsToday: 2,
  estimatedRevenue: 8430,
}

const MOCK_TODAYS_LESSONS: TodaysLesson[] = [
  { id: "tl1", professorName: "Biel",    court: "Quadra 3", time: "09:00", level: "Iniciante", enrolledCount: 0, totalSpots: 6, status: "cancelled"   },
  { id: "tl2", professorName: "Paulinho",court: "Quadra 2", time: "10:00", level: "Nível C",   enrolledCount: 3, totalSpots: 4, status: "completed"   },
  { id: "tl3", professorName: "Marília", court: "Quadra 1", time: "14:00", level: "Nível C",   enrolledCount: 0, totalSpots: 4, status: "cancelled"   },
  { id: "tl4", professorName: "Marília", court: "Quadra 1", time: "17:00", level: "Nível A",   enrolledCount: 4, totalSpots: 4, status: "in_progress" },
  { id: "tl5", professorName: "Pepe",    court: "Quadra 2", time: "19:00", level: "Nível B",   enrolledCount: 3, totalSpots: 4, status: "confirmed"   },
  { id: "tl6", professorName: "Paulinho",court: "Quadra 2", time: "20:00", level: "Nível B",   enrolledCount: 3, totalSpots: 4, status: "confirmed"   },
]

const MOCK_ALERTS: AdminAlert[] = [
  { id: "a1", type: "cancellation",  message: "Aula cancelada de última hora", detail: "Biel · Quadra 3 · 09:00 (Iniciante)",  href: "/class-management"  },
  { id: "a2", type: "cancellation",  message: "Aula cancelada de última hora", detail: "Marília · Quadra 1 · 14:00 (Nível C)", href: "/class-management"  },
  { id: "a3", type: "plan_expiring", message: "Plano vence em 1 dia",          detail: "Carlos Silva",                          href: "/users-management"  },
  { id: "a4", type: "plan_expiring", message: "Plano vence em 2 dias",         detail: "Ana Costa",                             href: "/users-management"  },
  { id: "a5", type: "plan_expiring", message: "Plano vence em 3 dias",         detail: "Pedro Santos",                          href: "/users-management"  },
]

// Timestamps are relative to "now" at session time so the UI always looks live.
const now = Date.now()
const MOCK_AUDIT_LOGS: AuditLog[] = [
  {
    id: "al1",
    type: "level_change",
    actorName: "Paulinho",
    targetName: "Carlos Silva",
    previousValue: "Nível C",
    newValue: "Nível B",
    createdAt: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "al2",
    type: "level_change",
    actorName: "Marília",
    targetName: "Ana Costa",
    previousValue: "Iniciante",
    newValue: "Nível C",
    createdAt: new Date(now - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "al3",
    type: "level_change",
    actorName: "Biel",
    targetName: "Pedro Santos",
    previousValue: "Nível D",
    newValue: "Nível C",
    createdAt: new Date(now - 22 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "al4",
    type: "level_change",
    actorName: "Pepe",
    targetName: "Fernanda Rocha",
    previousValue: "Nível C",
    newValue: "Nível B",
    createdAt: new Date(now - 47 * 60 * 60 * 1000).toISOString(),
  },
]

const EMPTY_METRICS: AdminMetrics = {
  packagesSoldThisMonth: 0,
  occupancyRateToday: 0,
  cancellationsToday: 0,
  estimatedRevenue: 0,
}

// ─── Fetch (simulated — replace with real Firestore aggregation) ──────────────

async function fetchAdminBase() {
  await new Promise<void>((r) => setTimeout(r, 400))
  return {
    metrics: MOCK_METRICS,
    todaysLessons: MOCK_TODAYS_LESSONS,
    alerts: MOCK_ALERTS,
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAdminDashboard(): AdminDashboardData {
  const { data, isLoading: isBaseLoading } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: fetchAdminBase,
    staleTime: 2 * 60 * 1000,
  })

  const { data: lessons = [], isLoading: isLessonsLoading } = useLessons()

  const isLoading = isBaseLoading || isLessonsLoading

  const operationalAlerts = useMemo(
    () => runOperationalRadar(lessons),
    [lessons]
  )

  return {
    isLoading,
    metrics: data?.metrics ?? EMPTY_METRICS,
    todaysLessons: data?.todaysLessons ?? [],
    alerts: data?.alerts ?? [],
    operationalAlerts,
    auditLogs: MOCK_AUDIT_LOGS,
  }
}
