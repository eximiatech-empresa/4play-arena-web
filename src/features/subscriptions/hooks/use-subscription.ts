import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  createSubscription,
  getActiveSubscription,
  cancelSubscription,
} from "@/lib/firebase/subscription"
import { useCurrentUser } from "@/hooks/use-current-user"
import type { SubscriptionDocument } from "@/core/entities/subscription"

export const SUBSCRIPTION_QUERY_KEY = ["subscription"] as const

// ─── Queries ──────────────────────────────────────────────────────────────────

// Accepts an explicit studentId for admin views; falls back to the logged-in user.
export function useActiveSubscription(studentId?: string) {
  const { data: currentUser } = useCurrentUser()
  const targetId = studentId ?? currentUser?.uid

  return useQuery({
    queryKey: [...SUBSCRIPTION_QUERY_KEY, "active", targetId],
    queryFn: (): Promise<SubscriptionDocument | null> => {
      if (!targetId) return Promise.resolve(null)
      return getActiveSubscription(targetId)
    },
    enabled: !!targetId,
    staleTime: 5 * 60 * 1000,
  })
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useCreateSubscription() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Parameters<typeof createSubscription>[0]) => createSubscription(data),
    onSuccess: (subscription) => {
      queryClient.invalidateQueries({
        queryKey: [...SUBSCRIPTION_QUERY_KEY, "active", subscription.studentId],
      })
    },
  })
}

export function useCancelSubscription() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ subscriptionId }: { subscriptionId: string; studentId: string }) =>
      cancelSubscription(subscriptionId),
    onSuccess: (_result, { studentId }) => {
      queryClient.invalidateQueries({
        queryKey: [...SUBSCRIPTION_QUERY_KEY, "active", studentId],
      })
    },
  })
}
