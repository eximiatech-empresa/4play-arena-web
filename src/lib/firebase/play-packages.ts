import { collection, doc, getDocs, setDoc, updateDoc, deleteDoc } from "firebase/firestore"
import { PlayPackageSchema, type PlayPackage } from "@/core/entities/play-package"
import { db } from "./firestore"

export type { PlayPackage }

function normalizePackageDoc(docId: string, raw: Record<string, unknown>) {
  const hasPriceInCents = typeof raw.priceInCents === "number"
  return {
    ...raw,
    id: typeof raw.id === "string" ? raw.id : docId,
    priceInCents: hasPriceInCents
      ? raw.priceInCents
      : Math.round(((raw.price as number) ?? 0) * 100),
  }
}

export async function getPlayPackages(): Promise<PlayPackage[]> {
  const snap = await getDocs(collection(db, "play-packages"))
  return snap.docs
    .flatMap((d) => {
      const result = PlayPackageSchema.safeParse(normalizePackageDoc(d.id, d.data()))
      return result.success ? [result.data] : []
    })
    .sort((a, b) => a.plays - b.plays)
}

export async function createPlayPackage(pkg: PlayPackage): Promise<void> {
  await setDoc(doc(db, "play-packages", pkg.id), {
    ...pkg,
    price: +(pkg.priceInCents / 100).toFixed(2),
  })
}

export async function updatePlayPackage(id: string, data: Partial<PlayPackage>): Promise<void> {
  const payload: Record<string, unknown> = { ...data }
  if (typeof data.priceInCents === "number") {
    payload.price = +(data.priceInCents / 100).toFixed(2)
  }
  await updateDoc(doc(db, "play-packages", id), payload)
}

export async function deletePlayPackage(id: string): Promise<void> {
  await deleteDoc(doc(db, "play-packages", id))
}
