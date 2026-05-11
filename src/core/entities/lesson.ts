import { z } from "zod"

// ─── Firestore document schema ────────────────────────────────────────────────
// Stored in the `lessons` collection. Contains only raw, persisted data.
// Computed fields (isEnrolled, checkInStatus, previewConsumption, isOffPeak)
// are derived at read time in the data-source layer and never written to Firestore.

export const LessonStatusSchema = z.enum(["scheduled", "finished", "cancelled"])

export const LessonDocumentSchema = z.object({
  id: z.string(),
  professorId: z.string(),
  professorName: z.string(),
  level: z.string(),
  levelIndex: z.number().int().min(0).max(6),
  dateTime: z.string(), // ISO 8601
  court: z.string(),
  totalSpots: z.number().int().positive(),
  // Students with a reserved spot (pre-enrolled by admin — gets T-24h priority window)
  enrolledStudentIds: z.array(z.string()).default([]),
  // Students who confirmed attendance (plays already deducted)
  checkedInStudentIds: z.array(z.string()).default([]),
  // Students explicitly marked as absent by the teacher (no refund)
  absentStudentIds: z.array(z.string()).default([]),
  status: LessonStatusSchema,
  // Set to true when a teacher reschedules the lesson after students enrolled
  wasRescheduled: z.boolean().default(false),
  description: z.string().optional(),
  titularIds: z.array(z.string()).default([]),
  reservaIds: z.array(z.string()).default([]),
  // Populated when the lesson is cancelled
  cancellationReason: z.string().nullish(),
  // Populated when this lesson was rescheduled: points to the new lesson doc
  rescheduledToId: z.string().optional(),
  // Populated on the new lesson doc created from a reschedule
  rescheduledFromId: z.string().optional(),
})

export type LessonDocument = z.infer<typeof LessonDocumentSchema>
export type LessonStatus = z.infer<typeof LessonStatusSchema>

// ─── View model ───────────────────────────────────────────────────────────────
// What the UI consumes. Computed fields are added by getLessons() in booking.ts.

export const CheckInStatusSchema = z.enum([
  "not_open",      // more than 24h away
  "enrolled_only", // within T-24h, exclusive to pre-enrolled students
  "open",          // within T-6h, open to all eligible students
  "closed",        // class already started/passed
  "done",          // student already checked in (plays deducted)
])

export const LessonSchema = z.object({
  id: z.string(),
  professorId: z.string(),
  professorName: z.string(),
  level: z.string(),
  levelIndex: z.number().int().min(0).max(6),
  dateTime: z.string(),
  court: z.string(),
  totalSpots: z.number().int().positive(),
  enrolledCount: z.number().int().nonnegative(),
  isEnrolled: z.boolean(),
  checkInStatus: CheckInStatusSchema,
  previewConsumption: z.number().nonnegative(),
  isOffPeak: z.boolean(),
  status: LessonStatusSchema,
  wasRescheduled: z.boolean().default(false),
  description: z.string().optional(),
  titularIds: z.array(z.string()).default([]),
  reservaIds: z.array(z.string()).default([]),
  enrolledStudentIds: z.array(z.string()).default([]),
  checkedInStudentIds: z.array(z.string()).default([]),
  absentStudentIds: z.array(z.string()).default([]),
  cancellationReason: z.string().nullish(),
  rescheduledToId: z.string().optional(),
  rescheduledFromId: z.string().optional(),
})

export const ProfessorSchema = z.object({
  id: z.string(),
  name: z.string(),
  isPremium: z.boolean(),
})

export type CheckinStatus = z.infer<typeof CheckInStatusSchema>
export type Lesson = z.infer<typeof LessonSchema>
export type CheckInStatus = z.infer<typeof CheckInStatusSchema>

// ─── Lesson grid template ─────────────────────────────────────────────────────
// Stored in `configs/lessonGrid`. Contains only the static, admin-configured
// fields. Runtime fields (dateTime, enrolledStudentIds, checkedInStudentIds,
// status) are intentionally excluded — they are generated when the schedule
// Cloud Function executes.

export const LessonGridTemplateSchema = z.object({
  dayOfWeek: z.number().int().min(1).max(7), // 1=Mon … 7=Sun
  brtHour: z.number().int().min(0).max(23),
  court: z.string(),
  professorId: z.string(),
  professorName: z.string(),
  level: z.string(),
  levelIndex: z.number().int().min(0).max(6),
  totalSpots: z.number().int().positive(),
  description: z.string().optional(),
  titularIds: z.array(z.string()).default([]),
  reservaIds: z.array(z.string()).default([]),
})

export type LessonGridTemplate = z.infer<typeof LessonGridTemplateSchema>

// ─── Admin lesson creation input ──────────────────────────────────────────────
// Domain input for bulk lesson creation. Consumed by the Firebase infra layer
// and the admin-lessons feature hooks.

export interface CreateLessonInput {
  description: string
  professorId: string
  professorName: string
  lessonPrice: number
  level: string
  levelIndex: number
  dateTime: string
  court: string
  totalSpots: number
  type: "avulsa" | "recorrente"
  repeatUntil?: string
}

// ─── Lesson history entries ────────────────────────────────────────────────────
// Used by student history page and teacher history page.
// Enriched at read time from transactions; never stored in Firestore.

export interface LessonHistoryEntry {
  id: string
  professorName: string
  level: string
  dateTime: string
  court: string
  status: LessonStatus
  wasRescheduled: boolean
  cancellationReason?: string | null
  rescheduledToId?: string
  checkedInStudentIds: string[]
  absentStudentIds: string[]
  /** Plays effectively deducted — sourced from the debit transaction. Null if no transaction found. */
  playsSpent: number | null
}

export interface TeacherLessonHistoryEntry {
  id: string
  level: string
  dateTime: string
  court: string
  status: "finished" | "cancelled"
  cancellationReason?: string | null
  totalEnrolled: number
  presentStudents: Array<{ id: string; name: string | null }>
  absentCount: number
  pendingCount: number
  totalEarned: number
}
