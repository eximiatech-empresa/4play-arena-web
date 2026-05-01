import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut as firebaseSignOut,
  type User as FirebaseUser,
} from "firebase/auth"
import { getFirebaseAuth } from "@/lib/firebase/auth"
import type {
  IAuthService,
  AuthUser,
  AuthResponse,
  SignOutResponse,
  GetUserResponse,
} from "./types"

function toAuthUser(user: FirebaseUser): AuthUser {
  return {
    id: user.uid,
    email: user.email ?? "",
    user_metadata: { name: user.displayName ?? "" },
    created_at: user.metadata?.creationTime ?? "",
  }
}

export const firebaseAuthAdapter: IAuthService = {
  async signInWithPassword({ email, password }): Promise<AuthResponse> {
    try {
      const auth = getFirebaseAuth()
      const credential = await signInWithEmailAndPassword(auth, email, password)
      return { data: { user: toAuthUser(credential.user), session: null }, error: null }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Falha no login"
      return { data: { user: null, session: null }, error: { message: msg } }
    }
  },

  async signUp({ email, password, options }): Promise<AuthResponse> {
    try {
      const auth = getFirebaseAuth()
      const credential = await createUserWithEmailAndPassword(auth, email, password)
      if (options?.data?.name) {
        await updateProfile(credential.user, { displayName: options.data.name })
      }
      return { data: { user: toAuthUser(credential.user), session: null }, error: null }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Falha no cadastro"
      return { data: { user: null, session: null }, error: { message: msg } }
    }
  },

  async signOut(): Promise<SignOutResponse> {
    try {
      await firebaseSignOut(getFirebaseAuth())
      return { error: null }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Falha ao sair"
      return { error: { message: msg } }
    }
  },

  async getUser(): Promise<GetUserResponse> {
    const { waitForAuthInit } = await import("@/lib/firebase/auth")

    const user = await waitForAuthInit()

    if (!user) return { data: { user: null }, error: null }
    return { data: { user: toAuthUser(user) }, error: null }
  },
}
