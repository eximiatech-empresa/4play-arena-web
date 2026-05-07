"use client"

import { useState } from "react"
import { Loader2, Wallet, CheckCircle2, ClockAlert, TrendingUp, ArrowDownToLine, Info, Filter } from "lucide-react"
import { toast } from "sonner"
import { useTeacherWallet, type TimeFilter } from "@/features/wallet/hooks/use-teacher-wallet"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { TeacherTransactionType } from "@/core/entities/teacher-wallet"

const TX_ICONS: Record<TeacherTransactionType, React.ReactNode> = {
  CHECK_IN_CREDIT: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
  LATE_CANCELLATION_CREDIT: <ClockAlert className="w-4 h-4 text-emerald-500" />,
  EXPIRED_PLAN_TRANSFER: <TrendingUp className="w-4 h-4 text-emerald-500" />,
}

const TX_LABELS: Record<TeacherTransactionType, string> = {
  CHECK_IN_CREDIT: "Check-in na Aula",
  LATE_CANCELLATION_CREDIT: "Cancelamento Tardio",
  EXPIRED_PLAN_TRANSFER: "Transferência de Plano Vencido",
}

export function TeacherWallet() {
  const [filter, setFilter] = useState<TimeFilter>("this_month")
  const { balance, transactions, isLoading, isError } = useTeacherWallet(filter)

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-brand" />
        <span className="text-sm text-muted-foreground">Carregando carteira...</span>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-2">
        <Info className="w-6 h-6 text-red-500" />
        <p className="text-sm text-muted-foreground">Erro ao carregar ganhos.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Saldo */}
      <div className="bg-card rounded-2xl border border-border shadow-sm p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500" />

        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
              Saldo Total de Ganhos
            </p>
            <div className="flex items-end gap-1.5">
              <span className="text-4xl font-bold tabular-nums text-foreground">
                {balance.toFixed(2)}
              </span>
              <span className="text-base font-medium text-muted-foreground mb-0.5">Plays</span>
            </div>
          </div>

          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
            <Wallet className="w-6 h-6 text-emerald-600" />
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="mt-5 gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
          onClick={() => toast.info("Funcionalidade de saque em breve!")}
        >
          <ArrowDownToLine className="w-4 h-4" />
          Solicitar Saque
        </Button>
      </div>

      {/* Histórico de recebimentos */}
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-foreground">Recebimentos</h2>
          <Select value={filter} onValueChange={(v) => setFilter(v as TimeFilter)}>
            <SelectTrigger className="w-[160px] h-8 text-xs bg-muted border-border">
              <div className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-emerald-600" />
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

        <div className="divide-y divide-border">
          {transactions.length > 0 ? (
            transactions.slice(0, 20).map((tx) => (
              <div
                key={tx.id}
                className={cn(
                  "flex items-center gap-4 px-6 py-3.5",
                  "hover:bg-muted/40 transition-colors",
                )}
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                  {TX_ICONS[tx.type]}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {tx.studentName ?? "Aluno"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {TX_LABELS[tx.type]} &middot;{" "}
                    {new Date(tx.createdAt).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>

                <span className="text-sm font-bold tabular-nums text-emerald-600 shrink-0">
                  +{tx.amount.toFixed(2)}
                </span>
              </div>
            ))
          ) : (
            <div className="px-6 py-10 text-center">
              <p className="text-sm text-muted-foreground">Nenhum recebimento no período.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
