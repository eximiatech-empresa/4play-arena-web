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

export const InsightItemSchema = z.object({
  name: z.string(),
  count: z.number().int().nonnegative(),
})

export const MonthlyComparisonSchema = z.object({
  currentMonthClasses: z.number().int().nonnegative(),
  lastMonthClasses: z.number().int().nonnegative(),
  percentageChange: z.number(),
})

export const TeacherWalletInsightsSchema = z.object({
  topStudents: z.array(InsightItemSchema),
  mostMissed: z.array(InsightItemSchema),
  monthlyComparison: MonthlyComparisonSchema,
  yearlyEarnings: z.number().nonnegative(),
})

export const TeacherWalletResponseSchema = TeacherWalletSchema.extend({
  insights: TeacherWalletInsightsSchema,
})

export type InsightItem = z.infer<typeof InsightItemSchema>
export type MonthlyComparison = z.infer<typeof MonthlyComparisonSchema>
export type TeacherWalletInsights = z.infer<typeof TeacherWalletInsightsSchema>
export type TeacherWalletResponse = z.infer<typeof TeacherWalletResponseSchema>
