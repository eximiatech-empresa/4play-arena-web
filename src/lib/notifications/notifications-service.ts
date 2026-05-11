import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase/firestore"
import { NotificationSchema, type Notification } from "@/core/entities/notification"

export async function getUnreadNotifications(userId: string): Promise<Notification[]> {
  const snap = await getDocs(
    query(collection(db, "notifications"), where("userId", "==", userId)),
  )

  return snap.docs
    .flatMap((d) => {
      const result = NotificationSchema.safeParse({ id: d.id, ...d.data() })
      return result.success ? [result.data] : []
    })
    .filter((n) => !n.read)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  await updateDoc(doc(db, "notifications", notificationId), { read: true })
}
