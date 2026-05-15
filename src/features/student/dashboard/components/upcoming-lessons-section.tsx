"use client"

import { useState, useRef, useEffect } from "react" // <-- Adicionado useRef e useEffect
import gsap from "gsap" // <-- Adicionado GSAP
import { ChevronLeft, ChevronRight } from "lucide-react"
import { LessonCard } from "@/components/shared/lesson-card"
import { LessonDetailsModal } from "@/features/student/aulas/components/lesson-details-modal"
import type { Lesson } from "@/core/entities/lesson"
import { cn } from "@/lib/utils"

interface UpcomingLessonsSectionProps {
  lessons: Lesson[]
  studentLevelIndex: number
  walletBalance: number
}

const ITEMS_PER_PAGE = 5

export function UpcomingLessonsSection({
  lessons,
  studentLevelIndex,
  walletBalance,
}: UpcomingLessonsSectionProps) {
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  
  // 1. Criamos uma referência para a grelha que contém os cartões
  const gridRef = useRef<HTMLDivElement>(null)

  const totalPages = Math.ceil(lessons.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  
  const paginatedLessons = lessons.slice(startIndex, endIndex)

  // 2. O Efeito Mágico da Animação
  useEffect(() => {
    if (!gridRef.current) return

    // Utilizamos o gsap.context para ser seguro no React 18
    const ctx = gsap.context(() => {
      const children = Array.from(gridRef.current!.children)
      
      if (children.length) {
        gsap.fromTo(
          children,
          { opacity: 0, y: 20 }, 
          { 
            opacity: 1, 
            y: 0, 
            duration: 0.88, 
            ease: "power3.out", 
            stagger: 0.07, 
            clearProps: "all" 
          }
        )
      }
    }, gridRef)

    return () => ctx.revert()
  }, [currentPage]) // A animação dispara sempre que a PÁGINA mudar!

  return (
    <>
      {/* 3. Colocamos o ref na div que envolve os cartões */}
      <div ref={gridRef} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {paginatedLessons.map((lesson) => (
          <LessonCard
            key={lesson.id}
            lesson={lesson}
            studentLevelIndex={studentLevelIndex}
            walletBalance={walletBalance}
            onClick={() => setSelectedLesson(lesson)}
          />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-lg bg-zinc-300 text-zinc-700 hover:bg-brand/70 hover:text-zinc-950 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <span className="text-sm font-medium text-zinc-500">
            Página {currentPage} de {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg bg-zinc-300 text-zinc-700   hover:bg-brand/70 hover:text-zinc-950 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer "
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

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