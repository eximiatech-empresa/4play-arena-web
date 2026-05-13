// src/features/wallet/components/transaction-list.tsx
"use client"
import { useState } from "react"
import { TrendingDown, Plus, ArrowDownUp, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { LevelBadge } from "@/components/shared/level-badge"
import { formatDateTimeBR } from "@/utils/formatters"
import type { Transaction, Plan } from "@/core/entities/wallet"

const ITEMS_PER_PAGE = 5

interface TransactionListProps {
  transactions: Transaction[]
  plan: Plan
}

function getTransactionDescription(tx: Transaction, plan: Plan): string {
  if (tx.type === "credit" || tx.type === "purchase") {
    const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1)
    return `Recarga - Plano ${planLabel}`
  }
  if (tx.type === "package") return "Pacote Extra de Plays"
  if (tx.type === "debit" && tx.professorName) return `Aula com ${tx.professorName}`
  if (tx.type === "expiration") return "Plays expirados"
  if (tx.type === "adjustment") return "Ajuste administrativo"
  return "Movimentação"
}

export function TransactionList({ transactions, plan }: TransactionListProps) {
  const [currentPage, setCurrentPage] = useState(1)

  if (transactions.length === 0) {
    return (
      <div className="bg-card rounded-2xl border border-border shadow-sm p-8 text-center">
        <ArrowDownUp className="w-8 h-8 text-zinc-300 mx-auto mb-3" />
        <p className="text-sm font-medium text-muted-foreground">Nenhuma movimentação ainda</p>
        <p className="text-xs text-zinc-400 mt-1">Seu histórico aparecerá aqui</p>
      </div>
    )
  }

  const totalPages = Math.ceil(transactions.length / ITEMS_PER_PAGE)
  const start = (currentPage - 1) * ITEMS_PER_PAGE
  const paginated = transactions.slice(start, start + ITEMS_PER_PAGE)

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-border">
        <h2 className="text-base font-semibold text-foreground">Histórico de Movimentações</h2>
        <p className="text-xs text-zinc-400 mt-0.5">
          {transactions.length} transaç{transactions.length === 1 ? "ão" : "ões"} registrada
          {transactions.length === 1 ? "" : "s"}
        </p>
      </div>

      <div className="divide-y divide-border">
        {paginated.map((tx) => (
          <TransactionRow key={tx.id} transaction={tx} plan={plan} />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="px-6 py-3 border-t border-border flex items-center justify-between gap-4">
          <span className="text-xs text-zinc-400">
            Página {currentPage} de {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function TransactionRow({ transaction: tx, plan }: { transaction: Transaction; plan: Plan }) {
  const isCredit = tx.type === "credit" || tx.type === "purchase"

  return (
    <div className="px-6 py-3.5 flex items-center gap-4">
      <div
        className={cn(
          "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
          isCredit ? "bg-brand-subtle" : "bg-red-50",
        )}
      >
        {isCredit ? (
          <Plus className="w-4 h-4 text-brand" />
        ) : (
          <TrendingDown className="w-4 h-4 text-red-400" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          {getTransactionDescription(tx, plan)}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          <p className="text-xs text-zinc-400">{formatDateTimeBR(tx.createdAt)}</p>
          {tx.classLevel && <LevelBadge level={tx.classLevel} size="xs" />}
          {tx.isPeak === false && (
            <span className="text-[9px] font-semibold text-brand uppercase tracking-wide">
              Fora de Pico
            </span>
          )}
        </div>
      </div>

      <div className="text-right shrink-0">
        <p className={cn("text-sm font-bold tabular-nums", isCredit ? "text-brand-dark" : "text-red-500")}>
          {isCredit ? "+" : "-"}
          {Math.abs(tx.amount).toFixed(2)} P
        </p>
        <p className="text-xs text-zinc-400 tabular-nums">Saldo: {tx.balanceAfter.toFixed(2)}</p>
      </div>
    </div>
  )
}
