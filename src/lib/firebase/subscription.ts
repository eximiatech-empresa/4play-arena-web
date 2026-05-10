import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  limit,
} from "firebase/firestore"
import { db } from "./firestore"
import { SubscriptionDocumentSchema } from "@/core/entities/subscription"
import type { SubscriptionDocument } from "@/core/entities/subscription"

type CreateSubscriptionInput = Omit<SubscriptionDocument, "id" | "createdAt" | "updatedAt">

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function getActiveSubscription(studentId: string): Promise<SubscriptionDocument | null> {
  const q = query(
    collection(db, "subscriptions"),
    where("studentId", "==", studentId),
    where("status", "in", ["active", "trialing"]),
    limit(1),
  )

  const snap = await getDocs(q)
  if (snap.empty) return null

  const d = snap.docs[0]
  const parsed = SubscriptionDocumentSchema.safeParse({ id: d.id, ...d.data() })

  return parsed.success ? parsed.data : null
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export async function createSubscription(data: CreateSubscriptionInput): Promise<SubscriptionDocument> {
  const now = new Date().toISOString()
  const docRef = doc(collection(db, "subscriptions"))
  const payload = { ...data, createdAt: now, updatedAt: now }

  await setDoc(docRef, payload)

  return SubscriptionDocumentSchema.parse({ id: docRef.id, ...payload })
}

export async function getSubscriptionHistory(studentId: string): Promise<SubscriptionDocument[]> {
  const q = query(collection(db, "subscriptions"), where("studentId", "==", studentId))
  const snap = await getDocs(q)

  return snap.docs
    .flatMap((d) => {
      const parsed = SubscriptionDocumentSchema.safeParse({ id: d.id, ...d.data() })
      return parsed.success ? [parsed.data] : []
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

// Soft-cancel: marks cancelAtPeriodEnd so the student retains access
// until currentPeriodEnd. Status stays "active" — access is revoked only
// when the billing period expires (enforced server-side or by a Cloud Function).
export async function cancelSubscription(subscriptionId: string): Promise<void> {
  const subscriptionRef = doc(db, "subscriptions", subscriptionId)
  const snap = await getDoc(subscriptionRef)

  if (!snap.exists()) throw new Error("Assinatura não encontrada")
  if (snap.data().cancelAtPeriodEnd === true) throw new Error("Cancelamento já solicitado")
  if (snap.data().status === "canceled") throw new Error("Assinatura já cancelada")

  await updateDoc(subscriptionRef, {
    cancelAtPeriodEnd: true,
    updatedAt: new Date().toISOString(),
  })
}
