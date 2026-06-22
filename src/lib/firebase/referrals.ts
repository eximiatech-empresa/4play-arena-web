import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  runTransaction,
  increment,
  setDoc,
  updateDoc,
} from "firebase/firestore"
import { db } from "./firestore"
import { ReferralSchema, REFERRAL_BONUS_PLAYS, type Referral } from "@/core/entities/referral"
import { normalizeTransactionDoc } from "./transactions"

function generateReferralCode(uid: string): string {
  const suffix = uid.replace(/[^a-zA-Z0-9]/g, "").slice(0, 5).toUpperCase().padEnd(5, "0")
  return `4PLAY-${suffix}`
}

/** Returns the student's referral code, generating and persisting one on first access. */
export async function ensureReferralCode(uid: string): Promise<string> {
  const userRef = doc(db, "users", uid)
  const snap = await getDoc(userRef)
  const existing = snap.data()?.referralCode
  if (typeof existing === "string" && existing.length > 0) return existing

  const code = generateReferralCode(uid)
  await updateDoc(userRef, { referralCode: code })
  return code
}

export async function getReferralsByReferrer(referrerId: string): Promise<Referral[]> {
  const q = query(collection(db, "referrals"), where("referrerId", "==", referrerId))
  const snap = await getDocs(q)
  return snap.docs
    .map((d) => {
      const result = ReferralSchema.safeParse({ id: d.id, ...d.data() })
      return result.success ? result.data : null
    })
    .filter((r): r is Referral => r !== null)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

/** Records the intent to invite a friend — does not grant credits yet (only redemption at signup does). */
export async function createReferralInvite(
  referrerId: string,
  referralCode: string,
  friendEmail: string,
): Promise<void> {
  const existing = await getDocs(
    query(
      collection(db, "referrals"),
      where("referrerId", "==", referrerId),
      where("friendEmail", "==", friendEmail.toLowerCase()),
    ),
  )
  if (!existing.empty) {
    throw new Error("Esse e-mail já foi convidado")
  }

  const refDoc = doc(collection(db, "referrals"))
  await setDoc(refDoc, {
    id: refDoc.id,
    referrerId,
    referralCode,
    friendEmail: friendEmail.toLowerCase(),
    friendName: null,
    friendUserId: null,
    status: "PENDENTE",
    bonusCredits: REFERRAL_BONUS_PLAYS,
    createdAt: new Date().toISOString(),
    completedAt: null,
  } satisfies Referral)
}

/**
 * Redeems a referral code during signup: credits both the referrer and the new
 * student with REFERRAL_BONUS_PLAYS, and reconciles any pending invite for this email.
 * Safe to call with an empty/unknown code — it's then a no-op.
 */
export async function redeemReferralCode(
  code: string,
  newUser: { uid: string; name: string; email: string },
): Promise<void> {
  if (!code.trim()) return

  const referrerSnap = await getDocs(
    query(collection(db, "users"), where("referralCode", "==", code.trim().toUpperCase())),
  )
  if (referrerSnap.empty) return

  const referrerDoc = referrerSnap.docs[0]
  const referrerId = referrerDoc.id
  if (referrerId === newUser.uid) return // can't self-refer

  const pendingSnap = await getDocs(
    query(
      collection(db, "referrals"),
      where("referrerId", "==", referrerId),
      where("friendEmail", "==", newUser.email.toLowerCase()),
      where("status", "==", "PENDENTE"),
    ),
  )

  const now = new Date().toISOString()

  await runTransaction(db, async (tx) => {
    const referrerRef = doc(db, "users", referrerId)
    const newUserRef = doc(db, "users", newUser.uid)

    tx.update(referrerRef, { walletBalance: increment(REFERRAL_BONUS_PLAYS) })
    tx.update(newUserRef, {
      walletBalance: increment(REFERRAL_BONUS_PLAYS),
      referredBy: referrerId,
    })

    const referrerTxRef = doc(collection(db, "transactions"))
    tx.set(referrerTxRef, normalizeTransactionDoc(referrerTxRef.id, {
      walletId: referrerId,
      studentId: referrerId,
      lessonId: null,
      type: "credit",
      amount: REFERRAL_BONUS_PLAYS,
      balanceAfter: (referrerDoc.data().walletBalance ?? 0) + REFERRAL_BONUS_PLAYS,
      professorName: null,
      classLevel: null,
      isPeak: null,
      note: `Bônus de indicação — ${newUser.name}`,
      createdAt: now,
    }))

    const friendTxRef = doc(collection(db, "transactions"))
    tx.set(friendTxRef, normalizeTransactionDoc(friendTxRef.id, {
      walletId: newUser.uid,
      studentId: newUser.uid,
      lessonId: null,
      type: "credit",
      amount: REFERRAL_BONUS_PLAYS,
      balanceAfter: REFERRAL_BONUS_PLAYS,
      professorName: null,
      classLevel: null,
      isPeak: null,
      note: "Bônus de boas-vindas — código de indicação",
      createdAt: now,
    }))

    if (!pendingSnap.empty) {
      tx.update(doc(db, "referrals", pendingSnap.docs[0].id), {
        status: "CONCLUIDO",
        friendName: newUser.name,
        friendUserId: newUser.uid,
        completedAt: now,
      })
    } else {
      const newReferralRef = doc(collection(db, "referrals"))
      tx.set(newReferralRef, {
        id: newReferralRef.id,
        referrerId,
        referralCode: code.trim().toUpperCase(),
        friendEmail: newUser.email.toLowerCase(),
        friendName: newUser.name,
        friendUserId: newUser.uid,
        status: "CONCLUIDO",
        bonusCredits: REFERRAL_BONUS_PLAYS,
        createdAt: now,
        completedAt: now,
      } satisfies Referral)
    }

    const referrerNotifRef = doc(collection(db, "notifications"))
    tx.set(referrerNotifRef, {
      id: referrerNotifRef.id,
      userId: referrerId,
      type: "referral_bonus",
      title: "Indicação confirmada!",
      message: `${newUser.name} se cadastrou com seu código e você ganhou ${REFERRAL_BONUS_PLAYS} Plays!`,
      lessonId: null,
      bonusCredits: REFERRAL_BONUS_PLAYS,
      read: false,
      createdAt: now,
    })

    const friendNotifRef = doc(collection(db, "notifications"))
    tx.set(friendNotifRef, {
      id: friendNotifRef.id,
      userId: newUser.uid,
      type: "referral_bonus",
      title: "Bônus de boas-vindas!",
      message: `Você usou um código de indicação e ganhou ${REFERRAL_BONUS_PLAYS} Plays de bônus!`,
      lessonId: null,
      bonusCredits: REFERRAL_BONUS_PLAYS,
      read: false,
      createdAt: now,
    })
  })
}
