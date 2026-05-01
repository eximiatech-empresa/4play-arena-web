import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore"
import { db } from "./firestore"
import { TeacherTransactionSchema, type TeacherTransaction, type TeacherWallet } from "@/core/entities/teacher-wallet"

export async function getTeacherWallet(teacherId: string): Promise<TeacherWallet> {
  // 1. Fetch teacher to get current balance (fallback to 0 if not set)
  const teacherDocSnap = await getDoc(doc(db, "users", teacherId))
  let balance = 0
  if (teacherDocSnap.exists()) {
    const data = teacherDocSnap.data()
    balance = data.walletBalance || 0 // Assuming the field is walletBalance as on student
  }

  // 2. Fetch transactions where teacher is the receiver
  const q = query(
    collection(db, "teacher_transactions"),
    where("teacherId", "==", teacherId)
  )
  const snap = await getDocs(q)
  
  const transactions = snap.docs
    .map((d) => {
      const data = d.data()
      // ensure we have an ID
      const payload = { ...data, id: d.id } as Record<string, unknown>
      // Date fallback/parsing
      if (payload.createdAt && typeof payload.createdAt === "object" && typeof (payload.createdAt as { seconds?: unknown }).seconds === "number") {
        payload.createdAt = new Date((payload.createdAt as { seconds: number }).seconds * 1000).toISOString()
      } else if (!payload.createdAt) {
        payload.createdAt = new Date().toISOString()
      }

      const result = TeacherTransactionSchema.safeParse(payload)
      if (!result.success) {
        console.warn("Transacão de professor ignorada por erro de formato:", result.error)
        return null
      }
      return result.data
    })
    .filter((t): t is TeacherTransaction => t !== null)

  // Sort descending
  transactions.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  return {
    teacherId,
    balance,
    transactions,
  }
}
