"use client"

import { useMutation } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { saveUserDocument } from "@/lib/firebase/firestore"
import type { StudentPlan } from "@/core/entities/user"

interface OnboardingPayload {
  uid: string
  name: string
  email: string
  plan: StudentPlan
  originalTeacherId: string
}

function calculatePlanExpiry(plan: StudentPlan): string {
  const days = { mensal: 30, trimestral: 90, semestral: 180 } as const
  const expiry = new Date()
  expiry.setDate(expiry.getDate() + days[plan])
  return expiry.toISOString()
}

export function useOnboarding() {
  const router = useRouter()

  return useMutation({
    mutationFn: async ({ uid, name, email, plan, originalTeacherId }: OnboardingPayload) => {
      await saveUserDocument(uid, {
        uid,
        name,
        email,
        role: "STUDENT",
        isActive: true,
        level: "Principiante",
        walletBalance: 0,
        originalTeacherId,
        currentPlanId: plan,
        planExpiresAt: calculatePlanExpiry(plan),
        createdAt: new Date().toISOString(),
      })
    },
    onSuccess: () => {
      router.replace("/dashboard")
    },
  })
}
