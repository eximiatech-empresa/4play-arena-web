import { collection, doc, getDocs, setDoc, updateDoc, deleteDoc } from "firebase/firestore"
import { PlanConfigSchema, type PlanConfig } from "@/core/entities/plan-config"
import { db } from "./firestore"

export type { PlanConfig }

// The app mobile (irmão) writes `plans` docs with `price` in reais instead of
// `priceInCents`. Normalize on read AND persist both on write so mobile and web stay aligned.
function normalizePlanDoc(docId: string, raw: Record<string, unknown>) {
  const hasPriceInCents = typeof raw.priceInCents === "number"
  return {
    ...raw,
    id: typeof raw.id === "string" ? raw.id : docId,
    priceInCents: hasPriceInCents ? raw.priceInCents : Math.round((raw.price as number) * 100),
  }
}

export async function getPlans(): Promise<PlanConfig[]> {
  const snap = await getDocs(collection(db, "plans"))
  return snap.docs
    .flatMap((d) => {
      const result = PlanConfigSchema.safeParse(normalizePlanDoc(d.id, d.data()))
      return result.success ? [result.data] : []
    })
    .sort((a, b) => a.validityDays - b.validityDays)
}

export async function createPlan(plan: PlanConfig): Promise<void> {
  await setDoc(doc(db, "plans", plan.id), {
    ...plan,
    price: +(plan.priceInCents / 100).toFixed(2),
  })
}

export async function updatePlan(id: string, data: Partial<PlanConfig>): Promise<void> {
  const payload: Record<string, unknown> = { ...data }
  if (typeof data.priceInCents === "number") {
    payload.price = +(data.priceInCents / 100).toFixed(2)
  }
  await updateDoc(doc(db, "plans", id), payload)
}

export async function deletePlan(id: string): Promise<void> {
  await deleteDoc(doc(db, "plans", id))
}
