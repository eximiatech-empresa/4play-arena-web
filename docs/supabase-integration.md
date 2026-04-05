# Guia de Integração — Supabase

Este guia descreve todos os passos para substituir o mock de dados pela integração real com o Supabase. A arquitetura foi planejada para que essa troca tenha o mínimo de fricção.

---

## 1. Pré-requisitos

1. Conta no [supabase.com](https://supabase.com) e projeto criado
2. Copie as chaves do projeto em **Settings → API**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (apenas para API routes server-side)

Crie `.env.local` na raiz:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 2. Clientes Supabase (`src/lib/supabase/`)

Crie os três clientes conforme o contexto de execução:

### `src/lib/supabase/client.ts` — Browser (Client Components)
```ts
import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### `src/lib/supabase/server.ts` — Server Components + API Routes
```ts
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}
```

### `src/lib/supabase/admin.ts` — Service Role (apenas server-side)
```ts
import { createClient } from "@supabase/supabase-js"

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)
```

---

## 3. Adapter de Auth (`src/lib/auth/supabase.ts`)

O `IAuthService` foi desenhado para espelhar a API do Supabase Auth. A troca é direta:

```ts
// src/lib/auth/supabase.ts
import { createClient } from "@/lib/supabase/client"
import type { IAuthService } from "./types"

export function createSupabaseAuth(): IAuthService {
  const supabase = createClient()
  // Supabase auth object satisfaz estruturalmente IAuthService
  return supabase.auth as unknown as IAuthService
}
```

Depois, em `src/lib/auth/index.ts`, substitua **uma linha**:

```ts
// ANTES (mock):
import { mockAuth } from "./mock"
export const authService = mockAuth

// DEPOIS (Supabase):
import { createSupabaseAuth } from "./supabase"
export const authService = createSupabaseAuth()
```

---

## 4. Schema do Banco de Dados

Execute no SQL Editor do Supabase Dashboard:

```sql
-- ===================================================
-- EXTENSIONS
-- ===================================================
create extension if not exists "uuid-ossp";

-- ===================================================
-- PROFILES (estende auth.users)
-- ===================================================
create table public.profiles (
  id          uuid references auth.users(id) on delete cascade primary key,
  name        text not null,
  level       text not null default 'Principiante'
    check (level in ('Principiante','Iniciante','Nível D','Nível C','Nível B','Nível A','Profissional')),
  created_at  timestamptz default now() not null
);

-- Auto-cria profile quando novo usuário se registra
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ===================================================
-- PROFESSORS
-- ===================================================
create table public.professors (
  id                      uuid primary key default gen_random_uuid(),
  name                    text not null unique,
  is_premium              boolean not null default false,
  consumption_mensal      numeric(4,2) not null,
  consumption_trimestral  numeric(4,2) not null,
  consumption_semestral   numeric(4,2) not null,
  created_at              timestamptz default now() not null
);

-- Seed com os professores reais
insert into public.professors (name, is_premium, consumption_mensal, consumption_trimestral, consumption_semestral) values
  ('Paulinho', false, 0.90, 0.85, 0.80),
  ('Biel',     false, 1.05, 1.00, 0.95),
  ('Pepe',     false, 1.10, 1.05, 1.00),
  ('Marília',  true,  1.50, 1.42, 1.35);

-- ===================================================
-- WALLETS
-- ===================================================
create table public.wallets (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid references public.profiles(id) on delete cascade not null unique,
  balance     numeric(6,2) not null default 0 check (balance >= 0),
  total_hours numeric(6,2) not null check (total_hours > 0),
  plan        text not null check (plan in ('mensal','trimestral','semestral')),
  plan_value  numeric(8,2) not null check (plan_value > 0),
  expires_at  date not null,
  created_at  timestamptz default now() not null
);

-- ===================================================
-- LESSONS
-- ===================================================
create table public.lessons (
  id           uuid primary key default gen_random_uuid(),
  professor_id uuid references public.professors(id) not null,
  level        text not null
    check (level in ('Principiante','Iniciante','Nível D','Nível C','Nível B','Nível A','Profissional')),
  date_time    timestamptz not null,
  court        text not null,
  total_spots  integer not null default 4 check (total_spots > 0),
  created_at   timestamptz default now() not null
);

