"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type { Notification } from "@/core/entities/notification"
import {
  getUnreadNotifications,
  markNotificationRead,
} from "@/lib/notifications/notifications-service"

export function useNotifications(userId: string | undefined) {
  return useQuery({
    queryKey: ["notifications", userId],
    queryFn: (): Promise<Notification[]> => {
      if (!userId) return Promise.resolve([])
      return getUnreadNotifications(userId)
    },
    enabled: !!userId,
    staleTime: 30_000,
  })
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (notificationId: string) => markNotificationRead(notificationId),
    onSuccess: (_data, notificationId) => {
      queryClient.setQueriesData<Notification[]>(
        { queryKey: ["notifications"] },
        (old) => old?.filter((n) => n.id !== notificationId) ?? old,
      )
    },
  })
}
