"use client"

import { useState } from "react"
import { toast } from "sonner"
import { canCancelCheckIn } from "@/core/math/consumption"
import { useCancelCheckIn } from "./use-lessons"
import type { Lesson } from "@/core/entities/lesson"

export interface LessonCancelFlow {
  handleCancelClick: () => void
  executeCancel: () => void
  showCancelModal: boolean
  setShowCancelModal: (open: boolean) => void
  isPending: boolean
}

export function useLessonCancelFlow(lesson: Lesson): LessonCancelFlow {
  const [showCancelModal, setShowCancelModal] = useState(false)
  const cancelCheckIn = useCancelCheckIn()

  function executeCancel() {
    cancelCheckIn.mutate(lesson, {
      onSuccess: (data) => {
        setShowCancelModal(false)
        if (data.refunded) {
          toast.success("Check-in cancelado! Os Play's foram reembolsados para sua carteira.")
        } else {
          toast.warning("Inscrição cancelada (sem reembolso devido ao prazo de 4h).")
        }
      },
      onError: (err: Error) => {
        toast.error("Erro ao cancelar: " + err.message)
      },
    })
  }

  function handleCancelClick() {
    if (canCancelCheckIn(new Date(lesson.dateTime))) {
      executeCancel()
    } else {
      setShowCancelModal(true)
    }
  }

  return {
    handleCancelClick,
    executeCancel,
    showCancelModal,
    setShowCancelModal,
    isPending: cancelCheckIn.isPending,
  }
}
