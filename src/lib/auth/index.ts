/**
 * Auth service entry point.
 *
 * To integrate Supabase, replace the mock import:
 *   import { createSupabaseAuth } from "./supabase"
 *   export const authService = createSupabaseAuth()
 *
 * All callers (hooks, components) use `authService` via this module,
 * so the swap requires changing only this file.
 */
import { mockAuth } from "./mock"

export const authService = mockAuth

export type * from "./types"
