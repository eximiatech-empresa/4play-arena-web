import { Clock, TrendingDown, CalendarCheck2, ShieldCheck } from "lucide-react"
import { MOCK_WALLET } from "@/features/wallet/mock-data"
import { MOCK_LESSONS } from "@/features/booking/mock-data"
import { MOCK_STUDENT } from "@/features/profile/mock-data"
import { PLANS, STUDENT_LEVELS } from "@/core/constants/professors"
import { LevelBadge } from "@/components/shared/level-badge"
import { UpcomingLessonsSection } from "./upcoming-lessons-section"
import { cn } from "@/lib/utils"

export function DashboardPageContent() {
  const wallet = MOCK_WALLET
  const lessons = MOCK_LESSONS
  const student = MOCK_STUDENT
  const plan = PLANS[wallet.plan]

  const usedHours = wallet.totalHours - wallet.balance
  const progressPct = Math.round((wallet.balance / wallet.totalHours) * 100)

  const expiresAt = new Date(wallet.expiresAt)
  const today = new Date()
  const daysLeft = Math.ceil(
    (expiresAt.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  )

  const nextLesson = lessons.find(
    (l) => l.checkInStatus !== "closed" && l.isEnrolled
  )

  return (
    <div className="px-5 py-6 lg:px-8 lg:py-8 max-w-5xl mx-auto space-y-8">
      {/* Page header */}
      <div>
        <p className="text-sm text-zinc-500 capitalize">
          {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
        <h1 className="text-2xl font-bold text-zinc-900 mt-0.5">
          Olá, {student.name.split(" ")[0]}
        </h1>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Saldo atual"
          value={`${wallet.balance}h`}
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
        <StatCard
          label="Vencimento"
          value={`${daysLeft} dias`}
          sub={expiresAt.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
          icon={<CalendarCheck2 className="w-4 h-4 text-zinc-400" />}
        />
        <StatCard
          label="Consumido"
          value={`${usedHours.toFixed(2)}h`}
          sub={`de ${wallet.totalHours}h`}
          icon={<TrendingDown className="w-4 h-4 text-zinc-400" />}
        />
      </div>

      {/* Main content grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Wallet card — 2/3 width */}
        <section className="lg:col-span-2 bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
          <div className="h-1.5 bg-brand" />
          <div className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
                  Carteira de Horas
                </p>
                <div className="flex items-end gap-2 mt-1">
                  <span className="text-5xl font-bold text-zinc-900 leading-none tabular-nums">
                    {wallet.balance.toFixed(1)}
                  </span>
                  <span className="text-lg font-medium text-zinc-400 mb-1">h</span>
                </div>
                <p className="text-sm text-zinc-500 mt-1">
                  {usedHours.toFixed(2)}h utilizadas de {wallet.totalHours}h totais
                </p>
              </div>

              <div className="relative w-16 h-16 shrink-0">
                <CircularProgress value={progressPct} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold text-brand">{progressPct}%</span>
                </div>
              </div>
            </div>

            <div className="mt-5">
              <div className="flex items-center justify-between mb-1.5 text-xs text-zinc-400">
                <span>0h</span>
                <span>{wallet.totalHours}h</span>
              </div>
              <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand rounded-full transition-all"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            <div className="mt-5 flex items-center gap-3 flex-wrap">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-subtle border border-brand/20 px-3 py-1 text-xs font-semibold text-brand-dark">
                {plan.label} · R$ {plan.price.toLocaleString("pt-BR")}
              </span>
              <span className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
                daysLeft <= 7
                  ? "bg-red-50 border border-red-200 text-red-600"
                  : "bg-zinc-50 border border-zinc-200 text-zinc-500"
              )}>
                Vence em {daysLeft} dias
              </span>
            </div>

            {nextLesson && (
              <div className="mt-5 pt-5 border-t border-zinc-100">
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
                    <p className="text-sm font-semibold text-zinc-800">
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
                      -{nextLesson.previewConsumption.toFixed(2)}h
                    </p>
                    {nextLesson.isOffPeak && (
                      <p className="text-[10px] text-brand font-semibold">Fora de Pico</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Level card — 1/3 width */}
        <section className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-4">
            Meu Nível
          </p>

          <div className="flex flex-col items-center py-2">
            <div className="w-16 h-16 rounded-2xl bg-brand-dark flex items-center justify-center mb-3">
              <span className="text-white font-bold text-lg">B</span>
            </div>
            <LevelBadge level={student.level} size="md" className="mb-1" />
            <p className="text-xs text-zinc-400 text-center mt-2 leading-relaxed">
              Você pode se inscrever em aulas até Nível B
            </p>
          </div>

          <div className="mt-5 space-y-1">
            {STUDENT_LEVELS.slice().reverse().map((lvl) => {
              const lvlIndex = STUDENT_LEVELS.indexOf(lvl)
              const isCurrent = lvl === student.level
              const isAccessible = lvlIndex <= student.levelIndex
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
                      isCurrent ? "bg-brand" : isAccessible ? "bg-zinc-300" : "bg-zinc-200"
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
          <h2 className="text-base font-semibold text-zinc-800">Próximas Aulas</h2>
          <span className="text-xs text-zinc-400">Ordenado por data</span>
        </div>
        <UpcomingLessonsSection
          lessons={lessons}
          studentLevelIndex={student.levelIndex}
          walletBalance={wallet.balance}
        />
      </section>

      {/* Recent transactions */}
      <section className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-zinc-800">Histórico de Consumo</h2>
          <button className="text-xs font-medium text-brand hover:text-brand-dark transition-colors">
            Ver tudo
          </button>
        </div>

        <div className="divide-y divide-zinc-50">
          {wallet.transactions.map((tx) => (
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
                <p className="text-sm font-medium text-zinc-800 truncate">
                  {tx.type === "credit"
                    ? `Recarga — Plano ${wallet.plan.charAt(0).toUpperCase() + wallet.plan.slice(1)}`
                    : `Aula com ${tx.professorName}`}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <p className="text-xs text-zinc-400">
                    {new Date(tx.createdAt).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                  {tx.classLevel && <LevelBadge level={tx.classLevel} size="xs" />}
                  {tx.isOffPeak && (
                    <span className="text-[9px] font-semibold text-brand uppercase tracking-wide">
                      Fora de Pico
                    </span>
                  )}
                </div>
              </div>

              <div className="text-right shrink-0">
                <p
                  className={cn(
                    "text-sm font-bold tabular-nums",
                    tx.type === "debit" ? "text-red-500" : "text-brand-dark"
                  )}
                >
                  {tx.type === "debit" ? "" : "+"}
                  {Math.abs(tx.hours).toFixed(2)}h
                </p>
                <p className="text-xs text-zinc-400 tabular-nums">
                  Saldo: {tx.balanceAfter.toFixed(2)}h
                </p>
              </div>
            </div>
          ))}
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
}: {
  label: string
  value: string
  sub: string
  icon: React.ReactNode
  accent?: boolean
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-4",
        accent
          ? "bg-brand-dark text-white border-brand-dark"
          : "bg-white border-zinc-100 shadow-sm"
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <p className={cn("text-xs font-medium", accent ? "text-white/70" : "text-zinc-500")}>
          {label}
        </p>
        <div className={accent ? "opacity-60" : ""}>{icon}</div>
      </div>
      <p className={cn("text-xl font-bold tabular-nums", accent ? "text-white" : "text-zinc-900")}>
        {value}
      </p>
      <p className={cn("text-xs mt-0.5", accent ? "text-white/60" : "text-zinc-400")}>
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
      <circle cx="32" cy="32" r={radius} fill="none" stroke="currentColor" strokeWidth="5" className="text-zinc-100" />
      <circle
        cx="32" cy="32" r={radius} fill="none" stroke="currentColor" strokeWidth="5"
        strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={dashOffset}
        className="text-brand transition-all duration-500"
      />
    </svg>
  )
}
