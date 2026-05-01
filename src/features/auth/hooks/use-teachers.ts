"use client"

import { useQuery } from "@tanstack/react-query"
import type { TeacherUser } from "@/core/entities/user"

const MOCK_TEACHERS: TeacherUser[] = [
  { uid: "teacher_paulinho", name: "Paulinho", email: "paulinho@4playarena.com", role: "TEACHER", createdAt: "2024-01-01", isActive: true },
  { uid: "teacher_biel",     name: "Biel",     email: "biel@4playarena.com",     role: "TEACHER", createdAt: "2024-01-01", isActive: true },
  { uid: "teacher_pepe",     name: "Pepe",     email: "pepe@4playarena.com",     role: "TEACHER", createdAt: "2024-01-01", isActive: true },
  { uid: "teacher_marilia",  name: "Marília",  email: "marilia@4playarena.com",  role: "TEACHER", createdAt: "2024-01-01", isActive: true },
]

export function useTeachers() {
  return useQuery({
    queryKey: ["teachers"],
    queryFn: async (): Promise<TeacherUser[]> => {
      // TODO: substituir por getTeachers() do Firestore quando professores estiverem cadastrados
      return MOCK_TEACHERS
    },
    staleTime: 10 * 60 * 1000,
  })
}
