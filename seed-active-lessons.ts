import * as admin from "firebase-admin"
import { readFileSync } from "fs"

// 1. Configuração do Admin (Use a sua chave)
const filePath = "C:\\Users\\Guilherme\\Dev\\Trabalho\\Web\\4play-arena\\scripts\\serviceAccount.json" 
const serviceAccount = JSON.parse(readFileSync(filePath, "utf-8"))

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
}
const db = admin.firestore()

async function generateActiveLessons() {
  console.log("⏳ Lendo o molde de configs/lessonGrid...")
  
  // 2. Busca o molde que você criou no Firebase
  const gridDoc = await db.collection("configs").doc("lessonGrid").get()
  type TemplateLesson = {
    daysOfWeek: number[]
    brtHour: number
    court: string
    [key: string]: unknown
  }
  const template = gridDoc.data()?.lessons as TemplateLesson[]

  if (!template) {
    console.error("❌ Molde não encontrado em configs/lessonGrid!")
    return
  }

  const batch = db.batch()
  const today = new Date()
  
  // 3. Vamos gerar as aulas para os próximos 3 dias para você testar
  console.log("🚀 Gerando aulas reais na coleção /lessons...")

  for (let i = 0; i < 3; i++) {
    const targetDate = new Date()
    targetDate.setDate(today.getDate() + i)
    
    // Dia da semana (0 = Domingo, 1 = Segunda, etc.)
    const dayOfWeek = targetDate.getDay() 

    template.forEach((tpl) => {
      // Se a aula do molde acontece nesse dia da semana
      if (tpl.daysOfWeek.includes(dayOfWeek)) {
        // Monta a data ISO correta
        const lessonDate = new Date(targetDate)
        lessonDate.setHours(tpl.brtHour + 3, 0, 0, 0) // Ajuste UTC básico
        
        const iso = lessonDate.toISOString()
        const id = `${iso.split('T')[0]}_${tpl.court.replace(/\s+/g, '-')}_${tpl.brtHour}h`

        const lessonRef = db.collection("lessons").doc(id)
        
        batch.set(lessonRef, {
          ...tpl,
          id,
          dateTime: iso,
          status: "scheduled",
          enrolledStudentIds: [],
          checkedInStudentIds: [],
        }, { merge: true })
      }
    })
  }

  await batch.commit()
  console.log("✅ Sucesso! Agora vá ao app e olhe os próximos 3 dias.")
}

generateActiveLessons().catch(console.error)