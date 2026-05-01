// src/features/booking/hooks/use-lessons.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getFirebaseAuth } from "@/lib/firebase/auth"
import { processCheckIn, processCheckOut } from "@/lib/firebase/booking"
import { MOCK_LESSONS } from "@/features/booking/mock-data"
import { canCancelCheckIn, getCheckInStatus } from "@/core/math/consumption"
import type { Lesson } from "@/core/entities/lesson"

const LESSONS_QUERY_KEY = ["lessons"] as const

export interface LessonFilters {
  professorId?: string
  level?: string
  availableOnly?: boolean
}

function fetchLessons(filters?: LessonFilters): Promise<Lesson[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      let lessons = structuredClone(MOCK_LESSONS)
      const now = new Date()

      lessons = lessons.map(lesson => {
        if (lesson.checkInStatus === "done") return lesson

        const dynamicStatus = getCheckInStatus(new Date(lesson.dateTime), lesson.isEnrolled, now)
        return { ...lesson, checkInStatus: dynamicStatus}
      })

      if (filters?.professorId) lessons = lessons.filter((l) => l.professorId === filters.professorId)
      if (filters?.level) lessons = lessons.filter((l) => l.level === filters.level)
      if (filters?.availableOnly) lessons = lessons.filter((l) => l.enrolledCount < l.totalSpots || l.isEnrolled)
      resolve(lessons)
    }, 300)
  })
}

export function useLessons(filters?: LessonFilters) {
  return useQuery({
    queryKey: [...LESSONS_QUERY_KEY, filters],
    queryFn: () => fetchLessons(filters),
  })
}

export function useCheckIn() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (lesson: Lesson) => {
      const user = getFirebaseAuth().currentUser
      if (!user) throw new Error("Usuário não logado")

      const currentStatus = getCheckInStatus(new Date(lesson.dateTime), lesson.isEnrolled, new Date())

      if (currentStatus === "not_open") {
        throw new Error("O check-in para esta aula ainda não está liberado.")
      }
      if (currentStatus === "closed") {
        throw new Error("Esta aula já foi encerrada.")
      }

      // Débito REAL no Firebase
      await processCheckIn(
        user.uid,
        lesson.id,
        lesson.previewConsumption,
        lesson.professorName,
        lesson.level,
        lesson.isOffPeak
      )

      // Retorna a aula atualizada para o Front-end
      return { ...lesson, checkInStatus: "done" as const }
    },
    onSuccess: (updatedLesson) => {
      // Atualiza a tela de aulas e força a carteira a recarregar para mostrar o saldo novo!
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
        // Estorno REAL no Firebase
        await processCheckOut(user.uid, lesson.id, lesson.previewConsumption, lesson.professorName)
      } 
      // Não tem mais alert() aqui!

      return { 
        updatedLesson: { ...lesson, checkInStatus: "open" as const }, 
        refunded: isValidForRefund 
      }
    },
    // Perceba que desestruturamos { updatedLesson, refunded } do retorno acima
    onSuccess: ({ updatedLesson, refunded }) => {
      queryClient.setQueriesData<Lesson[]>({ queryKey: LESSONS_QUERY_KEY }, (old: Lesson[] | undefined) => {
        if (!old) return old
        return old.map((l) => (l.id === updatedLesson.id ? updatedLesson : l))
      })
      queryClient.invalidateQueries({ queryKey: ["wallet"] })
    },
  })
}