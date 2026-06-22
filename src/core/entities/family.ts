import { z } from "zod"

export const FamilyMemberRoleSchema = z.enum(["TITULAR", "DEPENDENTE"])
export type FamilyMemberRole = z.infer<typeof FamilyMemberRoleSchema>

export const FamilyInviteStatusSchema = z.enum(["PENDENTE", "ATIVO", "REJEITADO"])
export type FamilyInviteStatus = z.infer<typeof FamilyInviteStatusSchema>

export const FamilySchema = z.object({
  id: z.string(),
  ownerId: z.string(),
  memberIds: z.array(z.string()),
  createdAt: z.string(),
})
export type Family = z.infer<typeof FamilySchema>

export const FamilyInviteSchema = z.object({
  id: z.string(),
  familyId: z.string(),
  invitedByUserId: z.string(),
  email: z.string().email(),
  role: FamilyMemberRoleSchema,
  status: FamilyInviteStatusSchema,
  memberUserId: z.string().nullable(),
  createdAt: z.string(),
  respondedAt: z.string().nullable(),
})
export type FamilyInvite = z.infer<typeof FamilyInviteSchema>
