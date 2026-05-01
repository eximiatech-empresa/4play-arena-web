import { STUDENT_LEVELS } from "@/core/constants/professors"
import type { Student } from "@/core/entities/student"

export const MOCK_STUDENT: Student = {
  id: "mock-user-1",
  name: "Carlos Silva",
  email: "aluno@4playarena.com",
  phone: "(11) 99999-0000",
  level: "Nível B",
  levelIndex: STUDENT_LEVELS.indexOf("Nível B"),
  memberSince: "2025-09-01",
  totalClassesTaken: 34,
  totalPlaysConsumed: 31.4,
}
