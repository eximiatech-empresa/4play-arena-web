"use client"

import { useState } from "react"
import { LessonCard } from "@/features/booking/components/lesson-card"
import { LessonDetailsModal } from "@/features/booking/components/lesson-details-modal"
import type { Lesson } from "@/core/entities/lesson"

interface UpcomingLessonsSectionProps {
  lessons: Lesson[]
  studentLevelIndex: number
  walletBalance: number
}

export function UpcomingLessonsSection({
  lessons,
  studentLevelIndex,
  walletBalance,
}: UpcomingLessonsSectionProps) {
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null)

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {lessons.map((lesson) => (
          <LessonCard
            key={lesson.id}
            lesson={lesson}
            studentLevelIndex={studentLevelIndex}
            walletBalance={walletBalance}
            onClick={() => setSelectedLesson(lesson)}
          />
        ))}
      </div>

      <LessonDetailsModal
        lesson={selectedLesson}
        open={!!selectedLesson}
        onClose={() => setSelectedLesson(null)}
        studentLevelIndex={studentLevelIndex}
        walletBalance={walletBalance}
      />
    </>
  )
}
