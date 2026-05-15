import { z } from "zod"

export const PlanFormSchema = z.object({
  id: z.string().min(1, "ID obrigatório").regex(/^[a-z0-9-]+$/, "Somente letras minúsculas, números e hifens"),
  label: z.string().min(2, "Mínimo 2 caracteres"),
  totalPlays: z.number().int().positive("Mínimo 1"),
  validityDays: z.number().int().positive("Mínimo 1"),
  priceInCents: z.number().int().positive("Mínimo R$ 0,01"),
  popular: z.boolean(),
})

export type PlanFormData = z.infer<typeof PlanFormSchema>

export const PlayPackageFormSchema = z.object({
  id: z.string().min(1, "ID obrigatório").regex(/^[a-z0-9-]+$/, "Somente letras minúsculas, números e hifens"),
  label: z.string().min(2, "Mínimo 2 caracteres"),
  plays: z.number().int().positive("Mínimo 1"),
  priceInCents: z.number().int().positive("Mínimo R$ 0,01"),
  popular: z.boolean(),
})

export type PlayPackageFormData = z.infer<typeof PlayPackageFormSchema>
