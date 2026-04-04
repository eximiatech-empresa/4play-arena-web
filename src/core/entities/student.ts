import { z } from "zod"

export const StudentSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string(),
  level: z.string(),
  levelIndex: z.number().int().min(0).max(6),
  memberSince: z.string(), // ISO date
  totalClassesTaken: z.number().int().nonnegative(),
  totalHoursConsumed: z.number().nonnegative(),
})

export type Student = z.infer<typeof StudentSchema>
