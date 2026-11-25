import { collection, getDocs, query, orderBy, limit, where } from "firebase/firestore"
import { AuditLogDocumentSchema, type AuditLogDocument } from "@/core/entities/audit-log"
import { db } from "./firestore"
import { getDemoUserIds } from "./demo"
import { excludeDemoOwned } from "@/core/math/demo-filter"

export type { AuditLogDocument }

export async function getRecentAuditLogs(count: number = 8): Promise<AuditLogDocument[]> {
  // Busca uma folga extra porque logs de contas demo sao descartados depois.
  const [snap, demoUserIds] = await Promise.all([
    getDocs(
      query(
        collection(db, "audit_logs"),
        orderBy("createdAt", "desc"),
        limit(count * 2),
      ),
    ),
    getDemoUserIds(),
  ])
  const realDocs = excludeDemoOwned(snap.docs.map((d) => ({ id: d.id, ...d.data() })), demoUserIds)
  return realDocs
    .flatMap((raw) => {
      const parsed = AuditLogDocumentSchema.safeParse(raw)
      return parsed.success ? [parsed.data] : []
    })
    .slice(0, count)
}

export async function getStudentAuditLogs(studentId: string): Promise<AuditLogDocument[]> {
  const snap = await getDocs(
    query(collection(db, "audit_logs"), where("targetId", "==", studentId)),
  )
  const logs = snap.docs.flatMap((d) => {
    const parsed = AuditLogDocumentSchema.safeParse({ id: d.id, ...d.data() })
    return parsed.success ? [parsed.data] : []
  })
  return logs.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}
