// src/features/wallet/components/transaction-list.tsx
import { TrendingDown, Plus, ArrowDownUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { LevelBadge } from "@/components/shared/level-badge"
import { formatDateTimeBR } from "@/utils/formatters"
import type { Transaction } from "@/core/entities/wallet"
import type { Plan } from "@/core/entities/wallet"

interface TransactionListProps {
  transactions: Transaction[]
  plan: Plan
}

function getTransactionDescription(tx: Transaction, plan: Plan): string {
  if (tx.type === "credit") {
    const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1)
    return `Recarga — Plano ${planLabel}`
  }
  if (tx.type === "debit" && tx.professorName) {
    return `Aula com ${tx.professorName}`
  }
  if (tx.type === "expiration") return "Horas expiradas"
  if (tx.type === "adjustment") return "Ajuste administrativo"
  return "Movimentação"
}

export function TransactionList({ transactions, plan }: TransactionListProps) {
  if (transactions.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-8 text-center">
        <ArrowDownUp className="w-8 h-8 text-zinc-300 mx-auto mb-3" />
        <p className="text-sm font-medium text-zinc-500">
          Nenhuma movimentação ainda
        </p>
        <p className="text-xs text-zinc-400 mt-1">
          Seu histórico de transações aparecerá aqui
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-zinc-100">
        <h2 className="text-base font-semibold text-zinc-800">
          Histórico de Movimentações
        </h2>
        <p className="text-xs text-zinc-400 mt-0.5">
          {transactions.length} transac{transactions.length === 1 ? "ao" : "oes"} registrada{transactions.length === 1 ? "" : "s"}
        </p>
      </div>

      <div className="divide-y divide-zinc-50">
        {transactions.map((tx) => (
          <TransactionRow key={tx.id} transaction={tx} plan={plan} />
        ))}
      </div>
    </div>
  )
}

function TransactionRow({
  transaction: tx,
  plan,
}: {
  transaction: Transaction
  plan: Plan
}) {
  const isCredit = tx.type === "credit"

  return (
    <div className="px-6 py-3.5 flex items-center gap-4">
      {/* Type indicator */}
      <div
        className={cn(
          "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
          isCredit ? "bg-brand-subtle" : "bg-red-50"
        )}
      >
        {isCredit ? (
          <Plus className="w-4 h-4 text-brand" />
        ) : (
          <TrendingDown className="w-4 h-4 text-red-400" />
        )}
      </div>

      {/* Description */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-zinc-800 truncate">
          {getTransactionDescription(tx, plan)}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          <p className="text-xs text-zinc-400">
            {formatDateTimeBR(tx.createdAt)}
          </p>
          {tx.classLevel && <LevelBadge level={tx.classLevel} size="xs" />}
          {tx.isOffPeak && (
            <span className="text-[9px] font-semibold text-brand uppercase tracking-wide">
              Fora de Pico
            </span>
          )}
        </div>
      </div>

      {/* Hours + balance after */}
      <div className="text-right shrink-0">
        <p
          className={cn(
            "text-sm font-bold tabular-nums",
            isCredit ? "text-brand-dark" : "text-red-500"
          )}
        >
          {isCredit ? "+" : "-"}
          {Math.abs(tx.hours).toFixed(2)}h
        </p>
        <p className="text-xs text-zinc-400 tabular-nums">
          Saldo: {tx.balanceAfter.toFixed(2)}h
        </p>
      </div>
    </div>
  )
}
