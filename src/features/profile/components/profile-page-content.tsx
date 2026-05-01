"use client"

import { useState } from "react"
import {
  User,
  Mail,
  Phone,
  Lock,
  ShieldCheck,
  CalendarDays,
  TrendingDown,
  CheckCircle2,
  Eye,
  EyeOff,
  ChevronRight,
} from "lucide-react"
import { MOCK_STUDENT } from "@/features/profile/mock-data"
import { MOCK_WALLET } from "@/features/wallet/mock-data"
import { PLANS, STUDENT_LEVELS } from "@/core/constants/professors"
import { LevelBadge } from "@/components/shared/level-badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export function ProfilePageContent() {
  const student = MOCK_STUDENT
  const wallet = MOCK_WALLET
  const plan = PLANS[wallet.plan]

  const initials = student.name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")

  const memberSince = new Date(student.memberSince).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  })

  return (
    <div className="p-4 lg:p-6 pb-24 lg:pb-6 max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <User className="w-5 h-5 text-brand" />
        <h1 className="text-xl font-bold text-zinc-800">Perfil</h1>
      </div>

      {/* Avatar card */}
      <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-5 flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-brand-dark flex items-center justify-center shrink-0">
          <span className="text-xl font-bold text-white">{initials}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-lg font-bold text-zinc-900 truncate">{student.name}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <LevelBadge level={student.level} size="sm" />
            <span className="text-xs text-zinc-400">Membro desde {memberSince}</span>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          icon={<ShieldCheck className="w-4 h-4 text-brand" />}
          label="Plano"
          value={plan.label}
        />
        <StatCard
          icon={<CheckCircle2 className="w-4 h-4 text-zinc-400" />}
          label="Aulas"
          value={String(student.totalClassesTaken)}
        />
        <StatCard
          icon={<TrendingDown className="w-4 h-4 text-zinc-400" />}
          label="Plays"
          value={`${student.totalPlaysConsumed} Plays`}
        />
      </div>

      {/* Dados pessoais */}
      <PersonalDataSection student={student} />

      {/* Nível */}
      <LevelSection currentLevel={student.level} levelIndex={student.levelIndex} />

      {/* Plano ativo */}
      <PlanSection wallet={wallet} plan={plan} />

      {/* Segurança */}
      <SecuritySection />
    </div>
  )
}

// ─── Dados pessoais ────────────────────────────────────────────────────────────

function PersonalDataSection({ student }: { student: typeof MOCK_STUDENT }) {
  const [name, setName] = useState(student.name)
  const [phone, setPhone] = useState(student.phone)
  const [saved, setSaved] = useState(false)

  function handleSave() {
    // TODO (Supabase): PATCH /api/profile with { name, phone }
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <Section title="Dados pessoais" icon={<User className="w-4 h-4" />}>
      <div className="space-y-4">
        <Field label="Nome completo" icon={<User className="w-3.5 h-3.5" />}>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-10 focus-visible:ring-brand/40 focus-visible:border-brand"
          />
        </Field>

        <Field label="E-mail" icon={<Mail className="w-3.5 h-3.5" />}>
          <Input
            value={student.email}
            disabled
            className="h-10 bg-zinc-50 text-zinc-400 cursor-not-allowed"
          />
          <p className="text-[11px] text-zinc-400 mt-1">
            O e-mail não pode ser alterado diretamente. Entre em contato com a academia.
          </p>
        </Field>

        <Field label="Telefone" icon={<Phone className="w-3.5 h-3.5" />}>
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(11) 99999-0000"
            className="h-10 focus-visible:ring-brand/40 focus-visible:border-brand"
          />
        </Field>

        <div className="pt-1">
          <Button
            onClick={handleSave}
            className={cn(
              "h-9 px-5 text-sm font-semibold transition-all",
              saved
                ? "bg-brand-subtle text-brand-dark border border-brand/30"
                : "bg-brand hover:bg-brand-dark text-white"
            )}
          >
            {saved ? (
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Salvo
              </span>
            ) : "Salvar alterações"}
          </Button>
        </div>
      </div>
    </Section>
  )
}

// ─── Nível ────────────────────────────────────────────────────────────────────

function LevelSection({
  currentLevel,
  levelIndex,
}: {
  currentLevel: string
  levelIndex: number
}) {
  return (
    <Section title="Nível de jogo" icon={<ShieldCheck className="w-4 h-4" />}>
      <div className="flex items-start gap-4">
        <div className="flex-1 space-y-1.5">
          {STUDENT_LEVELS.slice().reverse().map((lvl) => {
            const idx = STUDENT_LEVELS.indexOf(lvl)
            const isCurrent = lvl === currentLevel
            const isUnlocked = idx <= levelIndex

            return (
              <div
                key={lvl}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-colors",
                  isCurrent
                    ? "bg-brand-subtle border border-brand/20"
                    : isUnlocked
                    ? "bg-zinc-50 text-zinc-500"
                    : "text-zinc-300"
                )}
              >
                <div
                  className={cn(
                    "w-2 h-2 rounded-full shrink-0",
                    isCurrent ? "bg-brand" : isUnlocked ? "bg-zinc-300" : "bg-zinc-200"
                  )}
                />
                <span className={cn("font-medium", isCurrent && "text-brand-dark font-semibold")}>
                  {lvl}
                </span>
                {isCurrent && (
                  <LevelBadge level={lvl} size="xs" className="ml-auto" />
                )}
                {!isUnlocked && (
                  <span className="ml-auto text-[10px] text-zinc-300">Bloqueado</span>
                )}
              </div>
            )
          })}
        </div>
      </div>
      <p className="text-xs text-zinc-400 mt-3 leading-relaxed">
        Seu nível é definido pelo instrutor com base na sua evolução. Para solicitar uma reavaliação, fale com a recepção da academia.
      </p>
    </Section>
  )
}

