// src/core/entities/wallet.ts

import { z } from "zod"

export const PlanSchema = z.enum(["mensal", "trimestral", "semestral"])

export const TransactionTypeSchema = z.enum([
  "debit",
  "credit",
  "expiration",
  "adjustment",
  "purchase",
])

export const TransactionSchema = z.object({
  id: z.string(),
  walletId: z.string(),
  studentId: z.string(),
  lessonId: z.string().nullable(),
  type: TransactionTypeSchema,
  amount: z.number(),
  balanceAfter: z.number().nonnegative(),
  professorName: z.string().nullable(),
  classLevel: z.string().nullable(),
  /** True when the class falls inside the peak window (18h–20h). */
  isPeak: z.boolean().nullable().optional(),
  /**
   * @deprecated Renamed to isPeak. Retained for backward-compat with legacy
   * Firestore documents and features that have not been migrated yet.
   */
  isOffPeak: z.boolean().nullable().optional(),
  /** True when the student is a reserva (non-titular) in the class. */
  isReserva: z.boolean().nullable().optional(),
  /** Monetary value of one Play for the student's plan at the time of the transaction. */
  playValue: z.number().positive().nullable().optional(),
  createdAt: z.string(),
})

export const WalletSchema = z.object({
  id: z.string(),
  studentId: z.string(),
  balance: z.number().nonnegative(),
  totalPlays: z.number().positive(),
  plan: PlanSchema,
  /** Monetary value of one Play for this wallet's plan. */
  playValue: z.number().positive().optional(),
  /**
   * @deprecated Renamed to playValue. Retained for backward-compat with legacy
   * Firestore documents and features that have not been migrated yet.
   */
  planValue: z.number().positive().optional(),
  expiresAt: z.string(),
  transactions: z.array(TransactionSchema),
})

export type Plan = z.infer<typeof PlanSchema>
export type Transaction = z.infer<typeof TransactionSchema>
export type Wallet = z.infer<typeof WalletSchema>
