/**
 * Auth types mirroring Supabase Auth API shape.
 * When integrating Supabase, replace IAuthService implementation — callers stay unchanged.
 */

export interface AuthUser {
  id: string
  email: string
  user_metadata: {
    name: string
  }
  created_at: string
}

export interface AuthError {
  message: string
  status?: number
}

export interface AuthSession {
  user: AuthUser
  access_token: string
  expires_at: number
}

export interface AuthResponse {
  data: {
    user: AuthUser | null
    session: AuthSession | null
  }
  error: AuthError | null
}

export interface SignOutResponse {
  error: AuthError | null
}

export interface GetUserResponse {
  data: { user: AuthUser | null }
  error: AuthError | null
}

export interface IAuthService {
  signInWithPassword(params: {
    email: string
    password: string
  }): Promise<AuthResponse>

  signUp(params: {
    email: string
    password: string
    options?: { data?: { name: string } }
  }): Promise<AuthResponse>

  signOut(): Promise<SignOutResponse>

  getUser(): Promise<GetUserResponse>
}
