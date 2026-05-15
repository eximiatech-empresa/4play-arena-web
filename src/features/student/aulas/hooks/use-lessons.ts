import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getFirebaseAuth } from "@/lib/firebase/auth"
import { getLessons, getLessonsByDate, processCheckIn, processCheckOut } from "@/lib/firebase/booking"
import { useCurrentUser } from "@/hooks/use-current-user"
import { useWallet } from "@/features/student/carteira/hooks/use-wallet"
import { executeCheckIn } from "@/core/usecases/booking/check-in"
import { executeCheckOut, calculateRefundAmount } from "@/core/usecases/booking/check-out"
import type { Lesson } from "@/core/entities/lesson"
import type { Plan } from "@/core/entities/wallet"

export const LESSONS_QUERY_KEY = ["lessons"] as const

export interface LessonFilters {
  professorId?: string
  level?: string
  availableOnly?: boolean
}

export function useLessons(filters?: LessonFilters, opts?: { enabled?: boolean }) {
  const { data: currentUser } = useCurrentUser()
  const { data: wallet } = useWallet()

  const userId = currentUser?.uid
  const plan: Plan = wallet?.plan ?? "mensal"

  return useQuery({
    queryKey: [...LESSONS_QUERY_KEY, userId, plan, filters],
    queryFn: async (): Promise<Lesson[]> => {
      if (!userId) return []
      return getLessons(userId, plan, filters)
    },
    enabled: !!userId && (opts?.enabled ?? true),
    staleTime: 2 * 60 * 1000,
  })
}

export function useLessonsByDate(dateStr: string, opts?: { enabled?: boolean }) {
  const { data: currentUser } = useCurrentUser()
  const { data: wallet } = useWallet()

  const studentId = currentUser?.role === "STUDENT" ? currentUser.uid : undefined
  const plan: Plan = wallet?.plan ?? "mensal"

  return useQuery({
    queryKey: ["lessons", "by-date", dateStr, studentId, plan],
    queryFn: (): Promise<Lesson[]> => {
      if (!studentId) return Promise.resolve([])
      return getLessonsByDate(dateStr, studentId, plan)
    },
    enabled: !!studentId && !!dateStr && (opts?.enabled ?? true),
    staleTime: 2 * 60 * 1000,
  })
}

export function useCheckIn() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (lesson: Lesson) => {
      const userId = getFirebaseAuth().currentUser?.uid ?? null
      await executeCheckIn(userId, lesson, processCheckIn)
      return { ...lesson, checkInStatus: "done" as const }
    },
    onSuccess: (updatedLesson) => {
      queryClient.setQueriesData<Lesson[]>({ queryKey: LESSONS_QUERY_KEY }, (old) => {
        if (!old) return old
        return old.map((l) => (l.id === updatedLesson.id ? updatedLesson : l))
      })
      queryClient.invalidateQueries({ queryKey: LESSONS_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: ["wallet"] })
    },
  })
}

export function useCancelCheckIn() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (lesson: Lesson) => {
      const userId = getFirebaseAuth().currentUser?.uid ?? null
      const { refunded } = await executeCheckOut(userId, lesson, processCheckOut)

      return {
        updatedLesson: {
          ...lesson,
          isEnrolled: false,
          checkInStatus: "open" as const,
          enrolledCount: Math.max(0, lesson.enrolledCount - 1),
        },
        refunded,
      }
    },
    onSuccess: ({ updatedLesson }) => {
      queryClient.setQueriesData<Lesson[]>({ queryKey: LESSONS_QUERY_KEY }, (old) => {
        if (!old) return old
        return old.map((l) => (l.id === updatedLesson.id ? updatedLesson : l))
      })
      queryClient.invalidateQueries({ queryKey: LESSONS_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: ["wallet"] })
    },
  })
}

export { calculateRefundAmount }
