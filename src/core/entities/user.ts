import { z } from "zod"
import { PlanSchema } from "./wallet"

export const UserRoleSchema = z.enum(["ADMIN", "TEACHER", "STUDENT"])
export type UserRole = z.infer<typeof UserRoleSchema>

export const StudentPlanSchema = PlanSchema
export type StudentPlan = z.infer<typeof StudentPlanSchema>

const BaseUserSchema = z.object({
  uid: z.string(),
  name: z.string().min(1),
  email: z.string().email(),
  role: UserRoleSchema,
  createdAt: z.string(),
  isActive: z.boolean().default(true),
  mustChangePassword: z.boolean().default(false),
  phone: z.string().nullish(),
})

export const AdminUserSchema = BaseUserSchema.extend({
  role: z.literal("ADMIN"),
})
export type AdminUser = z.infer<typeof AdminUserSchema>

export const TeacherUserSchema = BaseUserSchema.extend({
  role: z.literal("TEACHER"),
  lessonPrice: z.number().nonnegative().default(0),
  earningsBalance: z.preprocess(
    (val) => typeof val === "number" && Number.isNaN(val) ? 0 : val,
    z.number().catch(0)
  ).default(0),
})
export type TeacherUser = z.infer<typeof TeacherUserSchema>

export const StudentUserSchema = BaseUserSchema.extend({
  role: z.literal("STUDENT"),
  level: z.string().optional().default("Iniciante"),
  walletBalance: z.preprocess(
    (val) => typeof val === "number" && Number.isNaN(val) ? 0 : val,
    z.number().catch(0)
  ),
  originalTeacherId: z.string().optional().default(""),
  currentPlanId: StudentPlanSchema.optional().default("mensal"),
  planExpiresAt: z.string().optional().default(""),
  planPlayValue: z.preprocess(
    (val) => typeof val === "number" && Number.isNaN(val) ? undefined : val,
    z.number().positive().optional()
  ),
})
export type StudentUser = z.infer<typeof StudentUserSchema>

export const UserSchema = z.discriminatedUnion("role", [
  AdminUserSchema,
  TeacherUserSchema,
  StudentUserSchema,
])
export type User = z.infer<typeof UserSchema>

export const CreateUserFormSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("E-mail inválido"),
  role: z.enum(["TEACHER", "ADMIN"] as const),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  lessonPrice: z.number({ error: "Informe um valor numérico" }).nonnegative("Deve ser ≥ 0").optional(),
}).superRefine((val, ctx) => {
  if (val.role === "TEACHER" && (val.lessonPrice === undefined || val.lessonPrice === null)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Preço da aula é obrigatório para Professores", path: ["lessonPrice"] })
  }
})
export type CreateUserFormData = z.infer<typeof CreateUserFormSchema>
