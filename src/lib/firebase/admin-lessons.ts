// src/lib/firebase/admin-lessons.ts

import {
  collection,
  doc,
  getDocs,
  deleteDoc,
  query,
  where,
  orderBy,
  writeBatch,
} from "firebase/firestore"
import { db } from "./firestore" // Ajuste o caminho se necessário (ex: "@/lib/firebase/config")
import { LessonDocumentSchema } from "@/core/entities/lesson"
import type { LessonDocument, CreateLessonInput } from "@/core/entities/lesson"
import { buildDateList } from "@/core/usecases/lessons/create-lesson"

export type { CreateLessonInput }

export async function getAdminLessonsByDate(dateStr: string): Promise<LessonDocument[]> {
  // dateStr = "YYYY-MM-DD" no fuso de Brasília (UTC-3, sem horário de verão desde 2019).
  // Aulas são salvas como ISO UTC com Z, então convertemos os limites do dia BRT → UTC
  // para evitar que aulas de ontem à noite (9pm-midnight BRT) apareçam no dia errado.
  const startUTC = new Date(`${dateStr}T00:00:00.000-03:00`).toISOString()
  const endUTC   = new Date(`${dateStr}T23:59:59.999-03:00`).toISOString()

  const snap = await getDocs(
    query(
      collection(db, "lessons"),
      where("dateTime", ">=", startUTC),
      where("dateTime", "<=", endUTC),
      orderBy("dateTime"),
    ),
  )

  return snap.docs.flatMap((d) => {
    const parsed = LessonDocumentSchema.safeParse({ id: d.id, ...d.data() })
    return parsed.success ? [parsed.data] : []
  })
}

export async function getAdminLessonsByMonth(
  year: number,
  month: number, // 0-indexed (JS Date convention)
): Promise<LessonDocument[]> {
  const mm     = String(month + 1).padStart(2, "0")
  const nextMon = month === 11 ? 1 : month + 2
  const nextYear = month === 11 ? year + 1 : year
  const nextMM  = String(nextMon).padStart(2, "0")

  // Mesma lógica: converter limites do mês BRT → UTC para não perder as últimas
  // horas do mês (9pm-midnight BRT do último dia estariam no primeiro dia UTC seguinte).
  const startUTC = new Date(`${year}-${mm}-01T00:00:00.000-03:00`).toISOString()
  const endUTC   = new Date(`${nextYear}-${nextMM}-01T00:00:00.000-03:00`).toISOString()

  const snap = await getDocs(
    query(
      collection(db, "lessons"),
      where("dateTime", ">=", startUTC),
      where("dateTime", "<",  endUTC),
      orderBy("dateTime"),
    ),
  )

  return snap.docs.flatMap((d) => {
    const parsed = LessonDocumentSchema.safeParse({ id: d.id, ...d.data() })
    return parsed.success ? [parsed.data] : []
  })
}

export async function createBulkLessons(input: CreateLessonInput): Promise<number> {
  const dates = buildDateList(input)
  const batch = writeBatch(db)

  for (const dateTime of dates) {
    const ref = doc(collection(db, "lessons"))
    batch.set(ref, {
      id: ref.id,
      description: input.description,
      professorId: input.professorId,
      professorName: input.professorName,
      level: input.level,
      levelIndex: input.levelIndex,
      dateTime,
      court: input.court,
      totalSpots: input.totalSpots,
      enrolledStudentIds: [],
      checkedInStudentIds: [],
      absentStudentIds: [],
      titularIds: [],
      reservaIds: [],
      status: "scheduled",
      wasRescheduled: false,
      
      // ── DESNORMALIZAÇÃO FINANCEIRA ──
      // Carimba as regras do professor diretamente no documento da aula.
      professorBasePlays: input.professorBasePlays,
      professorRoundingRule: input.professorRoundingRule || "round", // Fallback de segurança
      professorSharePct: input.professorSharePct,
      arenaSharePct: input.arenaSharePct,
    })
  }
  
  await batch.commit()
  return dates.length
}

export async function deleteLesson(lessonId: string): Promise<void> {
  await deleteDoc(doc(db, "lessons", lessonId))
}