import { collection, getDocs, query, orderBy, limit } from "firebase/firestore"
import { AuditLogDocumentSchema, type AuditLogDocument } from "@/core/entities/audit-log"
import { db } from "./firestore"

export type { AuditLogDocument }

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
