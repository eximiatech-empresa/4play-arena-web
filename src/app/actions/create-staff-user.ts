"use server"

import { z } from "zod"
import { adminAuth, adminDb } from "@/lib/firebase-admin"

const InputSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  role: z.enum(["TEACHER", "ADMIN"]),
  password: z.string().min(6),
})

export type CreateStaffUserInput = z.infer<typeof InputSchema>

export async function createStaffUser(input: CreateStaffUserInput): Promise<void> {
  const parsed = InputSchema.safeParse(input)
  if (!parsed.success) throw new Error("Dados inválidos.")

  const { name, email, role, password } = parsed.data

  let uid: string
  try {
    const authUser = await adminAuth.createUser({ email, password, displayName: name })
    uid = authUser.uid
  } catch (err: unknown) {
    const code = (err as { code?: string }).code
    if (code === "auth/email-already-exists") throw new Error("Este e-mail já está em uso.")
    throw new Error("Erro ao criar usuário na autenticação.")
  }

  await adminDb.collection("users").doc(uid).set({
    uid,
    name,
    email,
    role,
    isActive: true,
    mustChangePassword: true,
    createdAt: new Date().toISOString(),
  })
}
