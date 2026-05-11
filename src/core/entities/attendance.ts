import { z } from "zod"

export const AttendanceStatusSchema = z.enum(["present", "absent", "pending"])

export const AttendanceStudentSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: AttendanceStatusSchema,
})

export const AttendanceSummarySchema = z.object({
  presentCount: z.number().int().nonnegative(),
  absentCount: z.number().int().nonnegative(),
  pendingCount: z.number().int().nonnegative(),
})

export type AttendanceStatus = z.infer<typeof AttendanceStatusSchema>
export type AttendanceStudent = z.infer<typeof AttendanceStudentSchema>
export type AttendanceSummary = z.infer<typeof AttendanceSummarySchema>
