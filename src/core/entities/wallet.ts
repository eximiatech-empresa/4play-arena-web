import { z } from "zod"

export const PlanSchema = z.enum(["mensal", "trimestral", "semestral"])

export const TransactionTypeSchema = z.enum(["debit", "credit", "expiration", "adjustment"])

export const TransactionSchema = z.object({
  id: z.string(),
  walletId: z.string(),
  lessonId: z.string().nullable(),
  type: TransactionTypeSchema,
  /** Negative for debits, positive for credits */
  hours: z.number(),
  balanceAfter: z.number().nonnegative(),
  professorName: z.string().nullable(),
  classLevel: z.string().nullable(),
  isOffPeak: z.boolean().nullable(),
  createdAt: z.string(), // ISO 8601
})

export const WalletSchema = z.object({
  id: z.string(),
  studentId: z.string(),
  balance: z.number().nonnegative(),
  totalHours: z.number().positive(),
  plan: PlanSchema,
  planValue: z.number().positive(),
  expiresAt: z.string(), // ISO date (YYYY-MM-DD)
  transactions: z.array(TransactionSchema),
})

export type Plan = z.infer<typeof PlanSchema>
export type Transaction = z.infer<typeof TransactionSchema>
export type Wallet = z.infer<typeof WalletSchema>
