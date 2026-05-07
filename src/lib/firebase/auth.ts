import {
  getAuth,
  onAuthStateChanged,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  type Auth,
  type User,
} from "firebase/auth"
import { firebaseApp } from "./app"

let _auth: Auth | undefined

export function getFirebaseAuth(): Auth {
  if (!_auth) _auth = getAuth(firebaseApp)
  return _auth
}

export function waitForAuthInit(): Promise<User | null> {
  const auth = getFirebaseAuth()
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe()
      resolve(user)
    })
  })
}

export async function updateUserPassword(
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const auth = getFirebaseAuth()
  const user = auth.currentUser
  if (!user || !user.email) throw new Error("Usuário não autenticado.")

  const credential = EmailAuthProvider.credential(user.email, currentPassword)

  try {
    await reauthenticateWithCredential(user, credential)
  } catch (err: unknown) {
    const code = (err as { code?: string }).code
    if (code === "auth/wrong-password" || code === "auth/invalid-credential") {
      throw new Error("Senha atual incorreta.")
    }
    throw new Error("Falha na reautenticação. Tente novamente.")
  }

  await updatePassword(user, newPassword)
}
