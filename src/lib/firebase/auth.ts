import { getAuth, onAuthStateChanged, type Auth, type User } from "firebase/auth"
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