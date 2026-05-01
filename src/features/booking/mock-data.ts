// src/features/booking/mock-data.ts
import type { Lesson } from "@/core/entities/lesson"

/**
 * Mock upcoming lessons.
 * Dates are relative to a "current" date around 2026-05-05.
 * previewConsumption is pre-calculated for a "Mensal" plan student.
 *
 * TODO (Supabase): Replace with real-time queries.
 *   - Fetch from `lessons` table joined with `enrollments` for the current user
 *   - Calculate checkInStatus server-side or in an edge function
 *   - Use `calculateConsumption()` from core/math/consumption.ts
 */
export const MOCK_LESSONS: Lesson[] = [
  {
    id: "lesson-1",
    professorId: "paulinho",
    professorName: "Paulinho",
    level: "Nível B",
    levelIndex: 4,
    dateTime: "2026-05-01T20:00:00.000Z",
    court: "Quadra 2",
    totalSpots: 4,
    enrolledCount: 3,
    isEnrolled: true,
    checkInStatus: "enrolled_only",
    previewConsumption: 0.86, 
    isOffPeak: true,
    description: "Treino técnico com foco em fundamentos de backhand e posicionamento de quadra. Indicado para alunos que já dominam o forehand e querem equilibrar os dois lados.",
  },
  {
    id: "lesson-2",
    professorId: "marilia",
    professorName: "Marília",
    level: "Nível A",
    levelIndex: 5,
    dateTime: "2026-05-01T23:00:00.000Z",
    court: "Quadra 1",
    totalSpots: 4,
    enrolledCount: 2,
    isEnrolled: false,
    checkInStatus: "open",
    previewConsumption: 1.5, // 1.50h peak, no discount
    isOffPeak: false,
    description: "Aula intensiva com Marília, focada em saque e volei de rede. Formato de alta exigência técnica para alunos de nível A que buscam refinar detalhes competitivos.",
  },
  {
    id: "lesson-3",
    professorId: "biel",
    professorName: "Biel",
    level: "Nível C",
    levelIndex: 3,
    dateTime: "2026-04-05T17:00:00.000Z",
    court: "Quadra 3",
    totalSpots: 4,
    enrolledCount: 1,
    isEnrolled: false,
    checkInStatus: "open",
    previewConsumption: 1.0, // 1.05 * 0.95 = 0.9975 -> round = 1.00h (off-peak)
    isOffPeak: true,
    description: "Treino polivalente com Biel para alunos de Nível C. Trabalho de consistência em rallies longos e introdução a bolas cortadas.",
  },
  {
    id: "lesson-4",
    professorId: "pepe",
    professorName: "Pepe",
    level: "Nível B",
    levelIndex: 4,
    dateTime: "2026-04-05T18:30:00.000Z",
    court: "Quadra 2",
    totalSpots: 4,
    enrolledCount: 4,
    isEnrolled: true,
    checkInStatus: "open",
    previewConsumption: 1.1, // 1.10h peak, no discount
    isOffPeak: false,
    description: "Jogo tático com o Pepe — sessão de simulação de pontos e estratégia de jogo em duplas. Turma fechada, todos os alunos já inscritos.",
  },
  {
    id: "lesson-5",
    professorId: "paulinho",
    professorName: "Paulinho",
    level: "Nível B",
    levelIndex: 4,
    dateTime: "2026-04-06T09:00:00.000Z",
    court: "Quadra 2",
    totalSpots: 4,
    enrolledCount: 2,
    isEnrolled: true,
    checkInStatus: "not_open",
    previewConsumption: 0.86,
    isOffPeak: true,
  },
  {
    id: "lesson-6",
    professorId: "marilia",
    professorName: "Marília",
    level: "Nível C",
    levelIndex: 3,
    dateTime: "2026-04-06T20:30:00.000Z",
    court: "Quadra 1",
    totalSpots: 6,
    enrolledCount: 5,
    isEnrolled: false,
    checkInStatus: "not_open",
    previewConsumption: 1.43, // 1.50 (mensal) * 0.95 (off-peak) = 1.425 -> ceil = 1.43
    isOffPeak: true,
  },
  {
    id: "lesson-7",
    professorId: "biel",
    professorName: "Biel",
    level: "Iniciante",
    levelIndex: 1,
    dateTime: "2026-04-07T10:00:00.000Z",
    court: "Quadra 3",
    totalSpots: 6,
    enrolledCount: 3,
    isEnrolled: false,
    checkInStatus: "not_open",
    previewConsumption: 1.0, // 1.05 * 0.95 = 0.9975 -> round = 1.00h (off-peak)
    isOffPeak: true,
  },
  {
    id: "lesson-8",
    professorId: "pepe",
    professorName: "Pepe",
    level: "Nível D",
    levelIndex: 2,
    dateTime: "2026-04-07T19:00:00.000Z",
    court: "Quadra 2",
    totalSpots: 4,
    enrolledCount: 0,
    isEnrolled: false,
    checkInStatus: "not_open",
    previewConsumption: 1.1, // peak
    isOffPeak: false,
  },
  // ─── Tomorrow (2026-05-02) — feeds the Operational Radar ─────────────────
  {
    id: "lesson-9",
    professorId: "pepe",
    professorName: "Pepe",
    level: "Nível C",
    levelIndex: 3,
    dateTime: "2026-05-02T12:00:00.000Z", // 09:00 BRT — ghost (0 enrolled)
    court: "Quadra 3",
    totalSpots: 4,
    enrolledCount: 0,
    isEnrolled: false,
    checkInStatus: "not_open",
    previewConsumption: 1.0,
    isOffPeak: true,
  },
  {
    id: "lesson-10",
    professorId: "marilia",
    professorName: "Marília",
    level: "Nível A",
    levelIndex: 5,
    dateTime: "2026-05-02T21:00:00.000Z", // 18:00 BRT — full (4/4)
    court: "Quadra 1",
    totalSpots: 4,
    enrolledCount: 4,
    isEnrolled: false,
    checkInStatus: "not_open",
    previewConsumption: 1.5,
    isOffPeak: false,
  },
]
