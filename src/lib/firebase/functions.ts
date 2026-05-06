import { scheduler } from "firebase-functions/v2";
import * as admin from "firebase-admin";
import { z } from "zod";
import {
  LessonGridTemplateSchema,
  LessonGridTemplate,
} from "../../core/entities/lesson";

admin.initializeApp();
const db = admin.firestore();

// Returns the Monday that is two weeks ahead from now, at midnight BRT (UTC-3)
function getMondayTwoWeeksAhead(): Date {
  const now = new Date();
  const dayOfWeek = now.getUTCDay(); // 0=Sun, 1=Mon, ...
  const daysUntilNextMonday = dayOfWeek === 1 ? 7 : (8 - dayOfWeek) % 7 || 7;
  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() + daysUntilNextMonday + 7);
  monday.setUTCHours(3, 0, 0, 0); // midnight BRT = 03:00 UTC
  return monday;
}

// Given a reference Monday, returns the Date for the given dayOfWeek (1=Mon…7=Sun) at brtHour
function calculateTargetDate(monday: Date, dayOfWeek: number, brtHour: number): Date {
  const offset = dayOfWeek - 1; // Monday is day 1, so offset 0
  const date = new Date(monday);
  date.setUTCDate(monday.getUTCDate() + offset);
  date.setUTCHours(brtHour + 3, 0, 0, 0); // convert BRT to UTC
  return date;
}

// Produces a stable, collision-free document ID from a lesson's datetime + court
function generateDeterministicId(date: Date, court: string): string {
  const datePart = date.toISOString().replace(/[:.]/g, "-");
  const courtPart = court.toLowerCase().replace(/\s+/g, "-");
  return `${datePart}_${courtPart}`;
}

const LessonGridSchema = z.array(LessonGridTemplateSchema);

// Runs every Monday at midnight UTC
export const dailyScheduleGenerator = scheduler.onSchedule("0 0 * * 1", async () => {
  // 1. Busca a grade padrão (o molde) que o Admin configurou
  const gridDoc = await db.collection("configs").doc("lessonGrid").get();

  // Parse garante que dados do Firestore estejam íntegros antes de prosseguir
  const scheduleTemplate = LessonGridSchema.parse(gridDoc.data()?.lessons);

  // 2. Calcula a data de início da semana que deve ser gerada (daqui a 2 semanas)
  const targetMonday = getMondayTwoWeeksAhead();

  // 3. Loop para criar as aulas baseadas no template
  const batch = db.batch();
  scheduleTemplate.forEach((tpl: LessonGridTemplate) => {
    const lessonDate = calculateTargetDate(targetMonday, tpl.dayOfWeek, tpl.brtHour);
    const lessonId = generateDeterministicId(lessonDate, tpl.court);

    const lessonRef = db.collection("lessons").doc(lessonId);

    // Spread explícito — garante que campos de scheduling (dayOfWeek, brtHour)
    // não sejam escritos no documento LessonDocument
    const lessonData = {
      id: lessonId,
      professorId: tpl.professorId,
      professorName: tpl.professorName,
      level: tpl.level,
      levelIndex: tpl.levelIndex,
      court: tpl.court,
      totalSpots: tpl.totalSpots,
      ...(tpl.description !== undefined && { description: tpl.description }),
      dateTime: lessonDate.toISOString(),
      enrolledStudentIds: [],
      checkedInStudentIds: [],
      status: "scheduled" as const,
    };

    // Merge garante que não apaguemos edições manuais do Admin
    batch.set(lessonRef, lessonData, { merge: true });
  });

  await batch.commit();
  console.log("Próxima semana de aulas gerada com sucesso!");
});
