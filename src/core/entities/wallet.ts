import { z } from "zod"

export const PlanSchema = z.enum(["mensal", "trimestral", "semestral"])

export const TransactionTypeSchema = z.enum(["debit", "credit", "expiration", "adjustment", "purchase"])

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
  isOffPeak: z.boolean().nullable(),
  createdAt: z.string(), 
})

export const WalletSchema = z.object({
  id: z.string(),
  studentId: z.string(),
  balance: z.number().nonnegative(),
  totalPlays: z.number().positive(),
  plan: PlanSchema,
  planValue: z.number().positive(),
  expiresAt: z.string(), 
  transactions: z.array(TransactionSchema),
})

export type Plan = z.infer<typeof PlanSchema>
export type Transaction = z.infer<typeof TransactionSchema>
export type Wallet = z.infer<typeof WalletSchema>