-- ===================================================
-- ENROLLMENTS
-- ===================================================
create table public.enrollments (
  id              uuid primary key default gen_random_uuid(),
  student_id      uuid references public.profiles(id) on delete cascade not null,
  lesson_id       uuid references public.lessons(id) on delete cascade not null,
  checked_in      boolean not null default false,
  hours_consumed  numeric(4,2),
  checked_in_at   timestamptz,
  created_at      timestamptz default now() not null,
  unique(student_id, lesson_id)
);

-- ===================================================
-- TRANSACTIONS
-- ===================================================
create table public.transactions (
  id             uuid primary key default gen_random_uuid(),
  wallet_id      uuid references public.wallets(id) on delete cascade not null,
  enrollment_id  uuid references public.enrollments(id),
  type           text not null check (type in ('debit','credit','expiration','adjustment')),
  hours          numeric(6,2) not null,   -- negativo p/ débito
  balance_after  numeric(6,2) not null check (balance_after >= 0),
  created_at     timestamptz default now() not null
);
```

---

## 5. Row Level Security (RLS)

```sql
-- ===================================================
-- PROFILES
-- ===================================================
alter table public.profiles enable row level security;

create policy "Aluno vê apenas seu próprio perfil"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Aluno atualiza apenas seu próprio perfil"
  on public.profiles for update
  using (auth.uid() = id);

-- ===================================================
-- WALLETS
-- ===================================================
alter table public.wallets enable row level security;

create policy "Aluno vê apenas sua carteira"
  on public.wallets for select
  using (auth.uid() = student_id);

-- Apenas service_role pode debitar/creditar (via API routes)

-- ===================================================
-- PROFESSORS (leitura pública para autenticados)
-- ===================================================
alter table public.professors enable row level security;

create policy "Professores visíveis para autenticados"
  on public.professors for select
  using (auth.role() = 'authenticated');

-- ===================================================
-- LESSONS (leitura pública para autenticados)
-- ===================================================
alter table public.lessons enable row level security;

create policy "Aulas visíveis para autenticados"
  on public.lessons for select
  using (auth.role() = 'authenticated');

-- ===================================================
-- ENROLLMENTS
-- ===================================================
alter table public.enrollments enable row level security;

create policy "Aluno vê suas inscrições"
  on public.enrollments for select
  using (auth.uid() = student_id);

-- ===================================================
-- TRANSACTIONS
-- ===================================================
alter table public.transactions enable row level security;

create policy "Aluno vê suas transações"
  on public.transactions for select
  using (
    wallet_id in (
      select id from public.wallets where student_id = auth.uid()
    )
  );
```

---

## 6. API Route de Check-in (`src/app/api/checkin/route.ts`)

Esta rota é o coração do sistema. Use `supabaseAdmin` para bypassar o RLS e garantir atomicidade.

```ts
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { calculateConsumption, getCheckInStatus, isLevelEligible } from "@/core/math/consumption"
import type { Plan } from "@/core/entities/wallet"

const CheckInBodySchema = z.object({
  lessonId: z.string().uuid(),
})

