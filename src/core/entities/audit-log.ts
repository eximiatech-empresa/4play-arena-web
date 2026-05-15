import { z } from "zod"

export const AuditLogDocumentSchema = z.object({
  id: z.string(),
  type: z.literal("level_change"),
  actorId: z.string(),
  actorName: z.string(),
  targetId: z.string(),
  targetName: z.string(),
  previousValue: z.string(),
  newValue: z.string(),
  createdAt: z.string(),
})
export type AuditLogDocument = z.infer<typeof AuditLogDocumentSchema>
