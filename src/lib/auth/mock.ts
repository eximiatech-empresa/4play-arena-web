import type {
  AuthResponse,
  AuthUser,
  AuthSession,
  GetUserResponse,
  IAuthService,
  SignOutResponse,
} from "./types"

const delay = (ms = 450) => new Promise<void>((resolve) => setTimeout(resolve, ms))

// Seed user for development — email: aluno@4playarena.com / senha: senha123
const MOCK_USERS: Array<AuthUser & { password: string }> = [
  {
    id: "mock-user-1",
    email: "aluno@4playarena.com",
    password: "senha123",
    user_metadata: { name: "Carlos Silva" },
    created_at: new Date().toISOString(),
  },
]

function createSession(user: AuthUser): AuthSession {
  return {
    user,
    access_token: `mock-token-${user.id}-${Date.now()}`,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
  }
}

// Module-level session — persists during the JS runtime (single tab, no hard refresh).
// Supabase swap: replace with cookie-based session management via @supabase/ssr.
let _currentUser: AuthUser | null = null

export const mockAuth: IAuthService = {
  async signInWithPassword({ email, password }) {
    await delay()

    const found = MOCK_USERS.find(
      (u) => u.email === email && u.password === password
    )

    if (!found) {
      return {
        data: { user: null, session: null },
        error: { message: "E-mail ou senha inválidos.", status: 400 },
      }
    }

    const { password: _pw, ...user } = found
    _currentUser = user

    return {
      data: { user, session: createSession(user) },
      error: null,
    }
  },

  async signUp({ email, password, options }) {
    await delay()

    const exists = MOCK_USERS.some((u) => u.email === email)
    if (exists) {
      return {
        data: { user: null, session: null },
        error: { message: "Este e-mail já está em uso.", status: 422 },
      }
    }

    const newUser: AuthUser & { password: string } = {
      id: `mock-user-${Date.now()}`,
      email,
      password,
      user_metadata: { name: options?.data?.name ?? "" },
      created_at: new Date().toISOString(),
    }

    MOCK_USERS.push(newUser)

    const { password: _pw, ...user } = newUser
    _currentUser = user

    return {
      data: { user, session: createSession(user) },
      error: null,
    }
  },

  async signOut(): Promise<SignOutResponse> {
    await delay(200)
    _currentUser = null
    return { error: null }
  },

  async getUser(): Promise<GetUserResponse> {
    await delay(100)
    return { data: { user: _currentUser }, error: null }
  },
}
