import { z } from "zod"

export const NotificationTypeSchema = z.enum([
  "lesson_cancelled",
  "lesson_rescheduled",
  "lesson_finished",
  "referral_bonus",
])

export const NotificationSchema = z.object({
  id: z.string(),
  userId: z.string(),
  type: NotificationTypeSchema,
  title: z.string().optional(),
  message: z.string(),
  lessonId: z.string().nullable().optional(),
  /** Plays credited — populated for `referral_bonus` notifications. */
  bonusCredits: z.number().nullable().optional(),
  read: z.boolean().default(false),
  createdAt: z.string(),
})

export type Notification = z.infer<typeof NotificationSchema>
export type NotificationType = z.infer<typeof NotificationTypeSchema>
