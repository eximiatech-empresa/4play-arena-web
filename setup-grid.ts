import * as admin from "firebase-admin"
import { readFileSync } from "fs"

// Pega a chave mestra
const filePath = "C:\\Users\\Guilherme\\Dev\\Trabalho\\Web\\4play-arena\\scripts\\serviceAccount.json" 
const serviceAccount = JSON.parse(readFileSync(filePath, "utf-8"))

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
const db = admin.firestore()

// A SUA GRADE OFICIAL
const RAW_SCHEDULE = [
  // ── TERÇA E QUINTA ──
  { professorId: "marilia", professorName: "Marília", level: "Nível B", levelIndex: 4, brtHour: 6, court: "Quadra 1", totalSpots: 6, daysOfWeek: [2, 4] },
  { professorId: "marilia", professorName: "Marília", level: "Nível B", levelIndex: 4, brtHour: 7, court: "Quadra 1", totalSpots: 6, daysOfWeek: [2, 4] },
  { professorId: "biel", professorName: "Biel", level: "Nível C", levelIndex: 3, brtHour: 7, court: "Quadra 2", totalSpots: 6, daysOfWeek: [2, 4] },
  { professorId: "paulinho", professorName: "Paulinho", level: "Nível C", levelIndex: 3, brtHour: 7, court: "Quadra 3", totalSpots: 6, daysOfWeek: [2, 4] },
  { professorId: "paulinho", professorName: "Paulinho", level: "Nível C", levelIndex: 3, brtHour: 7, court: "Quadra 4", totalSpots: 6, daysOfWeek: [2, 4] },
  { professorId: "biel", professorName: "Biel", level: "Nível C", levelIndex: 3, brtHour: 8, court: "Quadra 2", totalSpots: 6, daysOfWeek: [2, 4] },
  { professorId: "biel", professorName: "Biel", level: "Nível C", levelIndex: 3, brtHour: 9, court: "Quadra 2", totalSpots: 6, daysOfWeek: [2, 4] },
  { professorId: "israel", professorName: "Israel", level: "Nível C", levelIndex: 3, brtHour: 16, court: "Quadra 2", totalSpots: 6, daysOfWeek: [2, 4] },
  { professorId: "paulo-lima", professorName: "Paulo Lima/V.Hugo", level: "Nível B", levelIndex: 4, brtHour: 16, court: "Quadra 5", totalSpots: 6, daysOfWeek: [2, 4] },
  { professorId: "paulo-lima", professorName: "Paulo Lima/V.Hugo", level: "Nível B", levelIndex: 4, brtHour: 16, court: "Quadra 6", totalSpots: 6, daysOfWeek: [2, 4] },
  { professorId: "andreza", professorName: "Andreza", level: "Iniciante", levelIndex: 1, brtHour: 17, court: "Quadra 1", totalSpots: 12, daysOfWeek: [2, 4], description: "Turma de iniciantes com Andreza." },
  { professorId: "biel", professorName: "Biel", level: "Nível C", levelIndex: 3, brtHour: 17, court: "Quadra 2", totalSpots: 6, daysOfWeek: [2, 4] },
  { professorId: "paulo-lima", professorName: "Paulo Lima", level: "Nível B", levelIndex: 4, brtHour: 17, court: "Quadra 4", totalSpots: 6, daysOfWeek: [2, 4] },
  { professorId: "israel", professorName: "Israel", level: "Nível C", levelIndex: 3, brtHour: 17, court: "Quadra 5", totalSpots: 6, daysOfWeek: [2, 4] },
  { professorId: "ariane", professorName: "Ariane", level: "Nível C", levelIndex: 3, brtHour: 17, court: "Quadra 6", totalSpots: 6, daysOfWeek: [2, 4] },
  { professorId: "luiza-amelia", professorName: "Luiza Amélia", level: "Iniciante", levelIndex: 1, brtHour: 18, court: "Quadra 1", totalSpots: 12, daysOfWeek: [2, 4], description: "Turma de iniciantes com Luiza Amélia." },
  { professorId: "biel", professorName: "Biel", level: "Nível C", levelIndex: 3, brtHour: 18, court: "Quadra 2", totalSpots: 6, daysOfWeek: [2, 4] },
  { professorId: "marilia", professorName: "Marília", level: "Nível B", levelIndex: 4, brtHour: 18, court: "Quadra 3", totalSpots: 6, daysOfWeek: [2, 4] },
  { professorId: "pepe", professorName: "Pepe", level: "Nível B", levelIndex: 4, brtHour: 18, court: "Quadra 4", totalSpots: 6, daysOfWeek: [2, 4] },
  { professorId: "victor-hugo", professorName: "V.Hugo/Ariane/Malu", level: "Nível B", levelIndex: 4, brtHour: 18, court: "Quadra 5", totalSpots: 6, daysOfWeek: [2, 4] },
  { professorId: "victor-hugo", professorName: "V.Hugo/Ariane/Malu", level: "Nível B", levelIndex: 4, brtHour: 18, court: "Quadra 6", totalSpots: 6, daysOfWeek: [2, 4] },
  { professorId: "luiza-amelia", professorName: "Luiza Amélia", level: "Iniciante", levelIndex: 1, brtHour: 19, court: "Quadra 1", totalSpots: 12, daysOfWeek: [2, 4], description: "Turma de iniciantes com Luiza Amélia." },
  { professorId: "marilia", professorName: "Marília", level: "Nível B", levelIndex: 4, brtHour: 19, court: "Quadra 3", totalSpots: 6, daysOfWeek: [2, 4] },
  { professorId: "pepe", professorName: "Pepe", level: "Nível B", levelIndex: 4, brtHour: 19, court: "Quadra 4", totalSpots: 6, daysOfWeek: [2] }, // Só terça
  { professorId: "victor-hugo", professorName: "Victor Hugo", level: "Nível B", levelIndex: 4, brtHour: 19, court: "Quadra 6", totalSpots: 6, daysOfWeek: [2, 4] },
  { professorId: "paulo-lima", professorName: "Paulo Lima", level: "Nível B", levelIndex: 4, brtHour: 20, court: "Quadra 5", totalSpots: 6, daysOfWeek: [2, 4] },
  { professorId: "pepe", professorName: "Pepe", level: "Nível B", levelIndex: 4, brtHour: 20, court: "Quadra 6", totalSpots: 6, daysOfWeek: [2, 4] },

  // ── SEGUNDA E QUARTA ──
  { professorId: "biel", professorName: "Biel", level: "Nível C", levelIndex: 3, brtHour: 6, court: "Quadra 2", totalSpots: 6, daysOfWeek: [1, 3] },
  { professorId: "pepe", professorName: "Pepe", level: "Nível C", levelIndex: 3, brtHour: 7, court: "Quadra 1", totalSpots: 6, daysOfWeek: [1, 3] },
  { professorId: "biel", professorName: "Biel", level: "Nível C", levelIndex: 3, brtHour: 7, court: "Quadra 2", totalSpots: 6, daysOfWeek: [1, 3] },
  { professorId: "biel", professorName: "Biel", level: "Nível C", levelIndex: 3, brtHour: 8, court: "Quadra 2", totalSpots: 6, daysOfWeek: [1, 3] },
  { professorId: "biel", professorName: "Biel", level: "Nível C", levelIndex: 3, brtHour: 17, court: "Quadra 2", totalSpots: 6, daysOfWeek: [1, 3] },
  { professorId: "ariane", professorName: "Ariane", level: "Nível C", levelIndex: 3, brtHour: 17, court: "Quadra 4", totalSpots: 6, daysOfWeek: [1, 3] },
  { professorId: "pepe", professorName: "Pepe", level: "Nível D", levelIndex: 2, brtHour: 17, court: "Quadra 6", totalSpots: 6, daysOfWeek: [1, 3] },
  { professorId: "biel", professorName: "Biel", level: "Nível C", levelIndex: 3, brtHour: 18, court: "Quadra 2", totalSpots: 6, daysOfWeek: [1, 3] },
  { professorId: "leandro", professorName: "Leandro", level: "Nível D", levelIndex: 2, brtHour: 18, court: "Quadra 4", totalSpots: 6, daysOfWeek: [1, 3] },
  { professorId: "paulo-lima", professorName: "Paulo Lima", level: "Nível B", levelIndex: 4, brtHour: 18, court: "Quadra 5", totalSpots: 6, daysOfWeek: [1, 3] },
  { professorId: "pepe", professorName: "Pepe", level: "Nível B", levelIndex: 4, brtHour: 18, court: "Quadra 6", totalSpots: 6, daysOfWeek: [1, 3] },
  { professorId: "victor-hugo", professorName: "Victor Hugo e Israel", level: "Nível B", levelIndex: 4, brtHour: 19, court: "Quadra 1", totalSpots: 6, daysOfWeek: [1, 3] },
  { professorId: "biel", professorName: "Biel", level: "Nível C", levelIndex: 3, brtHour: 19, court: "Quadra 2", totalSpots: 6, daysOfWeek: [1, 3] },
  { professorId: "leandro", professorName: "Leandro", level: "Nível D", levelIndex: 2, brtHour: 19, court: "Quadra 4", totalSpots: 6, daysOfWeek: [1, 3] },
  { professorId: "paulo-lima", professorName: "Paulo Lima", level: "Nível B", levelIndex: 4, brtHour: 19, court: "Quadra 5", totalSpots: 6, daysOfWeek: [1, 3] },
  { professorId: "pepe", professorName: "Pepe", level: "Nível B", levelIndex: 4, brtHour: 19, court: "Quadra 6", totalSpots: 6, daysOfWeek: [1, 3] },
  { professorId: "biel", professorName: "Biel", level: "Nível C", levelIndex: 3, brtHour: 20, court: "Quadra 2", totalSpots: 6, daysOfWeek: [1, 3] },
]

// Prepara as aulas garantindo que os arrays de titulares e reservas comecem vazios
const FINAL_SCHEDULE = RAW_SCHEDULE.map(lesson => ({
  ...lesson,
  titularIds: [],
  reservaIds: []
}))

async function injectGrid() {
  console.log("⏳ Injetando o Molde de Aulas no Firestore...")
  
  await db.collection("configs").doc("lessonGrid").set({
    lessons: FINAL_SCHEDULE
  })

  console.log(`✅ Sucesso! Molde com ${FINAL_SCHEDULE.length} aulas gravado em configs/lessonGrid.`)
}

injectGrid().catch(console.error)