import { useMemo } from "react"
import { useLessons } from "@/features/student/aulas/hooks/use-lessons"
import { useCurrentUser } from "@/hooks/use-current-user"
import {
  groupEnrollmentsByRelationship,
  getTopStudentsByFrequency,
  type GroupedEnrollments,
  type FrequencyEntry,
  type StudentEnrollment,
} from "@/core/math/teacher-stats"
import type { Lesson } from "@/core/entities/lesson"

const MOCK_TEACHER_WALLET_BALANCE = 0
const MOCK_NEXT_LESSON_ENROLLMENTS: StudentEnrollment[] = []
const MOCK_TEACHER_FREQUENCY: FrequencyEntry[] = []

export interface TeacherDashboardData {
  isLoading: boolean
  walletBalance: number
  nextLesson: Lesson | null
  enrollments: GroupedEnrollments
  frequencyRanking: FrequencyEntry[]
}

export function useTeacherDashboard(): TeacherDashboardData {
  const { data: currentUser, isLoading: isUserLoading } = useCurrentUser()
  const { data: lessons = [], isLoading: isLessonsLoading } = useLessons()

  const isLoading = isUserLoading || isLessonsLoading

  return useMemo(() => {
    if (isLoading) {
      return {
        isLoading: true,
        walletBalance: 0,
        nextLesson: null,
        enrollments: { titular: [], visitors: [] },
        frequencyRanking: [],
      }
    }

    const now = new Date()
    const nextLesson =
      [...lessons]
        .filter((l) => new Date(l.dateTime) > now && l.checkInStatus !== "closed")
        .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime())[0] ?? null

    return {
      isLoading: false,
      walletBalance: MOCK_TEACHER_WALLET_BALANCE,
      nextLesson,
      enrollments: groupEnrollmentsByRelationship(MOCK_NEXT_LESSON_ENROLLMENTS),
      frequencyRanking: getTopStudentsByFrequency(MOCK_TEACHER_FREQUENCY, 5),
    }
  }, [isLoading, currentUser, lessons])
}
