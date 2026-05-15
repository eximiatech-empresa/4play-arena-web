"use client"

import { useState } from "react"
import { Loader2, TrendingUp, CheckCircle2, ClockAlert, Info, Medal, UserX, CalendarDays, TrendingDown, Filter, ChevronDown, CalendarRange, List, BarChart } from "lucide-react"
import { useTeacherWallet, type TimeFilter } from "@/features/teacher/carteira/hooks/use-teacher-wallet"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import type { TeacherTransactionType } from "@/core/entities/teacher-wallet"
import { ResponsiveContainer, BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts"

const TRANSACTION_ICONS: Record<TeacherTransactionType, React.ReactNode> = {
  CHECK_IN_CREDIT: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
  LATE_CANCELLATION_CREDIT: <ClockAlert className="w-5 h-5 text-emerald-500" />,
  EXPIRED_PLAN_TRANSFER: <TrendingUp className="w-5 h-5 text-emerald-500" />,
}

const TRANSACTION_LABELS: Record<TeacherTransactionType, string> = {
  CHECK_IN_CREDIT: "Check-in na Aula",
  LATE_CANCELLATION_CREDIT: "Cancelamento Tardio",
  EXPIRED_PLAN_TRANSFER: "Transferência de Plano Vencido",
}

export function TeacherWalletPageContent() {
  const [filter, setFilter] = useState<TimeFilter>("this_year")
  const [viewMode, setViewMode] = useState<"list" | "chart">("list")
  const { balance, transactions, insights, isLoading, isError } = useTeacherWallet(filter)

  const chartData = transactions.reduce((acc, tx) => {
    const dateStr = new Date(tx.createdAt).toLocaleDateString("pt-BR", { day: '2-digit', month: 'short' });
    const existing = acc.find(item => item.date === dateStr);
    if (existing) {
      existing.Plays += tx.amount;
    } else {
      acc.push({ date: dateStr, Plays: tx.amount });
    }
    return acc;
  }, [] as { date: string; Plays: number }[]).reverse();

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-brand" />
        <p className="text-sm font-medium text-muted-foreground">Carregando carteira...</p>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <Info className="w-8 h-8 text-red-500" />
        <p className="text-sm font-medium text-muted-foreground">Erro ao carregar ganhos.</p>
      </div>
    )
  }

  return (
    <div className="px-5 py-6 lg:px-8 lg:py-8 max-w-5xl mx-auto space-y-8">
      {/* Hero / Header */}
      <section className="bg-card rounded-2xl border border-border shadow-sm p-6 md:p-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-emerald-500" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-zinc-400">
            Resumo Financeiro
          </p>
          <Select value={filter} onValueChange={(val) => setFilter(val as TimeFilter)}>
            <SelectTrigger className="w-[180px] bg-muted hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors border-border font-medium text-foreground">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-emerald-600" />
                <SelectValue placeholder="Período" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="this_week">Esta Semana</SelectItem>
              <SelectItem value="this_month">Este Mês</SelectItem>
              <SelectItem value="last_month">Mês Passado</SelectItem>
              <SelectItem value="this_year">Este Ano</SelectItem>
              <SelectItem value="all_time">Todo o Período</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-4 divide-y md:divide-y-0 md:divide-x divide-border">
          {/* Saldo Total Disponível */}
          <div className="flex flex-col items-center justify-center pb-4 md:pb-0">
            <div className="flex items-end gap-2">
              <span className="text-6xl font-bold leading-none tabular-nums text-foreground">
                {balance.toFixed(2)}
              </span>
              <span className="text-xl font-medium text-zinc-400 mb-1">
                Plays
              </span>
            </div>
            <p className="mt-4 text-sm text-emerald-600 font-medium bg-emerald-50 px-3 py-1 flex items-center gap-1.5 rounded-full border border-emerald-200">
              <CheckCircle2 className="w-4 h-4" />
              Saldo Total Disponível
            </p>
          </div>

          {/* Ganhos no Ano */}
          <div className="flex flex-col items-center justify-center pt-4 md:pt-0">
            <div className="flex items-end gap-2">
              <span className="text-5xl font-bold leading-none tabular-nums text-emerald-600">
                {insights.yearlyEarnings.toFixed(2)}
              </span>
              <span className="text-lg font-medium text-zinc-400 mb-1">
                Plays
              </span>
            </div>
            <p className="mt-4 text-sm text-zinc-600 font-medium bg-zinc-100 flex items-center gap-1.5 dark:bg-zinc-800 dark:text-zinc-300 px-3 py-1 rounded-full border border-zinc-200 dark:border-zinc-700">
              <CalendarRange className="w-4 h-4 text-zinc-500" />
              Total Ganho no Ano
            </p>
          </div>
        </div>
      </section>

      {/* Insights Section */}
      <div className="grid gap-4 md:grid-cols-3">
        <section className="bg-card rounded-2xl border border-border shadow-sm p-6 w-full flex flex-col h-full">
          <div className="flex items-center gap-2 mb-4 text-brand">
            <Medal className="w-5 h-5 shrink-0" />
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-widest">Alunos Frequentes</h2>
          </div>
          <div className="flex-1 space-y-3">
            {insights.topStudents.map((student: { name: string; count: number }, i: number) => (
              <div key={i} className="flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">{student.name}</p>
                <div className="flex items-center gap-1.5 bg-brand-subtle px-2 py-0.5 rounded-md">
                  <span className="text-xs font-bold text-brand-dark">{student.count}</span>
                  <span className="text-[10px] uppercase font-semibold text-brand">check-ins</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-card rounded-2xl border border-border shadow-sm p-6 w-full flex flex-col h-full">
          <div className="flex items-center gap-2 mb-4 text-red-500">
            <UserX className="w-5 h-5 shrink-0" />
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-widest">Maior Ausência</h2>
          </div>
          <div className="flex-1 space-y-3">
            {insights.mostMissed.map((student: { name: string; count: number }, i: number) => (
              <div key={i} className="flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">{student.name}</p>
                <div className="flex items-center gap-1.5 bg-red-50 px-2 py-0.5 rounded-md">
                  <span className="text-xs font-bold text-red-600">{student.count}</span>
                  <span className="text-[10px] uppercase font-semibold text-red-500">faltas</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-card rounded-2xl border border-border shadow-sm p-6 w-full flex flex-col h-full">
          <div className="flex items-center gap-2 mb-4 text-blue-500">
            <CalendarDays className="w-5 h-5 shrink-0" />
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-widest">Aulas no Mês</h2>
          </div>
          <div className="flex-1 flex flex-col justify-center gap-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-zinc-500 font-medium">Mês Atual</p>
              <p className="text-2xl font-bold text-foreground tabular-nums">{insights.monthlyComparison.currentMonthClasses}</p>
            </div>
            
            <div className="h-px bg-border w-full" />
            
            <div className="flex items-center justify-between">
              <p className="text-sm text-zinc-500 font-medium">Mês Passado</p>
              <div className="flex items-center gap-2">
                <p className="text-base font-semibold text-zinc-600 tabular-nums">{insights.monthlyComparison.lastMonthClasses}</p>
                
                {insights.monthlyComparison.percentageChange >= 0 ? (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                    <TrendingUp className="w-3 h-3" />
                    +{insights.monthlyComparison.percentageChange}%
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                    <TrendingDown className="w-3 h-3" />
                    {insights.monthlyComparison.percentageChange}%
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Histórico de Recebimentos */}
      <section className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Histórico de Recebimentos</h2>
          <div className="flex bg-muted p-1 rounded-md">
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-sm transition-colors",
                viewMode === "list"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <List className="w-3.5 h-3.5" />
              Lista
            </button>
            <button
              onClick={() => setViewMode("chart")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-sm transition-colors",
                viewMode === "chart"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <BarChart className="w-3.5 h-3.5" />
              Gráfico
            </button>
          </div>
        </div>

        {viewMode === "chart" ? (
          <div className="p-6 h-[400px] w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={12} 
                    tickLine={false}
                    axisLine={false}
                    dy={10}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={12} 
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}`}
                  />
                  <Tooltip 
                    cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }}
                    contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)" }}
                  />
                  <Bar dataKey="Plays" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={50} />
                </RechartsBarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-center">
                <p className="text-sm text-muted-foreground">Dados insuficientes para o gráfico neste período.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {transactions.length > 0 ? (
              transactions.map((tx) => (
                <div key={tx.id} className="px-6 py-4 flex items-start sm:items-center gap-4 flex-col sm:flex-row">
                  <div className="flex items-center gap-4 flex-1 w-full">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0 border border-emerald-100">
                      {TRANSACTION_ICONS[tx.type]}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {tx.studentName || "Aluno Não Identificado"}
                      </p>
                      <p className="text-xs font-medium text-zinc-500 mt-0.5">
                        {TRANSACTION_LABELS[tx.type]}
                      </p>
                      <p className="text-xs text-zinc-400 mt-1">
                        {new Date(tx.createdAt).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0 mt-2 sm:mt-0 ml-14 sm:ml-0">
                    <p className="text-lg font-bold tabular-nums text-emerald-600">
                      +{tx.amount.toFixed(2)} Plays
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-12 text-center">
                <p className="text-sm text-muted-foreground">Nenhum recebimento registrado ainda.</p>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
