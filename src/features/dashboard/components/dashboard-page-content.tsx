"use client"

import {
  Clock,
  TrendingDown,
  CalendarCheck2,
  ShieldCheck,
  GraduationCap,
  Loader2,
  Trophy,
  UserCheck,
  UserPlus,
  CheckCircle2,
  Circle,
  CalendarDays,
  MapPin,
  BarChart3,
  DollarSign,
  Activity,
  AlertCircle,
  XCircle,
  Package,
  Ghost,
  Users,
  AlertTriangle,
  ShieldAlert,
  ArrowRight,
} from "lucide-react"
import { STUDENT_LEVELS } from "@/core/constants/professors"
import { LevelBadge } from "@/components/shared/level-badge"
import { UpcomingLessonsSection } from "./upcoming-lessons-section"
import { cn } from "@/lib/utils"

// ─── HOOKS ───────────────────────────────────────────────────────────────────
import { useDashboard } from "@/features/dashboard/hooks/use-dashboard"
import { useTeacherDashboard } from "@/features/dashboard/hooks/use-teacher-dashboard"
import type { TeacherDashboardData } from "@/features/dashboard/hooks/use-teacher-dashboard"
import { useAdminDashboard } from "@/features/dashboard/hooks/use-admin-dashboard"
import type {
  AdminDashboardData,
  LessonStatus,
  AlertType,
  AuditLog,
  OperationalAlert,
  OperationalAlertType,
} from "@/features/dashboard/hooks/use-admin-dashboard"

import Link from "next/link"

// ─── Presentation maps (admin) ────────────────────────────────────────────────

const LESSON_STATUS_LABELS: Record<LessonStatus, string> = {
  confirmed:   "Agendada",
  in_progress: "Em Andamento",
  completed:   "Concluída",
  cancelled:   "Cancelada",
}

const LESSON_STATUS_CLASSES: Record<LessonStatus, string> = {
  confirmed:   "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
  in_progress: "bg-brand-subtle text-brand-dark",
  completed:   "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400",
  cancelled:   "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400",
}

function AlertIcon({ type }: { type: AlertType }) {
  if (type === "cancellation") return <XCircle className="w-4 h-4 text-red-500" />
  if (type === "plan_expiring") return <AlertCircle className="w-4 h-4 text-amber-500" />
  return <TrendingDown className="w-4 h-4 text-zinc-400" />
}

const OPERATIONAL_ALERT_LABELS: Record<OperationalAlertType, string> = {
  ghost_lesson: "Fantasma",
  full_lesson:  "Lotada",
}

const OPERATIONAL_ALERT_BADGE: Record<OperationalAlertType, string> = {
  ghost_lesson: "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400",
  full_lesson:  "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400",
}

function OperationalAlertIcon({ type }: { type: OperationalAlertType }) {
  if (type === "ghost_lesson") return <Ghost className="w-4 h-4 text-red-500 shrink-0" />
  return <Users className="w-4 h-4 text-amber-500 shrink-0" />
}

