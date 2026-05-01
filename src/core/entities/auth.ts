import { z } from "zod"
import { StudentPlanSchema } from "./user"

export const LoginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
})

export const RegisterSchema = z
  .object({
    name: z
      .string()
      .min(2, "Nome deve ter no mínimo 2 caracteres")
      .max(100, "Nome muito longo"),
    email: z.string().email("E-mail inválido"),
    password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  })

export const OnboardingStep2Schema = z.object({
  plan: StudentPlanSchema,
})

export const OnboardingStep3Schema = z.object({
  originalTeacherId: z.string().min(1, "Selecione um professor"),
})

export const OnboardingSchema = z.object({
  name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres").max(100, "Nome muito longo"),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
  plan: StudentPlanSchema,
  originalTeacherId: z.string().min(1, "Selecione um professor"),
})

export type LoginInput = z.infer<typeof LoginSchema>
export type RegisterInput = z.infer<typeof RegisterSchema>
export type OnboardingStep2Input = z.infer<typeof OnboardingStep2Schema>
export type OnboardingStep3Input = z.infer<typeof OnboardingStep3Schema>
export type OnboardingInput = z.infer<typeof OnboardingSchema>
