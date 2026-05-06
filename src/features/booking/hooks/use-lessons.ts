import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getFirebaseAuth } from "@/lib/firebase/auth"
import { getLessons, getLessonsByDate, processCheckIn, processCheckOut } from "@/lib/firebase/booking"
import { canCancelCheckIn, getCheckInStatus } from "@/core/math/consumption"
import { useCurrentUser } from "@/hooks/use-current-user"
import { useWallet } from "@/features/wallet/hooks/use-wallet"
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

  const userId = currentUser?.uid;
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
      const user = getFirebaseAuth().currentUser
      if (!user) throw new Error("Usuário não logado")

      const currentStatus = getCheckInStatus(new Date(lesson.dateTime), lesson.isEnrolled, new Date())

      if (currentStatus === "not_open") throw new Error("O check-in para esta aula ainda não está liberado.")
      if (currentStatus === "closed") throw new Error("Esta aula já foi encerrada.")

      await processCheckIn(
        user.uid,
        lesson.id,
        lesson.previewConsumption,
        lesson.professorName,
        lesson.level,
        lesson.isOffPeak,
      )

      return { ...lesson, checkInStatus: "done" as const }
    },
    onSuccess: (updatedLesson) => {
      queryClient.setQueriesData<Lesson[]>({ queryKey: LESSONS_QUERY_KEY }, (old) => {
        if (!old) return old
        return old.map((l) => (l.id === updatedLesson.id ? updatedLesson : l))
      })
      queryClient.invalidateQueries({ queryKey: ["wallet"] })
    },
  })
}

export function useCancelCheckIn() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (lesson: Lesson) => {
      const user = getFirebaseAuth().currentUser
      if (!user) throw new Error("Usuário não logado")

      const isValidForRefund = canCancelCheckIn(new Date(lesson.dateTime))

      if (isValidForRefund) {
        await processCheckOut(user.uid, lesson.id, lesson.previewConsumption, lesson.professorName)
      }

      return {
        updatedLesson: { ...lesson, checkInStatus: "open" as const },
        refunded: isValidForRefund,
      }
    },
    onSuccess: ({ updatedLesson }) => {
      queryClient.setQueriesData<Lesson[]>({ queryKey: LESSONS_QUERY_KEY }, (old) => {
        if (!old) return old
        return old.map((l) => (l.id === updatedLesson.id ? updatedLesson : l))
      })
      queryClient.invalidateQueries({ queryKey: ["wallet"] })
    },
  })
}