function relativeTime(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime()
  const mins = Math.floor(diffMs / 60_000)
  if (mins < 60) return `${mins}m atrás`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h atrás`
  return `${Math.floor(hrs / 24)}d atrás`
}

// ─── RBAC panels ─────────────────────────────────────────────────────────────

function AdminDashboardSkeleton() {
  return (
    <div className="px-5 py-6 lg:px-8 lg:py-8 max-w-5xl mx-auto space-y-8 animate-pulse">
      <div className="space-y-2">
        <div className="h-3 w-40 rounded bg-muted" />
        <div className="h-7 w-56 rounded bg-muted" />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-4 space-y-3">
            <div className="h-3 w-24 rounded bg-muted" />
            <div className="h-6 w-16 rounded bg-muted" />
            <div className="h-2 w-12 rounded bg-muted" />
          </div>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card h-72" />
        <div className="rounded-2xl border border-border bg-card h-72" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card h-48" />
        <div className="rounded-2xl border border-border bg-card h-48" />
      </div>
    </div>
  )
}

function AdminDashboardView({
  metrics,
  todaysLessons,
  alerts,
  operationalAlerts,
  auditLogs,
}: Omit<AdminDashboardData, "isLoading">) {
  return (
    <div className="px-5 py-6 lg:px-8 lg:py-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <p className="text-sm text-muted-foreground capitalize">
          {new Date().toLocaleDateString("pt-BR", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
        <h1 className="text-2xl font-bold text-foreground mt-0.5">Painel Executivo</h1>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Pacotes Vendidos"
          value={String(metrics.packagesSoldThisMonth)}
          sub="este mês"
          icon={<Package className="w-4 h-4 text-brand" />}
          accent
        />
        <StatCard
          label="Ocupação Hoje"
          value={`${metrics.occupancyRateToday}%`}
          sub="das vagas preenchidas"
          icon={<Activity className="w-4 h-4 text-zinc-400" />}
        />
        <StatCard
          label="Cancelamentos"
          value={String(metrics.cancellationsToday)}
          sub="aulas hoje"
          icon={
            <AlertCircle
              className={cn(
                "w-4 h-4",
                metrics.cancellationsToday > 0 ? "text-red-500" : "text-zinc-400"
              )}
            />
          }
          valueClassName={metrics.cancellationsToday > 0 ? "text-red-600" : ""}
          subClassName={metrics.cancellationsToday > 0 ? "text-red-500 font-medium" : ""}
        />
        <StatCard
          label="Receita Estimada"
          value={metrics.estimatedRevenue.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
            maximumFractionDigits: 0,
          })}
          sub="este mês"
          icon={<DollarSign className="w-4 h-4 text-zinc-400" />}
        />
      </div>

      {/* Main grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Today's schedule */}
        <section className="lg:col-span-2 bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="h-1.5 bg-brand" />
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-brand" />
              <h2 className="text-sm font-semibold text-foreground">Agenda do Dia</h2>
            </div>
            <Link
              href="/admin-lessons"
              className="text-xs font-medium text-brand hover:text-brand-dark transition-colors"
            >
              Ver todas
            </Link>
          </div>
          <div className="divide-y divide-border">
            {todaysLessons.length === 0 ? (
              <p className="px-6 py-8 text-sm text-center text-muted-foreground">
                Nenhuma aula agendada para hoje.
              </p>
            ) : (
              todaysLessons.map((lesson) => (
                <div key={lesson.id} className="px-6 py-3.5 flex items-center gap-4">
                  <div className="w-12 shrink-0 text-center">
                    <p className="text-sm font-bold tabular-nums text-foreground">{lesson.time}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{lesson.professorName}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <MapPin className="w-3 h-3 text-zinc-400 shrink-0" />
                      <p className="text-xs text-zinc-400 truncate">
                        {lesson.court} · {lesson.level}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <p className="text-xs text-zinc-400 tabular-nums">
                      {lesson.enrolledCount}/{lesson.totalSpots}
                    </p>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
                        LESSON_STATUS_CLASSES[lesson.status]
                      )}
                    >
                      {LESSON_STATUS_LABELS[lesson.status]}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Alerts & retention */}
        <section className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-semibold text-foreground">Alertas e Retenção</h2>
          </div>
          <div className="divide-y divide-border">
            {alerts.length === 0 ? (
              <p className="px-5 py-8 text-sm text-center text-muted-foreground">
                Nenhum alerta no momento.
              </p>
            ) : (
              alerts.map((alert) => (
                <div key={alert.id} className="px-5 py-3 flex items-start gap-3">
                  <div className="mt-0.5 shrink-0">
                    <AlertIcon type={alert.type} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground">{alert.message}</p>
                    <p className="text-xs text-zinc-400 truncate mt-0.5">{alert.detail}</p>
                  </div>
                  <Link
                    href={alert.href}
                    className="shrink-0 text-xs font-semibold text-brand hover:text-brand-dark transition-colors"
                  >
                    Ver
                  </Link>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* ── Bottom row: Radar + Audit ──────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">

        {/* Radar Operacional */}
        <section className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="h-1 bg-amber-400" />
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-semibold text-foreground">Radar Operacional</h2>
            {operationalAlerts.length > 0 && (
              <span className="ml-auto inline-flex items-center rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-600">
                {operationalAlerts.length} gargalho{operationalAlerts.length > 1 ? "s" : ""}
              </span>
            )}
          </div>
          <div className="divide-y divide-border">
            {operationalAlerts.length === 0 ? (
              <div className="px-5 py-8 flex flex-col items-center gap-2 text-center">
                <Activity className="w-5 h-5 text-green-500" />
                <p className="text-sm font-medium text-foreground">Grade sem gargalos</p>
                <p className="text-xs text-muted-foreground">Nenhuma aula fantasma ou lotada detectada para amanhã.</p>
              </div>
            ) : (
              operationalAlerts.map((alert) => (
                <div key={alert.lessonId} className="px-5 py-3.5 flex items-start gap-3">
                  <div className="mt-0.5">
                    <OperationalAlertIcon type={alert.type} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                          OPERATIONAL_ALERT_BADGE[alert.type]
                        )}
                      >
                        {OPERATIONAL_ALERT_LABELS[alert.type]}
                      </span>
                      <p className="text-xs font-semibold text-foreground">
                        {alert.professorName} · {alert.court}
                      </p>
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {new Date(alert.dateTime).toLocaleDateString("pt-BR", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                        timeZone: "America/Sao_Paulo",
                      })}
                      {" · "}{alert.level}{" · "}{alert.enrolledCount}/{alert.totalSpots} vagas
                    </p>
                    <p
                      className={cn(
                        "text-[11px] font-medium mt-1",
                        alert.type === "ghost_lesson" ? "text-red-500" : "text-amber-600"
                      )}
                    >
                      {alert.suggestion}
                    </p>
                  </div>
                  <Link
                    href="/class-management"
                    className="shrink-0 mt-0.5 text-xs font-semibold text-brand hover:text-brand-dark transition-colors"
                  >
                    Agir
                  </Link>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Log de Auditoria */}
        <section className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="h-1 bg-zinc-300 dark:bg-zinc-700" />
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-zinc-400" />
            <h2 className="text-sm font-semibold text-foreground">Log de Auditoria</h2>
            <span className="ml-auto text-[10px] font-medium text-zinc-400 uppercase tracking-wide">
              Alterações de Nível
            </span>
          </div>

          {auditLogs.length === 0 ? (
            <p className="px-5 py-8 text-sm text-center text-muted-foreground">
              Nenhuma alteração registrada.
            </p>
          ) : (
            <div className="px-5 py-4 space-y-0">
              {auditLogs.map((log, index) => (
                <div key={log.id} className="relative flex gap-3">
                  {/* timeline track */}
                  {index < auditLogs.length - 1 && (
                    <div className="absolute left-[13px] top-7 bottom-0 w-px bg-border" />
                  )}

                  {/* dot */}
                  <div className="mt-1 w-[26px] h-[26px] shrink-0 rounded-full bg-brand-subtle border-2 border-brand flex items-center justify-center z-10">
                    <ShieldAlert className="w-3 h-3 text-brand" />
                  </div>

                  <div className={cn("pb-4 flex-1 min-w-0", index === auditLogs.length - 1 && "pb-0")}>
                    <p className="text-xs font-semibold text-foreground leading-snug">
                      {log.actorName}
                      <span className="text-zinc-400 font-normal"> alterou </span>
                      {log.targetName}
                    </p>
                    <p className="flex items-center gap-1 text-xs text-zinc-400 mt-0.5">
                      <span className="font-medium text-zinc-500">{log.previousValue}</span>
                      <ArrowRight className="w-3 h-3 shrink-0" />
                      <span className="font-semibold text-brand-dark">{log.newValue}</span>
                    </p>
                    <p className="text-[10px] text-zinc-400 mt-0.5">{relativeTime(log.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  )
}

export function AdminDashboard() {
  const {
    isLoading,
    metrics,
    todaysLessons,
    alerts,
    operationalAlerts,
    auditLogs,
  } = useAdminDashboard()

  if (isLoading) return <AdminDashboardSkeleton />

  return (
    <AdminDashboardView
      metrics={metrics}
      todaysLessons={todaysLessons}
      alerts={alerts}
      operationalAlerts={operationalAlerts}
      auditLogs={auditLogs}
    />
  )
}

// ─── Teacher Dashboard (presentation — receives all data as props) ─────────────

type TeacherDashboardViewProps = { name: string } & Omit<TeacherDashboardData, "isLoading">

function TeacherDashboardView({
  name,
  walletBalance,
  nextLesson,
  enrollments,
  frequencyRanking,
}: TeacherDashboardViewProps) {
  const totalEnrolled = enrollments.titular.length + enrollments.visitors.length
  const checkedInCount = [...enrollments.titular, ...enrollments.visitors].filter((e) => e.checkedIn).length

  return (
    <div className="px-5 py-6 lg:px-8 lg:py-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <p className="text-sm text-muted-foreground capitalize">
          {new Date().toLocaleDateString("pt-BR", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
        <h1 className="text-2xl font-bold text-foreground mt-0.5">
          Olá, {name.split(" ")[0]}
        </h1>
      </div>

      {/* Financial hero + quick stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard
          label="Ganhos Totais"
          value={`${walletBalance.toFixed(1)} Plays`}
          sub="saldo acumulado"
          icon={<Clock className="w-4 h-4 text-brand" />}
          accent
        />
        <StatCard
          label="Próxima Aula"
          value={
            nextLesson
              ? new Date(nextLesson.dateTime).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "short",
                })
              : "—"
          }
          sub={
            nextLesson
              ? new Date(nextLesson.dateTime).toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                  timeZone: "America/Sao_Paulo",
                })
              : "Sem aulas agendadas"
          }
          icon={<CalendarDays className="w-4 h-4 text-zinc-400" />}
        />
        <StatCard
          label="Check-ins"
          value={`${checkedInCount} / ${totalEnrolled}`}
          sub="confirmados hoje"
          icon={<UserCheck className="w-4 h-4 text-zinc-400" />}
        />
      </div>

      {/* Main grid: Next lesson management + Frequency ranking */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Next lesson card — 2/3 width */}
        <section className="lg:col-span-2 bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="h-1.5 bg-brand" />
          <div className="p-6 space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
                  Próxima Aula
                </p>
                {nextLesson ? (
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center gap-2 text-sm text-foreground font-medium">
                      <CalendarDays className="w-4 h-4 text-brand shrink-0" />
                      {new Date(nextLesson.dateTime).toLocaleDateString("pt-BR", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        hour: "2-digit",
                        minute: "2-digit",
                        timeZone: "America/Sao_Paulo",
                      })}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4 shrink-0" />
                      {nextLesson.court}
                      <LevelBadge level={nextLesson.level} size="sm" />
                    </div>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">Nenhuma aula agendada.</p>
                )}
              </div>
              {nextLesson && (
                <Link
                  href="/aulas"
                  className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-brand-dark px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
                >
                  <GraduationCap className="w-4 h-4" />
                  Gerenciar Aula
                </Link>
              )}
            </div>

            {/* Check-ins: Titulares */}
            {enrollments.titular.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <UserCheck className="w-3.5 h-3.5 text-brand" />
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Alunos Titulares
                  </p>
                </div>
                <div className="space-y-1">
                  {enrollments.titular.map((s) => (
                    <div
                      key={s.studentId}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg bg-muted/50"
                    >
                      <div className="w-7 h-7 rounded-lg bg-brand-dark/10 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-brand-dark">
                          {s.studentName.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{s.studentName}</p>
                        <p className="text-xs text-zinc-400">{s.studentLevel}</p>
                      </div>
                      {s.checkedIn ? (
                        <CheckCircle2 className="w-4 h-4 text-brand shrink-0" />
                      ) : (
                        <Circle className="w-4 h-4 text-zinc-300 shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Check-ins: Visitantes */}
            {enrollments.visitors.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <UserPlus className="w-3.5 h-3.5 text-zinc-400" />
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Visitantes / Convidados
                  </p>
                </div>
                <div className="space-y-1">
                  {enrollments.visitors.map((s) => (
                    <div
                      key={s.studentId}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg bg-muted/50"
                    >
                      <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-zinc-500">
                          {s.studentName.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{s.studentName}</p>
                        <p className="text-xs text-zinc-400">{s.studentLevel}</p>
                      </div>
                      {s.checkedIn ? (
                        <CheckCircle2 className="w-4 h-4 text-brand shrink-0" />
                      ) : (
                        <Circle className="w-4 h-4 text-zinc-300 shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {enrollments.titular.length === 0 && enrollments.visitors.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum aluno inscrito nesta aula ainda.
              </p>
            )}
          </div>
        </section>

        {/* Frequency ranking — 1/3 width */}
        <section className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-brand" />
            <p className="text-sm font-semibold text-foreground">Ranking de Frequência</p>
          </div>
          <div className="divide-y divide-border">
            {frequencyRanking.map((entry, index) => (
              <div key={entry.studentId} className="px-5 py-3 flex items-center gap-3">
                <span
                  className={cn(
                    "w-5 text-center text-xs font-bold shrink-0",
                    index === 0 && "text-amber-500",
                    index === 1 && "text-zinc-400",
                    index === 2 && "text-amber-700",
                    index > 2 && "text-zinc-300"
                  )}
                >
                  {index === 0 ? <Trophy className="w-4 h-4 inline" /> : `${index + 1}º`}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{entry.studentName}</p>
                  <p className="text-xs text-zinc-400">{entry.studentLevel}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold tabular-nums text-brand-dark">
                    {entry.totalCheckIns}
                  </p>
                  <p className="text-[10px] text-zinc-400">aulas</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

// ─── Smart container — calls the hook and feeds the dumb view ─────────────────

function TeacherDashboard({ name }: { name: string }) {
  const { isLoading, walletBalance, nextLesson, enrollments, frequencyRanking } =
    useTeacherDashboard()

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-brand" />
        <p className="text-sm font-medium text-muted-foreground">Carregando painel...</p>
      </div>
    )
  }

  return (
    <TeacherDashboardView
      name={name}
      walletBalance={walletBalance}
      nextLesson={nextLesson}
      enrollments={enrollments}
      frequencyRanking={frequencyRanking}
    />
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function DashboardPageContent() {
  const {
    isLoading,
    role,
    student,
    wallet,
    lessons,
    plan,
    usedPlays = 0,
    progressPct = 0,
    expiresAt = null,
    daysLeft = 0,
    isExpired = false,
    rawLevel = "Iniciante",
    formattedCurrentLevel = "Iniciante",
    studentLevelIndex = 0,
    nextLesson,
    currentUser,
  } = useDashboard()

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-brand" />
        <p className="text-sm font-medium text-muted-foreground">Sincronizando dados...</p>
      </div>
    )
  }

  if (role === "ADMIN") return null // admin tem rota própria: /painel
  if (role === "TEACHER") return <TeacherDashboard name={currentUser?.name || ""} />

  if (!student || !wallet || !lessons || !plan) return null

  return (
    <div className="px-5 py-6 lg:px-8 lg:py-8 max-w-5xl mx-auto space-y-8">
      {/* Page header */}
      <div>
        <p className="text-sm text-muted-foreground capitalize">
          {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
        <h1 className="text-2xl font-bold text-foreground mt-0.5">
          Olá, {student.name.split(" ")[0]}
        </h1>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Saldo atual"
          value={`${wallet.balance.toFixed(1)} Plays`}
          sub="restantes"
          icon={<Clock className="w-4 h-4 text-brand" />}
          accent
        />
        <StatCard
          label="Plano"
          value={plan.label}
          sub={`R$ ${plan.price.toLocaleString("pt-BR")}`}
          icon={<ShieldCheck className="w-4 h-4 text-zinc-400" />}
        />
        {/* 👇 CARD DE VENCIMENTO CORRIGIDO */}
        <StatCard
          label="Vencimento"
          value={!expiresAt ? "Sem data" : isExpired ? "Vencido" : `${daysLeft} dias`}
          sub={!expiresAt ? "Contrate um plano" : isExpired ? "Renove seu plano" : expiresAt.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
          icon={<CalendarCheck2 className={cn("w-4 h-4", isExpired ? "text-red-500" : "text-zinc-400")} />}
          valueClassName={isExpired ? "text-red-600" : ""}
          subClassName={isExpired ? "text-red-500 font-medium" : ""}
        />
        <StatCard
          label="Consumido"
          value={`${usedPlays.toFixed(1)} Plays`}
          sub={`de ${wallet.totalPlays.toFixed(2)} Plays`}
          icon={<TrendingDown className="w-4 h-4 text-zinc-400" />}
        />
      </div>

      {/* Main content grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2 bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="h-1.5 bg-brand" />
          <div className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
                  Carteira de Plays
                </p>
                <div className="flex items-end gap-2 mt-1">
                  <span className={cn("text-5xl font-bold leading-none tabular-nums", isExpired ? "text-red-600" : "text-foreground")}>
                    {isExpired ? "0.00" : wallet.balance.toFixed(2)}
                  </span>
                  <span className="text-lg font-medium text-zinc-400 mb-1">Plays</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {usedPlays.toFixed(1)} Plays utilizados de {wallet.totalPlays.toFixed(2)} Plays totais
                </p>
              </div>

              <div className="relative w-16 h-16 shrink-0">
                <CircularProgress value={isExpired ? 0 : progressPct} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold text-brand">{isExpired ? 0 : Math.round(progressPct)}%</span>
                </div>
              </div>
            </div>

            <div className="mt-5">
              <div className="flex items-center justify-between mb-1.5 text-xs text-zinc-400">
                <span>0</span>
                <span>{wallet.totalPlays.toFixed(2)} Plays</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand rounded-full transition-all"
                  style={{ width: `${isExpired ? 0 : progressPct}%` }}
                />
              </div>
            </div>

            <div className="mt-5 flex items-center gap-3 flex-wrap">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-subtle border border-brand/20 px-3 py-1 text-xs font-semibold text-brand-dark">
                {plan.label} · R$ {plan.price.toLocaleString("pt-BR")}
              </span>
              <span className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
                isExpired
                  ? "bg-red-50 border border-red-200 text-red-600"
                  : daysLeft <= 7 && expiresAt
                  ? "bg-amber-50 border border-amber-200 text-amber-600"
                  : "bg-muted border border-border text-muted-foreground"
              )}>
                {!expiresAt ? "Plano Inativo" : isExpired ? "Plano Expirado" : `Vence em ${daysLeft} dias`}
              </span>
            </div>

            {nextLesson && (
              <div className="mt-5 pt-5 border-t border-border">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                  Próxima aula confirmada
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-brand-dark flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-white">
                      {nextLesson.professorName.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {nextLesson.professorName}
                    </p>
                    <p className="text-xs text-zinc-400">
                      {new Date(nextLesson.dateTime).toLocaleDateString("pt-BR", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                        timeZone: "America/Sao_Paulo",
                      })}
                      {" · "}
                      {nextLesson.court}
                    </p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-sm font-bold text-brand-dark">
                      -{nextLesson.previewConsumption ?? 0}P
                    </p>
                    {!nextLesson.isPeak && (
                      <p className="text-[10px] text-brand font-semibold">Fora de Pico</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* 👇 LISTA DE NÍVEIS CORRIGIDA */}
        <section className="bg-card rounded-2xl border border-border shadow-sm p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-4">
            Meu Nível
          </p>

          <div className="flex flex-col items-center py-2">
            <div className="w-16 h-16 rounded-2xl bg-brand-dark flex items-center justify-center mb-3">
              <span className="text-white font-bold text-lg">{rawLevel.charAt(0)}</span>
            </div>
            <LevelBadge level={rawLevel} size="md" className="mb-1" />
            <p className="text-xs text-zinc-400 text-center mt-2 leading-relaxed">
              Você pode se inscrever em aulas até o seu nível
            </p>
          </div>

          <div className="mt-5 space-y-1">
            {STUDENT_LEVELS.slice().reverse().map((lvl) => {
              const lvlIndex = STUDENT_LEVELS.indexOf(lvl)
              // Compara a string da lista com a nossa string formatada ou com a raw
              const isCurrent = lvl === formattedCurrentLevel || lvl === rawLevel
              const isAccessible = lvlIndex <= studentLevelIndex

              return (
                <div
                  key={lvl}
                  className={cn(
                    "flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium",
                    isCurrent && "bg-brand-subtle",
                    !isCurrent && isAccessible && "text-zinc-500",
                    !isAccessible && "text-zinc-300"
                  )}
                >
                  <div
                    className={cn(
                      "w-1.5 h-1.5 rounded-full shrink-0",
                      isCurrent ? "bg-brand" : isAccessible ? "bg-zinc-300" : "bg-zinc-200 dark:bg-zinc-800"
                    )}
                  />
                  <span className={isCurrent ? "text-brand-dark font-semibold" : ""}>
                    {lvl}
                  </span>
                  {isCurrent && (
                    <span className="ml-auto text-[10px] font-bold text-brand uppercase tracking-wide">
                      Você
                    </span>
                  )}
                  {!isAccessible && (
                    <span className="ml-auto text-[10px] text-zinc-300">Bloqueado</span>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      </div>

      {/* Upcoming lessons */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-foreground">Próximas Aulas</h2>
          <span className="text-xs text-zinc-400">Ordenado por data</span>
        </div>
        <UpcomingLessonsSection
          lessons={lessons}
          studentLevelIndex={studentLevelIndex}
          walletBalance={wallet.balance}
        />
      </section>

      {/* Recent transactions */}
      <section className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">Histórico de Consumo</h2>
          <Link href="/carteira" className="text-xs font-medium text-brand hover:text-brand-dark transition-colors">
            Ver carteira completa
          </Link>
        </div>

        <div className="divide-y divide-border">
          {wallet.transactions && wallet.transactions.length > 0 ? (
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            wallet.transactions.slice(0, 5).map((tx: any) => (
              <div key={tx.id} className="px-6 py-3.5 flex items-center gap-4">
                <div
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                    tx.type === "debit" ? "bg-red-50" : "bg-brand-subtle"
                  )}
                >
                  {tx.type === "debit" ? (
                    <TrendingDown className="w-4 h-4 text-red-400" />
                  ) : (
                    <ShieldCheck className="w-4 h-4 text-brand" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {tx.type === "credit"
                      ? `Recarga de Plays`
                      : `Aula com Professor`}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <p className="text-xs text-zinc-400">
                      {tx.createdAt 
                        ? new Date(tx.createdAt).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "Recente"}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p
                    className={cn(
                      "text-sm font-bold tabular-nums",
                      tx.type === "debit" ? "text-red-500" : "text-brand-dark"
                    )}
                  >
                    {tx.type === "debit" ? "-" : "+"}
                    {Math.abs(tx.amount).toFixed(1)} Plays
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="px-6 py-8 text-center">
              <p className="text-sm text-muted-foreground">Nenhuma transação recente encontrada.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  icon,
  accent = false,
  valueClassName,
  subClassName,
}: {
  label: string
  value: string
  sub: string
  icon: React.ReactNode
  accent?: boolean
  valueClassName?: string
  subClassName?: string
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-4",
        accent
          ? "bg-foreground text-background border-foreground"
          : "bg-card border-border shadow-sm"
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <p className={cn("text-xs font-medium", accent ? "text-background/70" : "text-muted-foreground")}>
          {label}
        </p>
        <div className={accent ? "opacity-60" : ""}>{icon}</div>
      </div>
      <p className={cn("text-xl font-bold tabular-nums", accent ? "text-background" : "text-foreground", valueClassName)}>
        {value}
      </p>
      <p className={cn("text-xs mt-0.5", accent ? "text-background/60" : "text-zinc-400", subClassName)}>
        {sub}
      </p>
    </div>
  )
}

function CircularProgress({ value }: { value: number }) {
  const radius = 26
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference - (value / 100) * circumference

  return (
    <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
      <circle cx="32" cy="32" r={radius} fill="none" stroke="currentColor" strokeWidth="5" className="text-muted" />
      <circle
        cx="32" cy="32" r={radius} fill="none" stroke="currentColor" strokeWidth="5"
        strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={dashOffset}
        className="text-brand transition-all duration-500"
      />
    </svg>
  )
}