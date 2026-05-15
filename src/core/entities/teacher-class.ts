import { z } from "zod"

export const TeacherClassSchema = z.object({
  teacherId: z.string(),
  titularIds: z.array(z.string()).default([]),
  reservaIds: z.array(z.string()).default([]),
  classSize: z.number().int().positive().default(4),
  updatedAt: z.string().optional(),
})
export type TeacherClass = z.infer<typeof TeacherClassSchema>
