import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  setDoc,
  updateDoc,
  runTransaction,
} from "firebase/firestore"
import { db } from "./firestore"
import { FamilySchema, FamilyInviteSchema, type Family, type FamilyInvite, type FamilyMemberRole } from "@/core/entities/family"

/** One family per titular — the family document id is the owner's uid. */
export async function ensureFamily(ownerId: string): Promise<Family> {
  const familyRef = doc(db, "families", ownerId)
  const snap = await getDoc(familyRef)
  if (snap.exists()) {
    const result = FamilySchema.safeParse({ id: snap.id, ...snap.data() })
    if (result.success) return result.data
  }

  const family: Family = {
    id: ownerId,
    ownerId,
    memberIds: [ownerId],
    createdAt: new Date().toISOString(),
  }
  await setDoc(familyRef, family)
  await updateDoc(doc(db, "users", ownerId), { familyId: ownerId })
  return family
}

export async function getFamilyInvites(familyId: string): Promise<FamilyInvite[]> {
  const snap = await getDocs(query(collection(db, "family_invites"), where("familyId", "==", familyId)))
  return snap.docs
    .map((d) => {
      const result = FamilyInviteSchema.safeParse({ id: d.id, ...d.data() })
      return result.success ? result.data : null
    })
    .filter((i): i is FamilyInvite => i !== null)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export async function inviteFamilyMember(
  familyId: string,
  invitedByUserId: string,
  email: string,
  role: FamilyMemberRole,
): Promise<void> {
  const normalizedEmail = email.toLowerCase()

  const existing = await getDocs(
    query(
      collection(db, "family_invites"),
      where("familyId", "==", familyId),
      where("email", "==", normalizedEmail),
    ),
  )
  if (existing.docs.some((d) => d.data().status !== "REJEITADO")) {
    throw new Error("Esse e-mail já faz parte da sua família")
  }

  const inviteRef = doc(collection(db, "family_invites"))
  await setDoc(inviteRef, {
    id: inviteRef.id,
    familyId,
    invitedByUserId,
    email: normalizedEmail,
    role,
    status: "PENDENTE",
    memberUserId: null,
    createdAt: new Date().toISOString(),
    respondedAt: null,
  } satisfies FamilyInvite)
}

/** Cancels a pending invite, or removes an already-active member from the family. */
export async function removeFamilyMember(invite: FamilyInvite): Promise<void> {
  const inviteRef = doc(db, "family_invites", invite.id)

  if (invite.status === "PENDENTE") {
    await updateDoc(inviteRef, { status: "REJEITADO", respondedAt: new Date().toISOString() })
    return
  }

  await runTransaction(db, async (tx) => {
    const familyRef = doc(db, "families", invite.familyId)
    const familySnap = await tx.get(familyRef)
    if (!familySnap.exists()) throw new Error("Família não encontrada")

    const memberIds = (familySnap.data().memberIds ?? []) as string[]
    tx.update(familyRef, { memberIds: memberIds.filter((id) => id !== invite.memberUserId) })
    tx.update(inviteRef, { status: "REJEITADO", respondedAt: new Date().toISOString() })
    if (invite.memberUserId) {
      tx.update(doc(db, "users", invite.memberUserId), { familyId: null })
    }
  })
}

/** Links a newly-registered student to any pending family invite that matches their email. */
export async function redeemFamilyInvite(newUser: { uid: string; email: string }): Promise<void> {
  const pendingSnap = await getDocs(
    query(
      collection(db, "family_invites"),
      where("email", "==", newUser.email.toLowerCase()),
      where("status", "==", "PENDENTE"),
    ),
  )
  if (pendingSnap.empty) return

  const invite = pendingSnap.docs[0]
  const familyId = invite.data().familyId as string

  await runTransaction(db, async (tx) => {
    const familyRef = doc(db, "families", familyId)
    const familySnap = await tx.get(familyRef)
    if (!familySnap.exists()) return

    const memberIds = (familySnap.data().memberIds ?? []) as string[]
    if (!memberIds.includes(newUser.uid)) {
      tx.update(familyRef, { memberIds: [...memberIds, newUser.uid] })
    }
    tx.update(doc(db, "family_invites", invite.id), {
      status: "ATIVO",
      memberUserId: newUser.uid,
      respondedAt: new Date().toISOString(),
    })
    tx.update(doc(db, "users", newUser.uid), { familyId })
  })
}
