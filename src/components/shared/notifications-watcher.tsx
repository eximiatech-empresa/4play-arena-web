"use client"
import { useEffect, useRef } from "react"
import { toast } from "sonner"
import { useCurrentUser } from "@/hooks/use-current-user"
import { useNotifications, useMarkNotificationRead } from "@/hooks/use-notifications"

// Renders nothing — fires toasts for unread notifications and marks them read.
export function NotificationsWatcher() {
  const { data: currentUser } = useCurrentUser()
  const { data: notifications } = useNotifications(currentUser?.uid)
  const { mutate: markRead } = useMarkNotificationRead()
  const shownIds = useRef(new Set<string>())

  useEffect(() => {
    if (!notifications?.length) return

    notifications.forEach((notification) => {
      if (shownIds.current.has(notification.id)) return
      shownIds.current.add(notification.id)

      const isCancel = notification.type === "lesson_cancelled"
      const toastFn = isCancel ? toast.error : toast.info

      toastFn(notification.message, {
        duration: 9000,
        description: isCancel ? "Aula cancelada pelo professor" : "Aula reagendada",
      })

      markRead(notification.id)
    })
  }, [notifications, markRead])

  return null
}
