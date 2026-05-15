import { z } from "zod"

export const PlanConfigSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  totalPlays: z.number().int().positive(),
  validityDays: z.number().int().positive(),
  priceInCents: z.number().int().positive(),
  playValue: z.number().positive(),
  popular: z.boolean().optional(),
})
export type PlanConfig = z.infer<typeof PlanConfigSchema>
