"use client"

import { useEffect, useRef } from "react"
import gsap from "gsap"
import type { Lesson } from "@/core/entities/lesson"

export function useLessonGridAnimation(
  lessons: Lesson[] | undefined,
  isLoading: boolean,
): React.RefObject<HTMLDivElement | null> {
  const gridRef = useRef<HTMLDivElement>(null)
  const isFirstRender = useRef(true)
  const prevIsLoading = useRef(false)
  const prevLessonIds = useRef<string>("")

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (isLoading && !prevIsLoading.current && gridRef.current) {
        const children = Array.from(gridRef.current.children)
        if (children.length) {
          gsap.to(children, { opacity: 0, y: -10, duration: 0.18, ease: "power2.in", stagger: 0.03 })
        }
      }
    }, gridRef)

    prevIsLoading.current = isLoading
    return () => ctx.revert()
  }, [isLoading])

  useEffect(() => {
    if (isLoading || !gridRef.current || !lessons) return

    const currentLessonIds = lessons.map((l) => l.id).join(",")
    if (currentLessonIds === prevLessonIds.current) return
    prevLessonIds.current = currentLessonIds

    const children = Array.from(gridRef.current.children)
    if (!children.length) return

    const ctx = gsap.context(() => {
      if (isFirstRender.current) {
        gsap.set(children, { opacity: 1, y: 0 })
        isFirstRender.current = false
        return
      }
      gsap.fromTo(
        children,
        { opacity: 0, y: 22 },
        { opacity: 1, y: 0, duration: 0.38, ease: "power3.out", stagger: 0.07, clearProps: "all" },
      )
    }, gridRef)

    return () => ctx.revert()
  }, [lessons, isLoading])

  return gridRef
}
