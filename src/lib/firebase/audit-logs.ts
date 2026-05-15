import { collection, doc, getDocs, query, orderBy, limit } from "firebase/firestore"
import { z } from "zod"
import { db } from "./firestore"

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

export async function getRecentAuditLogs(count: number = 8): Promise<AuditLogDocument[]> {
  const snap = await getDocs(
    query(
      collection(db, "audit_logs"),
      orderBy("createdAt", "desc"),
      limit(count),
    ),
  )
  return snap.docs.flatMap((d) => {
    const parsed = AuditLogDocumentSchema.safeParse({ id: d.id, ...d.data() })
    return parsed.success ? [parsed.data] : []
  })
}