// ─── Plano ────────────────────────────────────────────────────────────────────

function PlanSection({
  wallet,
  plan,
}: {
  wallet: typeof MOCK_WALLET
  plan: (typeof PLANS)[keyof typeof PLANS]
}) {
  const expiresAt = new Date(wallet.expiresAt)
  const today = new Date()
  const daysLeft = Math.ceil(
    (expiresAt.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  )

  return (
    <Section title="Plano ativo" icon={<CalendarDays className="w-4 h-4" />}>
      <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-xl">
        <div>
          <p className="text-sm font-bold text-zinc-800">{plan.label}</p>
          <p className="text-xs text-zinc-500 mt-0.5">
            {plan.hours}h · R$ {plan.price.toLocaleString("pt-BR")} /{" "}
            {plan.days} dias
          </p>
        </div>
        <div className="text-right">
          <p className={cn("text-sm font-semibold", daysLeft <= 7 ? "text-red-500" : "text-zinc-600")}>
            {daysLeft} dias restantes
          </p>
          <p className="text-xs text-zinc-400">
            Vence em{" "}
            {expiresAt.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
          </p>
        </div>
      </div>
      <button className="mt-3 w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-zinc-100 hover:bg-zinc-50 transition-colors text-sm text-zinc-600 font-medium">
        <span>Ver carteira de horas</span>
        <ChevronRight className="w-4 h-4 text-zinc-400" />
      </button>
    </Section>
  )
}

// ─── Segurança ────────────────────────────────────────────────────────────────

function SecuritySection() {
  const [current, setCurrent] = useState("")
  const [next, setNext] = useState("")
  const [confirm, setConfirm] = useState("")
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNext, setShowNext] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")

  function handleSave() {
    setError("")
    if (next.length < 6) {
      setError("A nova senha deve ter no mínimo 6 caracteres.")
      return
    }
    if (next !== confirm) {
      setError("As senhas não coincidem.")
      return
    }
    // TODO (Supabase): supabase.auth.updateUser({ password: next })
    setSaved(true)
    setCurrent("")
    setNext("")
    setConfirm("")
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <Section title="Segurança" icon={<Lock className="w-4 h-4" />}>
      <div className="space-y-4">
        <Field label="Senha atual" icon={<Lock className="w-3.5 h-3.5" />}>
          <div className="relative">
            <Input
              type={showCurrent ? "text" : "password"}
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              placeholder="••••••••"
              className="h-10 pr-10 focus-visible:ring-brand/40 focus-visible:border-brand"
            />
            <button
              type="button"
              onClick={() => setShowCurrent((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
            >
              {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </Field>

        <Field label="Nova senha" icon={<Lock className="w-3.5 h-3.5" />}>
          <div className="relative">
            <Input
              type={showNext ? "text" : "password"}
              value={next}
              onChange={(e) => setNext(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className="h-10 pr-10 focus-visible:ring-brand/40 focus-visible:border-brand"
            />
            <button
              type="button"
              onClick={() => setShowNext((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
            >
              {showNext ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </Field>

        <Field label="Confirmar nova senha" icon={<Lock className="w-3.5 h-3.5" />}>
          <Input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="••••••••"
            className="h-10 focus-visible:ring-brand/40 focus-visible:border-brand"
          />
        </Field>

        {error && (
          <p className="text-xs text-red-500 font-medium">{error}</p>
        )}

        <div className="pt-1">
          <Button
            onClick={handleSave}
            disabled={!current || !next || !confirm}
            className={cn(
              "h-9 px-5 text-sm font-semibold transition-all",
              saved
                ? "bg-brand-subtle text-brand-dark border border-brand/30"
                : "bg-brand hover:bg-brand-dark text-white disabled:opacity-40"
            )}
          >
            {saved ? (
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Senha alterada
              </span>
            ) : "Alterar senha"}
          </Button>
        </div>
      </div>
    </Section>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Section({
  title,
  icon,
  children,
}: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-zinc-50">
        <span className="text-zinc-400">{icon}</span>
        <h2 className="text-sm font-semibold text-zinc-700">{title}</h2>
      </div>
      {children}
    </div>
  )
}

function Field({
  label,
  icon,
  children,
}: {
  label: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label className="flex items-center gap-1.5 text-zinc-600 text-xs font-medium">
        <span className="text-zinc-400">{icon}</span>
        {label}
      </Label>
      {children}
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="bg-white rounded-xl border border-zinc-100 shadow-sm p-3 text-center">
      <div className="flex justify-center mb-1.5">{icon}</div>
      <p className="text-base font-bold text-zinc-800 tabular-nums">{value}</p>
      <p className="text-[11px] text-zinc-400 mt-0.5">{label}</p>
    </div>
  )
}
