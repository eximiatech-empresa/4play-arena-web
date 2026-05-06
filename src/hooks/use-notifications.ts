"use client"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase/firestore"
import type { Notification } from "@/core/entities/notification"

// Single-field query (no composite index required); read === false filtered client-side
export function useNotifications(userId: string | undefined) {
  return useQuery({
    queryKey: ["notifications", userId],
    queryFn: async (): Promise<Notification[]> => {
      if (!userId) return []
      const snap = await getDocs(
        query(collection(db, "notifications"), where("userId", "==", userId)),
      )
      return snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as Notification))
        .filter((n) => !n.read)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    },
    enabled: !!userId,
    staleTime: 30_000,
  })
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (notificationId: string) =>
      updateDoc(doc(db, "notifications", notificationId), { read: true }),

    onSuccess: (_data, notificationId) => {
      // Optimistically remove from local cache without full refetch
      queryClient.setQueriesData<Notification[]>(
        { queryKey: ["notifications"] },
        (old) => old?.filter((n) => n.id !== notificationId) ?? old,
      )
    },
  })
}
