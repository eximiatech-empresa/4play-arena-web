import * as admin from "firebase-admin"
import { readFileSync } from "fs"

// 1. Configuração do Admin
const filePath = "C:\\Users\\Guilherme\\Dev\\Trabalho\\Web\\4play-arena\\scripts\\serviceAccount.json" 
const serviceAccount = JSON.parse(readFileSync(filePath, "utf-8"))

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
}
const db = admin.firestore()

async function createTestLesson() {
  // O seu UID real de professor
  const professorUid = "8wRPQFZwLOe5bbJRM1suc6StbMV2"
  
  // Criar a aula para daqui a 2 horas exatas
  const lessonDate = new Date()
  lessonDate.setHours(lessonDate.getHours() + 2) 

  const iso = lessonDate.toISOString()
  const id = `test_lesson_${Date.now()}`

  const testLesson = {
    id,
    professorId: professorUid,
    professorName: "Gui Professor", // Seu nome cadastrado
    level: "Principiante",
    levelIndex: 1,
    dateTime: iso,
    court: "Quadra VIP",
    totalSpots: 6,
    // Coloquei 2 alunos de mentira para você poder testar a lista de presença!
    enrolledStudentIds: [], 
    checkedInStudentIds: [],
    titularIds: [],
    reservaIds: [],
    status: "scheduled"
  }

  await db.collection("lessons").doc(id).set(testLesson)
  
  console.log(`✅ Aula de teste criada com sucesso!`)
  console.log(`⏰ Horário da aula: ${lessonDate.toLocaleString('pt-BR')}`)
  console.log(`👨‍🏫 Professor: Gui Professor`)
}

createTestLesson().catch(console.error)