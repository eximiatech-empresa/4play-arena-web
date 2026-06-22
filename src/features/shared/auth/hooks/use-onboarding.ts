"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { saveUserDocument } from "@/lib/firebase/firestore"
import { processPlanPurchase } from "@/lib/firebase/transactions"
import { calculatePlanExpiryDate } from "@/core/services/expiration-service"
import { redeemReferralCode } from "@/lib/firebase/referrals"
import { redeemFamilyInvite } from "@/lib/firebase/families"
import type { StudentPlan } from "@/core/entities/user"

interface OnboardingPayload {
  uid: string
  name: string
  email: string
  plan: StudentPlan
  originalTeacherId: string
  validityDays: number
  totalPlays: number
  playValue: number
  referralCode?: string
}

export function useOnboarding() {
  const router = useRouter()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ uid, name, email, plan, originalTeacherId, validityDays, totalPlays, playValue, referralCode }: OnboardingPayload) => {
      await saveUserDocument(uid, {
        uid,
        name,
        email,
        role: "STUDENT",
        isActive: true,
        mustChangePassword: false,
        level: "Principiante",
        walletBalance: 0,
        originalTeacherId,
        currentPlanId: plan,
        planExpiresAt: calculatePlanExpiryDate(validityDays),
        createdAt: new Date().toISOString(),
        referralCode: "",
        referredBy: null,
        familyId: null,
      })
      await processPlanPurchase(uid, plan, totalPlays, validityDays, 0, playValue)
      if (referralCode) {
        await redeemReferralCode(referralCode, { uid, name, email })
      }
      await redeemFamilyInvite({ uid, email })
    },
    onSuccess: () => {
      queryClient.clear()
      router.replace("/dashboard")
    },
  })
}
