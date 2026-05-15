import { z } from "zod"

export const PlayPackageSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  plays: z.number().int().positive(),
  priceInCents: z.number().int().positive(),
  popular: z.boolean().optional().default(false),
})
export type PlayPackage = z.infer<typeof PlayPackageSchema>
