import { collection, doc, getDocs, setDoc, updateDoc, deleteDoc } from "firebase/firestore"
import { db } from "./firestore"

export interface PlayPackage {
  id: string
  label: string
  plays: number
  priceInCents: number
  popular?: boolean
}

export async function getPlayPackages(): Promise<PlayPackage[]> {
  const snap = await getDocs(collection(db, "play-packages"))
  return snap.docs
    .map((d) => d.data() as PlayPackage)
    .sort((a, b) => a.plays - b.plays)
}

export async function createPlayPackage(pkg: PlayPackage): Promise<void> {
  await setDoc(doc(db, "play-packages", pkg.id), pkg)
}

export async function updatePlayPackage(id: string, data: Partial<PlayPackage>): Promise<void> {
  await updateDoc(doc(db, "play-packages", id), data as Record<string, unknown>)
}

export async function deletePlayPackage(id: string): Promise<void> {
  await deleteDoc(doc(db, "play-packages", id))
}
