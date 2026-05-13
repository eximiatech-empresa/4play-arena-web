import { doc, collection, query, where, getDocs, writeBatch } from "firebase/firestore"
import { db } from "./firestore"
import type { Transaction, Plan } from "@/core/entities/wallet"
import { TransactionSchema } from "@/core/entities/wallet"

export async function getStudentTransactions(studentId: string): Promise<Transaction[]> {
  // 1. Removemos o orderBy do Firebase para NÃO exigir Índice Composto!
  const q = query(
    collection(db, "transactions"),
    where("studentId", "==", studentId)
  )
  const snap = await getDocs(q)
  
  const transactions = snap.docs
    .map((d) => {
      const result = TransactionSchema.safeParse(d.data())
      if (!result.success) {
        console.warn("Transação ignorada por erro de formato:", result.error)
      }
      return result.success ? result.data : null
    })
    .filter((t): t is Transaction => t !== null)

  // 2. Ordenamos via JavaScript (do mais recente para o mais antigo)
  return transactions.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}

export async function processPlanPurchase(
  uid: string,
  planId: Plan,
  playsAmount: number,
  expiresInDays: number,
  currentBalance: number,
  playValue: number,
): Promise<void> {
  const batch = writeBatch(db)

  // 1. Atualizar o Documento do Aluno (Usuário)
  const userRef = doc(db, "users", uid)
  const expiryDate = new Date()
  expiryDate.setDate(expiryDate.getDate() + expiresInDays)

  const newBalance = currentBalance + playsAmount

  batch.update(userRef, {
    walletBalance: newBalance,
    currentPlanId: planId,
    planExpiresAt: expiryDate.toISOString(),
    planPlayValue: playValue,
  })

  const txRef = doc(collection(db, "transactions"))
  const transactionData: Transaction = {
    id: txRef.id,
    walletId: uid,
    studentId: uid,
    lessonId: null,
    type: "purchase",
    amount: playsAmount,
    balanceAfter: newBalance,
    professorName: null,
    classLevel: null,
    isPeak: null,
    createdAt: new Date().toISOString()
  }
  batch.set(txRef, transactionData)

  await batch.commit()
}