"use client"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useCurrentUser } from "@/hooks/use-current-user"
import { ensureReferralCode, getReferralsByReferrer, createReferralInvite } from "@/lib/firebase/referrals"
import type { StudentUser } from "@/core/entities/user"

const REFERRALS_QUERY_KEY = ["referrals"] as const

export function useReferrals() {
  const { data: currentUser } = useCurrentUser()
  const student = currentUser?.role === "STUDENT" ? (currentUser as StudentUser) : null

  return useQuery({
    queryKey: REFERRALS_QUERY_KEY,
    queryFn: async () => {
      if (!student) throw new Error("Usuário não autenticado")
      const code = await ensureReferralCode(student.uid)
      const referrals = await getReferralsByReferrer(student.uid)
      return { code, referrals }
    },
    enabled: !!student,
    staleTime: 60 * 1000,
  })
}

export function useInviteFriend() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      referrerId,
      referralCode,
      friendEmail,
    }: {
      referrerId: string
      referralCode: string
      friendEmail: string
    }) => {
      await createReferralInvite(referrerId, referralCode, friendEmail)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: REFERRALS_QUERY_KEY }),
  })
}
