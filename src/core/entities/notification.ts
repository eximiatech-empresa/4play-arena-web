import { z } from "zod"

export const NotificationTypeSchema = z.enum(["lesson_cancelled", "lesson_rescheduled"])

export const NotificationSchema = z.object({
  id: z.string(),
  userId: z.string(),
  type: NotificationTypeSchema,
  message: z.string(),
  lessonId: z.string(),
  read: z.boolean().default(false),
  createdAt: z.string(),
})

export type Notification = z.infer<typeof NotificationSchema>
export type NotificationType = z.infer<typeof NotificationTypeSchema>
