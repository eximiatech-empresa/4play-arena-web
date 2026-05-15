"use client"

import { useQuery } from "@tanstack/react-query"
import { getTeachers } from "@/lib/firebase/firestore"
import type { TeacherUser } from "@/core/entities/user"

export function useTeachers() {
  return useQuery<TeacherUser[]>({
    queryKey: ["teachers"],
    queryFn: () => getTeachers(),
    staleTime: 10 * 60 * 1000,
  })
}
