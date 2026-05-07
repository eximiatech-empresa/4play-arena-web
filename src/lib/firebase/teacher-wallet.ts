import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore"
import { db } from "./firestore"
import { TeacherTransactionSchema, type TeacherTransaction, type TeacherWallet } from "@/core/entities/teacher-wallet"

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

export async function getTeacherWallet(teacherId: string, filter = "all_time"): Promise<TeacherWallet> {
  const [teacherDocSnap, snap] = await Promise.all([
    getDoc(doc(db, "users", teacherId)),
    getDocs(query(collection(db, "teacher_transactions"), where("teacherId", "==", teacherId))),
  ])

  const balance: number = teacherDocSnap.exists()
    ? (teacherDocSnap.data().earningsBalance ?? teacherDocSnap.data().walletBalance ?? 0)
    : 0

  const startDate = getFilterStartDate(filter)
  const endDate = getFilterEndDate(filter)

  const transactions = snap.docs
    .map((d) => {
      const payload = { ...d.data(), id: d.id, createdAt: parseTimestamp(d.data().createdAt) } as Record<string, unknown>
      const result = TeacherTransactionSchema.safeParse(payload)
      if (!result.success) {
        console.warn("Transação de professor ignorada por erro de formato:", result.error)
        return null
      }
      return result.data
    })
    .filter((t): t is TeacherTransaction => {
      if (!t) return false
      const date = new Date(t.createdAt)
      if (startDate && date < startDate) return false
      if (endDate && date >= endDate) return false
      return true
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return { teacherId, balance, transactions }
}
