import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore"
import { db } from "./firestore"
import { TeacherTransactionSchema, type TeacherTransaction, type TeacherWallet } from "@/core/entities/teacher-wallet"
import { PROFESSOR_MAP } from "@/core/constants/professors"

function getFilterStartDate(filter: string): Date | null {
  const now = new Date()
  switch (filter) {
    case "this_week": {
      const d = new Date(now)
      d.setDate(now.getDate() - now.getDay())
      d.setHours(0, 0, 0, 0)
      return d
    }
    case "this_month": {
      return new Date(now.getFullYear(), now.getMonth(), 1)
    }
    case "last_month": {
      return new Date(now.getFullYear(), now.getMonth() - 1, 1)
    }
    case "this_year": {
      return new Date(now.getFullYear(), 0, 1)
    }
    default:
      return null
  }
}

function getFilterEndDate(filter: string): Date | null {
  const now = new Date()
  if (filter === "last_month") {
    return new Date(now.getFullYear(), now.getMonth(), 1)
  }
  return null
}

function parseTimestamp(value: unknown): string {
  if (typeof value === "object" && value !== null && typeof (value as { seconds?: unknown }).seconds === "number") {
    return new Date((value as { seconds: number }).seconds * 1000).toISOString()
  }
  if (typeof value === "string") return value
  return new Date().toISOString()
}

function parseTx(d: { data(): Record<string, unknown>; id: string }): TeacherTransaction | null {
  const payload = { ...d.data(), id: d.id, createdAt: parseTimestamp(d.data().createdAt) } as Record<string, unknown>
  const result = TeacherTransactionSchema.safeParse(payload)
  if (!result.success) {
    console.warn("Transação de professor ignorada por erro de formato:", result.error)
    return null
  }
  return result.data
}

export async function getTeacherWallet(teacherId: string, filter = "all_time"): Promise<TeacherWallet> {
  const LOG = (tag: string, ...args: unknown[]) =>
    console.log(`%c[4Play] getTeacherWallet › ${tag}`, "color:#10b981;font-weight:bold", ...args)

  LOG("Iniciando", { teacherId, filter })

  // Resolve slug legado: professores seedados têm documents em users/paulinho (slug) além do
  // documento real em users/{firebaseUID}. Dados históricos foram gravados no slug por engano,
  // então precisamos incluir ambas as fontes enquanto não há migração de dados.
  const teacherDocSnap = await getDoc(doc(db, "users", teacherId))
  const teacherDocData = teacherDocSnap.exists() ? teacherDocSnap.data() : null
  const teacherName = teacherDocData ? (teacherDocData.name as string | undefined) : undefined
  LOG("Documento do professor", { existe: teacherDocSnap.exists(), earningsBalance: teacherDocData?.earningsBalance, name: teacherName })

  const legacySlug = teacherName
    ? (Object.entries(PROFESSOR_MAP).find(
        ([, cfg]) => cfg.name.toLowerCase() === teacherName.toLowerCase(),
      )?.[0] ?? null)
    : null
  const hasLegacySlug = !!legacySlug && legacySlug !== teacherId
  LOG("Slug legado", { legacySlug, hasLegacySlug })

  // Busca paralela: documento slug + transações por UID + transações por slug
  const [slugDocSnap, txByUid, txBySlug] = await Promise.all([
    hasLegacySlug ? getDoc(doc(db, "users", legacySlug!)) : Promise.resolve(null),
    getDocs(query(collection(db, "teacher_transactions"), where("teacherId", "==", teacherId))),
    hasLegacySlug
      ? getDocs(query(collection(db, "teacher_transactions"), where("teacherId", "==", legacySlug!)))
      : Promise.resolve(null),
  ])

  // Saldo = earningsBalance do documento real + earningsBalance do documento slug (dados históricos)
  const realBalance: number = teacherDocSnap.exists() ? ((teacherDocSnap.data().earningsBalance as number) ?? 0) : 0
  const slugBalance: number = slugDocSnap?.exists() ? ((slugDocSnap.data().earningsBalance as number) ?? 0) : 0
  const balance = realBalance + slugBalance
  LOG("Saldo calculado", { realBalance, slugBalance, total: balance })
  LOG("Transações encontradas", { porUID: txByUid.docs.length, porSlug: txBySlug?.docs.length ?? 0 })

  const startDate = getFilterStartDate(filter)
  const endDate = getFilterEndDate(filter)

  // Mescla transações dos dois documentos, sem duplicatas
  const seen = new Set<string>()
  const allTxDocs = [...txByUid.docs, ...(txBySlug?.docs ?? [])].filter(
    (d) => !seen.has(d.id) && seen.add(d.id),
  )

  const transactions = allTxDocs
    .map((d) => {
      const result = parseTx(d as Parameters<typeof parseTx>[0])
      if (!result) {
        LOG("⚠️ Transação descartada pelo schema", { docId: d.id, data: d.data() })
      }
      return result
    })
    .filter((t): t is TeacherTransaction => {
      if (!t) return false
      const date = new Date(t.createdAt)
      if (startDate && date < startDate) return false
      if (endDate && date >= endDate) return false
      return true
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  LOG("Resultado final", { balance, transacoes: transactions.length, filter, startDate, endDate })

  return { teacherId, balance, transactions }
}
