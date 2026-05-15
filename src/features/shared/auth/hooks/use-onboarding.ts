"use client"

import { useMutation } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { saveUserDocument } from "@/lib/firebase/firestore"
import { calculatePlanExpiryDate } from "@/core/services/expiration-service"
import type { StudentPlan } from "@/core/entities/user"

interface OnboardingPayload {
  uid: string
  name: string
  email: string
  plan: StudentPlan
  originalTeacherId: string
  validityDays: number
}

export function useOnboarding() {
  const router = useRouter()

  return useMutation({
    mutationFn: async ({ uid, name, email, plan, originalTeacherId, validityDays }: OnboardingPayload) => {
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
    },
    onSuccess: () => {
      router.replace("/dashboard")
    },
  })
}
