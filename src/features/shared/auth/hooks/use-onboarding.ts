"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { saveUserDocument } from "@/lib/firebase/firestore"
import { processPlanPurchase } from "@/lib/firebase/transactions"
import { calculatePlanExpiryDate } from "@/core/services/expiration-service"
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
}

export function useOnboarding() {
  const router = useRouter()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ uid, name, email, plan, originalTeacherId, validityDays, totalPlays, playValue }: OnboardingPayload) => {
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
      })
      await processPlanPurchase(uid, plan, totalPlays, validityDays, 0, playValue)
    },
    onSuccess: () => {
      queryClient.clear()
      router.replace("/dashboard")
    },
  })
}
