import { deriveLessonDisplayStatus } from "@/core/math/lesson-display"
import type { Lesson } from "@/core/entities/lesson"
import type { LessonFilters } from "./use-lessons"

export type StatusFilter = "" | "active" | "cancelled" | "rescheduled"

const PAGE_SIZE = 7

// Check-in statuses that indicate the enrollment window is currently active
const OPEN_FOR_ENROLLMENT: Lesson["checkInStatus"][] = ["open", "enrolled_only", "done"]

interface UseLessonFiltersResult {
  filteredLessons: Lesson[] | undefined
  paginatedLessons: Lesson[] | undefined
  totalPages: number
  safePage: number
}

export function useLessonFilters(
  rawLessons: Lesson[] | undefined,
  filters: LessonFilters,
  availableOnly: boolean,
  statusFilter: StatusFilter,
  openOnly: boolean,
  page: number,
): UseLessonFiltersResult {
  const filteredLessons = rawLessons?.filter((l) => {
    if (filters.professorId && l.professorId !== filters.professorId) return false
    if (filters.level && l.level !== filters.level) return false
    if (availableOnly && l.enrolledCount >= l.totalSpots && !l.isEnrolled) return false
    if (openOnly && (l.status === "cancelled" || !OPEN_FOR_ENROLLMENT.includes(l.checkInStatus))) return false

    const { isCancelled, isRescheduled, isActive } = deriveLessonDisplayStatus(l)
    if (statusFilter === "active" && !isActive) return false
    if (statusFilter === "cancelled" && !isCancelled) return false
    if (statusFilter === "rescheduled" && !isRescheduled) return false

    return true
  })

  const totalPages = Math.max(1, Math.ceil((filteredLessons?.length ?? 0) / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const paginatedLessons = filteredLessons?.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  return { filteredLessons, paginatedLessons, totalPages, safePage }
}
