import { z } from "zod"

export const CheckInStatusSchema = z.enum([
  "not_open",      // more than 24h away
  "enrolled_only", // within T-24h, exclusive to titular students
  "open",          // within T-6h, open to all eligible students
  "closed",        // class already started/passed
  "done",          // student already checked in
])

export const LessonSchema = z.object({
  id: z.string(),
  professorId: z.string(),
  professorName: z.string(),
  level: z.string(),
  levelIndex: z.number().int().min(0).max(6),
  dateTime: z.string(), // ISO 8601
  court: z.string(),
  totalSpots: z.number().int().positive(),
  enrolledCount: z.number().int().nonnegative(),
  isEnrolled: z.boolean(),
  checkInStatus: CheckInStatusSchema,
  /** Pre-calculated consumption for display (based on student's current plan + time) */
  previewConsumption: z.number().nonnegative(),
  isOffPeak: z.boolean(),
  description: z.string().optional(),
})

export const ProfessorSchema = z.object({
  id: z.string(),
  name: z.string(),
  isPremium: z.boolean(),
})

export type Lesson = z.infer<typeof LessonSchema>
export type CheckInStatus = z.infer<typeof CheckInStatusSchema>
