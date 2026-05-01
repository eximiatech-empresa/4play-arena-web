import type { StudentEnrollment, FrequencyEntry } from "@/core/math/teacher-stats"

// Mock balance earned by the teacher from student check-ins
export const MOCK_TEACHER_WALLET_BALANCE = 24.5

// Mock enrolled students for the teacher's next lesson
// isMainStudent = true means this student has this teacher as their originalTeacherId (titular)
export const MOCK_NEXT_LESSON_ENROLLMENTS: StudentEnrollment[] = [
  {
    studentId: "s1",
    studentName: "Carlos Silva",
    studentLevel: "Nível B",
    isMainStudent: true,
    checkedIn: true,
  },
  {
    studentId: "s2",
    studentName: "Ana Costa",
    studentLevel: "Nível B",
    isMainStudent: true,
    checkedIn: false,
  },
  {
    studentId: "s5",
    studentName: "Lucas Ferreira",
    studentLevel: "Nível C",
    isMainStudent: true,
    checkedIn: false,
  },
  {
    studentId: "s3",
    studentName: "Rodrigo Lima",
    studentLevel: "Nível A",
    isMainStudent: false,
    checkedIn: true,
  },
]

// Historical check-in frequency per student for this teacher
export const MOCK_TEACHER_FREQUENCY: FrequencyEntry[] = [
  {
    studentId: "s1",
    studentName: "Carlos Silva",
    studentLevel: "Nível B",
    totalCheckIns: 18,
  },
  {
    studentId: "s2",
    studentName: "Ana Costa",
    studentLevel: "Nível B",
    totalCheckIns: 15,
  },
  {
    studentId: "s4",
    studentName: "Pedro Santos",
    studentLevel: "Nível C",
    totalCheckIns: 12,
  },
  {
    studentId: "s5",
    studentName: "Fernanda Rocha",
    studentLevel: "Nível B",
    totalCheckIns: 10,
  },
  {
    studentId: "s3",
    studentName: "Rodrigo Lima",
    studentLevel: "Nível A",
    totalCheckIns: 7,
  },
  {
    studentId: "s6",
    studentName: "Beatriz Mendes",
    studentLevel: "Nível D",
    totalCheckIns: 5,
  },
]
