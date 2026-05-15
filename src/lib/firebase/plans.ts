import { collection, doc, getDocs, setDoc, updateDoc, deleteDoc } from "firebase/firestore"
import { PlanConfigSchema, type PlanConfig } from "@/core/entities/plan-config"
import { db } from "./firestore"

export type { PlanConfig }

export async function getPlans(): Promise<PlanConfig[]> {
  const snap = await getDocs(collection(db, "plans"))
  return snap.docs
    .flatMap((d) => {
      const result = PlanConfigSchema.safeParse({ id: d.id, ...d.data() })
      return result.success ? [result.data] : []
    })
    .sort((a, b) => a.validityDays - b.validityDays)
}

export async function createPlan(plan: PlanConfig): Promise<void> {
  await setDoc(doc(db, "plans", plan.id), plan)
}

export async function updatePlan(id: string, data: Partial<PlanConfig>): Promise<void> {
  await updateDoc(doc(db, "plans", id), data as Record<string, unknown>)
}

export async function deletePlan(id: string): Promise<void> {
  await deleteDoc(doc(db, "plans", id))
}
