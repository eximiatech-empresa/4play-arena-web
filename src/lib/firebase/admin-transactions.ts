import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "./firestore"
import { TransactionSchema } from "@/core/entities/wallet"
import type { Transaction } from "@/core/entities/wallet"
import { normalizeTransactionDoc } from "./transactions"
import { getDemoUserIds } from "./demo"
import { excludeDemoOwned } from "@/core/math/demo-filter"

export async function getAdminTransactionsByMonth(
  year: number,
  month: number, // 0-indexed (JS Date convention)
): Promise<Transaction[]> {
  const mm = String(month + 1).padStart(2, "0")
  const nextMM = month === 11 ? "01" : String(month + 2).padStart(2, "0")
  const nextYear = month === 11 ? year + 1 : year

  const [snap, demoUserIds] = await Promise.all([
    getDocs(
      query(
        collection(db, "transactions"),
        where("createdAt", ">=", `${year}-${mm}-01T`),
        where("createdAt", "<", `${nextYear}-${nextMM}-01T`),
      ),
    ),
    getDemoUserIds(),
  ])

  // Transacoes nao tem o flag isDemo: exclui pelas que pertencem a contas demo.
  const realDocs = excludeDemoOwned(snap.docs.map((d) => ({ id: d.id, ...d.data() })), demoUserIds)

  return realDocs.flatMap(({ id, ...data }) => {
    const parsed = TransactionSchema.safeParse(normalizeTransactionDoc(id, data))
    return parsed.success ? [parsed.data] : []
  })
}
