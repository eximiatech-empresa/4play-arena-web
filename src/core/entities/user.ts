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
})
export type TeacherUser = z.infer<typeof TeacherUserSchema>

export const StudentUserSchema = BaseUserSchema.extend({
  role: z.literal("STUDENT"),
  level: z.string(),
  walletBalance: z.number().nonnegative(),
  originalTeacherId: z.string(),
  currentPlanId: StudentPlanSchema,
  planExpiresAt: z.string(),
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
})
export type CreateUserFormData = z.infer<typeof CreateUserFormSchema>
