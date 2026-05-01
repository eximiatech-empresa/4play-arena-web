import { z } from "zod"

export const TeacherTransactionTypeSchema = z.enum([
  "CHECK_IN_CREDIT",
  "LATE_CANCELLATION_CREDIT",
  "EXPIRED_PLAN_TRANSFER",
])

export const TeacherTransactionSchema = z.object({
  id: z.string(),
  teacherId: z.string(),
  studentId: z.string(),
  studentName: z.string().optional(),
  lessonId: z.string().nullable().optional(),
  type: TeacherTransactionTypeSchema,
  amount: z.number().positive(),
  createdAt: z.string(), // ISO string or Firebase timestamp mapped downstream
})

export const TeacherWalletSchema = z.object({
  teacherId: z.string(),
  balance: z.number().nonnegative(),
  transactions: z.array(TeacherTransactionSchema),
})

export type TeacherTransactionType = z.infer<typeof TeacherTransactionTypeSchema>
export type TeacherTransaction = z.infer<typeof TeacherTransactionSchema>
export type TeacherWallet = z.infer<typeof TeacherWalletSchema>
