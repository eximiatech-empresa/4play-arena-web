"use server"

import { z } from "zod"
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin"

const InputSchema = z.object({
  idToken: z.string().min(10),
  name: z.string().min(2),
  email: z.string().email(),
  role: z.enum(["TEACHER", "ADMIN"]),
  password: z.string().min(6),
  lessonPrice: z.number().nonnegative().optional(),
})

export type CreateStaffUserInput = Omit<z.infer<typeof InputSchema>, "idToken"> & {
  idToken?: string
}

export async function createStaffUser(input: CreateStaffUserInput): Promise<void> {
  const parsed = InputSchema.safeParse(input)
  if (!parsed.success) throw new Error("Dados inválidos ou sessão ausente.")

  const { idToken, name, email, role, password, lessonPrice } = parsed.data

  const adminAuth = getAdminAuth()
  const adminDb = getAdminDb()

  // Verificação server-side obrigatória: apenas ADMIN autenticado pode criar Staff.
  let callerUid: string
  try {
    const decoded = await adminAuth.verifyIdToken(idToken)
    callerUid = decoded.uid
  } catch {
    throw new Error("Sessão expirada ou inválida. Faça login novamente.")
  }

  const callerSnap = await adminDb.collection("users").doc(callerUid).get()
  const callerRole = String(callerSnap.data()?.role ?? "").toUpperCase()
  if (callerRole !== "ADMIN") {
    throw new Error("Acesso negado: apenas administradores podem criar usuários da equipe.")
  }

  if (role === "TEACHER" && (lessonPrice === undefined || lessonPrice === null)) {
    throw new Error("Preço da aula é obrigatório para Professores.")
  }

  let uid: string
  try {
    const authUser = await adminAuth.createUser({ email, password, displayName: name })
    uid = authUser.uid
  } catch (err: unknown) {
    const code = (err as { code?: string }).code
    if (code === "auth/email-already-exists") throw new Error("Este e-mail já está em uso.")
    throw new Error("Erro ao criar usuário na autenticação.")
  }

  const baseDoc = {
    uid,
    name,
    email,
    role,
    isActive: true,
    mustChangePassword: true,
    createdAt: new Date().toISOString(),
  }

  const extraFields = role === "TEACHER"
    ? { lessonPrice: lessonPrice ?? 0, earningsBalance: 0 }
    : {}

  await adminDb.collection("users").doc(uid).set({ ...baseDoc, ...extraFields })

  if (role === "TEACHER") {
    await adminDb.collection("professors").doc(uid).set({
      name,
      email,
      role: "TEACHER",
      basePlays: lessonPrice ?? 10,
      sharePct: 0.6,
      roundingRule: "round",
      isActive: true,
      phone: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  }
}