export async function POST(req: NextRequest) {
  // 1. Parse + validate body (Fail-Fast)
  const body = await req.json().catch(() => null)
  const parsed = CheckInBodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 })
  }
  const { lessonId } = parsed.data

  // 2. Authenticate user
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  // 3. Fetch required data in parallel
  const [profileRes, walletRes, lessonRes, enrollmentRes] = await Promise.all([
    supabaseAdmin.from("profiles").select("level").eq("id", user.id).single(),
    supabaseAdmin.from("wallets").select("*").eq("student_id", user.id).single(),
    supabaseAdmin.from("lessons").select("*, professors(*)").eq("id", lessonId).single(),
    supabaseAdmin.from("enrollments").select("id").eq("student_id", user.id).eq("lesson_id", lessonId).maybeSingle(),
  ])

  if (profileRes.error || walletRes.error || lessonRes.error) {
    return NextResponse.json({ error: "Dados não encontrados" }, { status: 404 })
  }

  const profile = profileRes.data
  const wallet = walletRes.data
  const lesson = lessonRes.data
  const isEnrolled = !!enrollmentRes.data

  // 4. Business rules validation
  const levelHierarchy = ["Principiante","Iniciante","Nível D","Nível C","Nível B","Nível A","Profissional"]
  const studentLevelIndex = levelHierarchy.indexOf(profile.level)
  const classLevelIndex = levelHierarchy.indexOf(lesson.level)

  if (!isLevelEligible(studentLevelIndex, classLevelIndex)) {
    return NextResponse.json({ error: "Nível insuficiente para esta aula" }, { status: 403 })
  }

  const checkInStatus = getCheckInStatus(new Date(lesson.date_time), isEnrolled)
  if (checkInStatus === "not_open" || checkInStatus === "closed") {
    return NextResponse.json({ error: "Check-in não disponível no momento" }, { status: 403 })
  }

  // 5. Calculate consumption
  const consumption = calculateConsumption({
    professorId: lesson.professors.name.toLowerCase(),
    plan: wallet.plan as Plan,
    date: new Date(lesson.date_time),
  })

  if (wallet.balance < consumption) {
    return NextResponse.json({ error: "Saldo insuficiente" }, { status: 403 })
  }

  const newBalance = Math.round((wallet.balance - consumption) * 100) / 100

  // 6. Atomic write: upsert enrollment + update wallet + insert transaction
  const { error: txError } = await supabaseAdmin.rpc("process_checkin", {
    p_student_id: user.id,
    p_lesson_id: lessonId,
    p_wallet_id: wallet.id,
    p_hours_consumed: consumption,
    p_new_balance: newBalance,
  })

  if (txError) {
    return NextResponse.json({ error: "Erro ao processar check-in" }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    hoursConsumed: consumption,
    newBalance,
  })
}
```

### Função RPC `process_checkin` (SQL)

```sql
create or replace function public.process_checkin(
  p_student_id    uuid,
  p_lesson_id     uuid,
  p_wallet_id     uuid,
  p_hours_consumed numeric,
  p_new_balance   numeric
) returns void language plpgsql security definer as $$
declare
  v_enrollment_id uuid;
begin
  -- Upsert enrollment com checked_in = true
  insert into public.enrollments (student_id, lesson_id, checked_in, hours_consumed, checked_in_at)
  values (p_student_id, p_lesson_id, true, p_hours_consumed, now())
  on conflict (student_id, lesson_id)
  do update set checked_in = true, hours_consumed = p_hours_consumed, checked_in_at = now()
  returning id into v_enrollment_id;

  -- Debita wallet
  update public.wallets
  set balance = p_new_balance
  where id = p_wallet_id;

  -- Registra transação
  insert into public.transactions (wallet_id, enrollment_id, type, hours, balance_after)
  values (p_wallet_id, v_enrollment_id, 'debit', -p_hours_consumed, p_new_balance);
end;
$$;
```

---

## 7. Middleware de Proteção de Rotas

Crie `src/middleware.ts` na raiz do `src/`:

```ts
import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cs) => cs.forEach(({ name, value, options }) => response.cookies.set(name, value, options)),
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const isAuthRoute = request.nextUrl.pathname.startsWith("/login") ||
                      request.nextUrl.pathname.startsWith("/register")
  const isDashboardRoute = request.nextUrl.pathname.startsWith("/dashboard") ||
                           request.nextUrl.pathname.startsWith("/wallet") ||
                           request.nextUrl.pathname.startsWith("/profile")

  if (!user && isDashboardRoute) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
}
```

---

## 8. Checklist de Migração

- [ ] Criar projeto no Supabase
- [ ] Configurar `.env.local` com as chaves
- [ ] Criar `src/lib/supabase/client.ts`, `server.ts`, `admin.ts`
- [ ] Executar SQL de schema + seed de professores
- [ ] Executar SQL de RLS policies
- [ ] Criar `src/lib/auth/supabase.ts` adapter
- [ ] Atualizar `src/lib/auth/index.ts` (1 linha)
- [ ] Criar API route `POST /api/checkin`
- [ ] Criar função RPC `process_checkin` no Supabase
- [ ] Substituir `mock-data.ts` por hooks de data fetching (TanStack Query + Supabase)
- [ ] Criar `src/middleware.ts` para proteção de rotas
- [ ] Testar fluxo completo: registro → login → check-in → débito
