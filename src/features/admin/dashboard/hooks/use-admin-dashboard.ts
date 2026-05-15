import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { useLessons } from "@/features/student/aulas/hooks/use-lessons"
import { useAdminLessonsByDate } from "@/features/admin/aulas/hooks/use-admin-lessons"
import { usePlans } from "@/features/shared/planos-data/hooks/use-plans"
import { usePlayPackages } from "@/features/shared/planos-data/hooks/use-play-packages"
import { getAdminTransactionsByMonth } from "@/lib/firebase/admin-transactions"
import { getStudentsForAlerts } from "@/lib/firebase/firestore"
import { getRecentAuditLogs } from "@/lib/firebase/audit-logs"
import { runOperationalRadar } from "@/core/math/operational-radar"
import type { OperationalAlert } from "@/core/math/operational-radar"
import type { LessonDocument } from "@/core/entities/lesson"

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

export type AuditLogType = "level_change"

export interface AuditLog {
  id: string
  type: AuditLogType
  actorName: string
  targetName: string
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

// ─── Constants ────────────────────────────────────────────────────────────────

const EMPTY_METRICS: AdminMetrics = {
  packagesSoldThisMonth: 0,
  occupancyRateToday: 0,
  cancellationsToday: 0,
  estimatedRevenue: 0,
}

const PLAN_EXPIRY_ALERT_DAYS = 7

// ─── Status mapping ────────────────────────────────────────────────────────────

function mapDocStatus(doc: LessonDocument): LessonStatus {
  if (doc.status === "cancelled") return "cancelled"
  if (doc.status === "finished") return "completed"
  // "scheduled": só deriva "in_progress" pelo horário — nunca auto-conclui.
  // "Concluída" só aparece quando o professor marcar explicitamente como "finished".
  const lessonMs = new Date(doc.dateTime).getTime()
  const nowMs = Date.now()
  if (nowMs >= lessonMs && nowMs < lessonMs + 60 * 60 * 1000) return "in_progress"
  return "confirmed"
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAdminDashboard(): AdminDashboardData {
  const today = new Date()
  const todayStr = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(today)
    .split("/")
    .reverse()
    .join("-") // "2026-05-14"

  const year = today.getFullYear()
  const month = today.getMonth() // 0-indexed

  // ── Core data (blocks loading state) ──────────────────────────────────────
  const { data: todayDocs = [], isLoading: isTodayLoading } =
    useAdminLessonsByDate(todayStr)

  const { data: monthTxs = [], isLoading: isTxLoading } = useQuery({
    queryKey: ["admin-transactions", year, month],
    queryFn: () => getAdminTransactionsByMonth(year, month),
    staleTime: 2 * 60 * 1000,
  })

  const { data: plans = [] } = usePlans()
  const { data: packages = [] } = usePlayPackages()

  const { data: lessons = [], isLoading: isRadarLoading } = useLessons()

  // ── Secondary data (non-blocking) ─────────────────────────────────────────
  const { data: students = [] } = useQuery({
    queryKey: ["students-for-alerts"],
    queryFn: getStudentsForAlerts,
    staleTime: 5 * 60 * 1000,
  })

  const { data: auditLogDocs = [] } = useQuery({
    queryKey: ["audit-logs"],
    queryFn: () => getRecentAuditLogs(8),
    staleTime: 2 * 60 * 1000,
  })

  const isLoading = isTodayLoading || isTxLoading || isRadarLoading

  // ── Derived: metrics ───────────────────────────────────────────────────────
  const metrics = useMemo((): AdminMetrics => {
    const packagesSoldThisMonth = monthTxs.filter(
      (t) => t.type === "purchase" || t.type === "package",
    ).length

    const activeLessons = todayDocs.filter((l) => l.status !== "cancelled")
    const totalSpots = activeLessons.reduce((s, l) => s + l.totalSpots, 0)
    const totalEnrolled = activeLessons.reduce(
      (s, l) => s + l.enrolledStudentIds.length,
      0,
    )
    const occupancyRateToday =
      totalSpots > 0 ? Math.round((totalEnrolled / totalSpots) * 100) : 0

    const cancellationsToday = todayDocs.filter(
      (l) => l.status === "cancelled",
    ).length

    const planMap = new Map(plans.map((p) => [p.totalPlays, p.priceInCents]))
    const pkgMap = new Map(packages.map((p) => [p.plays, p.priceInCents]))

    const estimatedRevenueCents = monthTxs.reduce((total, tx) => {
      if (tx.type === "purchase") return total + (planMap.get(tx.amount) ?? 0)
      if (tx.type === "package") return total + (pkgMap.get(tx.amount) ?? 0)
      return total
    }, 0)

    return {
      packagesSoldThisMonth,
      occupancyRateToday,
      cancellationsToday,
      estimatedRevenue: estimatedRevenueCents / 100,
    }
  }, [monthTxs, todayDocs, plans, packages])

  // ── Derived: today's agenda ────────────────────────────────────────────────
  const todaysLessons = useMemo((): TodaysLesson[] => {
    return todayDocs
      .map(
        (doc): TodaysLesson => ({
          id: doc.id,
          professorName: doc.professorName,
          court: doc.court,
          level: doc.level,
          time: new Date(doc.dateTime).toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "America/Sao_Paulo",
          }),
          enrolledCount: doc.enrolledStudentIds.length,
          totalSpots: doc.totalSpots,
          status: mapDocStatus(doc),
        }),
      )
      .sort((a, b) => a.time.localeCompare(b.time))
  }, [todayDocs])

  // ── Derived: retention alerts (expiring plans) ─────────────────────────────
  const alerts = useMemo((): AdminAlert[] => {
    const nowMs = Date.now()
    const thresholdMs = PLAN_EXPIRY_ALERT_DAYS * 24 * 60 * 60 * 1000

    return students
      .filter((s) => {
        if (!s.planExpiresAt) return false
        const diffMs = new Date(s.planExpiresAt).getTime() - nowMs
        return diffMs > 0 && diffMs <= thresholdMs
      })
      .sort(
        (a, b) =>
          new Date(a.planExpiresAt!).getTime() -
          new Date(b.planExpiresAt!).getTime(),
      )
      .map((s): AdminAlert => {
        const daysLeft = Math.ceil(
          (new Date(s.planExpiresAt!).getTime() - nowMs) / (24 * 60 * 60 * 1000),
        )
        return {
          id: `expiring-${s.uid}`,
          type: "plan_expiring",
          message:
            daysLeft === 1
              ? "Plano vence em 1 dia"
              : `Plano vence em ${daysLeft} dias`,
          detail: s.name,
          href: "/users-management",
        }
      })
  }, [students])

  // ── Derived: operational radar ─────────────────────────────────────────────
  const operationalAlerts = useMemo(
    () => runOperationalRadar(lessons),
    [lessons],
  )

  // ── Derived: audit log ─────────────────────────────────────────────────────
  const auditLogs = useMemo(
    (): AuditLog[] =>
      auditLogDocs.map((d) => ({
        id: d.id,
        type: d.type,
        actorName: d.actorName,
        targetName: d.targetName,
        previousValue: d.previousValue,
        newValue: d.newValue,
        createdAt: d.createdAt,
      })),
    [auditLogDocs],
  )

  return {
    isLoading,
    metrics: isLoading ? EMPTY_METRICS : metrics,
    todaysLessons,
    alerts,
    operationalAlerts,
    auditLogs,
  }
}
