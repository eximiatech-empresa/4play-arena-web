import { z } from "zod"
import { StudentPlanSchema } from "./user"

export const StudentSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string().optional(),
  level: z.string(),
  levelIndex: z.number().int().min(0).max(6),
  memberSince: z.string(),
  totalClassesTaken: z.number().int().nonnegative(),
  totalPlaysConsumed: z.number().nonnegative(),
  // Firebase schema fields
  walletBalance: z.number().nonnegative().optional(),
  originalTeacherId: z.string().optional(),
  currentPlanId: StudentPlanSchema.optional(),
  planExpiresAt: z.string().optional(),
})

export type Student = z.infer<typeof StudentSchema>
