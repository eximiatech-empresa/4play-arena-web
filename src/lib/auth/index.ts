/**
 * Auth service entry point.
 *
 * To revert to mock during tests:
 *   import { mockAuth } from "./mock"
 *   export const authService = mockAuth
 */
import { firebaseAuthAdapter } from "./firebase"

export const authService = firebaseAuthAdapter

export type * from "./types"
