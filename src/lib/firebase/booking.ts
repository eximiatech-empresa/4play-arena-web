// src/lib/firebase/booking.ts
import { doc, collection, writeBatch, getDoc } from "firebase/firestore"
import { db } from "./firestore"
import type { Transaction } from "@/core/entities/wallet"

export async function processCheckIn(
  studentId: string,
  sessionId: string,
  playsCost: number,
  professorName: string,
  classLevel: string,
  isOffPeak: boolean
): Promise<void> {
  const batch = writeBatch(db)

  // 1. Pega as referências
  const userRef = doc(db, "users", studentId)
  const sessionRef = doc(db, "sessions", sessionId) // Assume que a coleção de aulas ativas se chama 'sessions'

  // Como é uma simulação para a apresentação amanhã, vamos apenas fazer o DÉBITO na carteira.
  // (Na vida real, leríamos a session para ver se tem vaga antes).
  
  const userSnap = await getDoc(userRef)
  if (!userSnap.exists()) throw new Error("Aluno não encontrado")
  
  const currentBalance = userSnap.data().walletBalance || 0
  if (currentBalance < playsCost) throw new Error("Saldo insuficiente de Plays")

  const newBalance = currentBalance - playsCost

  // 2. Atualiza saldo do aluno
  batch.update(userRef, { walletBalance: newBalance })

  // 3. Registra o Débito no extrato
  const txRef = doc(collection(db, "transactions"))
  const transactionData: Transaction = {
    id: txRef.id,
    walletId: studentId,
    studentId: studentId,
    lessonId: sessionId,
    type: "debit",
    amount: -playsCost, // Débito é negativo
    balanceAfter: newBalance,
    professorName,
    classLevel,
    isOffPeak,
    createdAt: new Date().toISOString()
  }
  batch.set(txRef, transactionData)

  // 4. (Opcional para a UI) Adicionar o aluno na lista da aula aqui...
  
  await batch.commit()
}

export async function processCheckOut(
  studentId: string,
  sessionId: string,
  playsRefund: number,
  professorName: string
): Promise<void> {
  const batch = writeBatch(db)
  const userRef = doc(db, "users", studentId)
  
  const userSnap = await getDoc(userRef)
  if (!userSnap.exists()) return
  
  const newBalance = (userSnap.data().walletBalance || 0) + playsRefund

  // Estorna o valor
  batch.update(userRef, { walletBalance: newBalance })

  // Registra o estorno no extrato
  const txRef = doc(collection(db, "transactions"))
  const transactionData: Transaction = {
    id: txRef.id,
    walletId: studentId,
    studentId: studentId,
    lessonId: sessionId,
    type: "credit",
    amount: playsRefund,
    balanceAfter: newBalance,
    professorName: `${professorName} (Estorno)`,
    classLevel: null,
    isOffPeak: null,
    createdAt: new Date().toISOString()
  }
  batch.set(txRef, transactionData)

  await batch.commit()
}