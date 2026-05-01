export interface StudentEnrollment {
  studentId: string
  studentName: string
  studentLevel: string
  isMainStudent: boolean
  checkedIn: boolean
}

export interface GroupedEnrollments {
  titular: StudentEnrollment[]
  visitors: StudentEnrollment[]
}

export interface FrequencyEntry {
  studentId: string
  studentName: string
  studentLevel: string
  totalCheckIns: number
}

export function groupEnrollmentsByRelationship(
  enrollments: StudentEnrollment[]
): GroupedEnrollments {
  return {
    titular: enrollments.filter((e) => e.isMainStudent),
    visitors: enrollments.filter((e) => !e.isMainStudent),
  }
}

export function getTopStudentsByFrequency(
  history: FrequencyEntry[],
  topN = 5
): FrequencyEntry[] {
  return [...history]
    .sort((a, b) => b.totalCheckIns - a.totalCheckIns)
    .slice(0, topN)
}
