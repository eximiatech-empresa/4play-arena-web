import type { AttendanceStatus, AttendanceStudent, AttendanceSummary } from "@/core/entities/attendance"

/**
 * Derives the attendance status for a single student from lesson arrays.
 * Pure function — no side effects.
 */
export function getAttendanceStatus(
  studentId: string,
  checkedInStudentIds: string[],
  absentStudentIds: string[],
): AttendanceStatus {
  if (checkedInStudentIds.includes(studentId)) return "present"
  if (absentStudentIds.includes(studentId)) return "absent"
  return "pending"
}

/**
 * Applies an attendance status change to lesson attendance arrays.
 * Returns updated copies — does not mutate input arrays.
 * Pure function — no side effects.
 */
export function applyAttendanceChange(
  checkedInStudentIds: string[],
  absentStudentIds: string[],
  studentId: string,
  status: "present" | "absent" | "none",
): { checkedInStudentIds: string[]; absentStudentIds: string[] } {
  if (status === "present") {
    return {
      checkedInStudentIds: [...new Set([...checkedInStudentIds, studentId])],
      absentStudentIds: absentStudentIds.filter((id) => id !== studentId),
    }
  }
  if (status === "absent") {
    return {
      checkedInStudentIds: checkedInStudentIds.filter((id) => id !== studentId),
      absentStudentIds: [...new Set([...absentStudentIds, studentId])],
    }
  }
  return {
    checkedInStudentIds: checkedInStudentIds.filter((id) => id !== studentId),
    absentStudentIds: absentStudentIds.filter((id) => id !== studentId),
  }
}

/**
 * Computes present / absent / pending counts from a list of attendance students.
 * Pure function — no side effects.
 */
export function computeAttendanceSummary(students: AttendanceStudent[]): AttendanceSummary {
  return {
    presentCount: students.filter((s) => s.status === "present").length,
    absentCount: students.filter((s) => s.status === "absent").length,
    pendingCount: students.filter((s) => s.status === "pending").length,
  }
}
