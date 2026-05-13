"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  User, Mail, Phone, Lock, ShieldCheck, CalendarDays,
  TrendingDown, CheckCircle2, Eye, EyeOff, ChevronRight, Loader2,
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { STUDENT_LEVELS } from "@/core/constants/professors"
import { usePlans } from "@/features/wallet/hooks/use-plans"
import type { PlanConfig } from "@/core/constants/plan-pricing"
import { useCurrentUser } from "@/hooks/use-current-user"
import { useWallet } from "@/features/wallet/hooks/use-wallet"
import { useUpdateProfile } from "@/features/profile/hooks/use-update-profile"
import { useChangePassword } from "@/features/profile/hooks/use-change-password"
import { parsePlanExpiresAt, getDaysLeft } from "@/core/services/expiration-service"
import { formatStudentLevel } from "@/core/math/lesson-eligibility"
import { LevelBadge } from "@/components/shared/level-badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import type { User as UserType } from "@/core/entities/user"
import type { Wallet } from "@/core/entities/wallet"

// ─── Schemas ──────────────────────────────────────────────────────────────────

const ProfileFormSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  phone: z.string().optional(),
})
type ProfileFormData = z.infer<typeof ProfileFormSchema>

const PasswordFormSchema = z
  .object({
    currentPassword: z.string().min(1, "Informe a senha atual"),
    newPassword: z.string().min(6, "Mínimo 6 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  })
type PasswordFormData = z.infer<typeof PasswordFormSchema>

// ─── Page ─────────────────────────────────────────────────────────────────────

export function ProfilePageContent() {
  const { data: currentUser, isLoading } = useCurrentUser()
  const { data: wallet } = useWallet()
  const { data: plans } = usePlans()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-6 h-6 animate-spin text-brand" />
      </div>
    )
  }

  if (!currentUser) return null

  const initials = currentUser.name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")

  const memberSince = new Date(currentUser.createdAt).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  })

  const totalPlaysConsumed = wallet?.transactions
    ?.filter((t) => t.type === "debit")
    .reduce((sum, t) => sum + Math.abs(t.amount), 0) ?? 0

  const totalClassesTaken = new Set(
    wallet?.transactions
      ?.filter((t) => t.type === "debit" && t.lessonId)
      .map((t) => t.lessonId),
  ).size ?? 0

  const plan = currentUser.role === "STUDENT"
    ? plans?.find((p) => p.id === currentUser.currentPlanId)
    : null

  return (
    <div className="p-4 lg:p-6 pb-24 lg:pb-6 max-w-2xl mx-auto space-y-5">
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
          <p className="text-lg font-bold text-zinc-900 truncate">{currentUser.name}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {currentUser.role === "STUDENT" && (
              <LevelBadge level={currentUser.level} size="sm" />
            )}
            <span className="text-xs text-zinc-400">Membro desde {memberSince}</span>
          </div>
        </div>
      </div>

      {/* Stats row — students only */}
      {currentUser.role === "STUDENT" && plan && (
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            icon={<ShieldCheck className="w-4 h-4 text-brand" />}
            label="Plano"
            value={plan.label}
          />
          <StatCard
            icon={<CheckCircle2 className="w-4 h-4 text-zinc-400" />}
            label="Aulas"
            value={String(totalClassesTaken)}
          />
          <StatCard
            icon={<TrendingDown className="w-4 h-4 text-zinc-400" />}
            label="Plays"
            value={`${totalPlaysConsumed.toFixed(1)}`}
          />
        </div>
      )}

      <PersonalDataSection user={currentUser} />

      {currentUser.role === "STUDENT" && (() => {
        const { formattedCurrentLevel, studentLevelIndex } = formatStudentLevel(currentUser.level)
        return (
          <LevelSection
            currentLevel={formattedCurrentLevel}
            levelIndex={studentLevelIndex}
          />
        )
      })()}

      {currentUser.role === "STUDENT" && wallet && plan && (
        <PlanSection wallet={wallet} plan={plan} />
      )}

      {currentUser.role !== "STUDENT" && (
        <StaffInfoSection role={currentUser.role} />
      )}

      <SecuritySection />
    </div>
  )
}

// ─── Dados pessoais ───────────────────────────────────────────────────────────

function PersonalDataSection({ user }: { user: UserType }) {
  const { mutate: updateProfile, isPending } = useUpdateProfile()

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(ProfileFormSchema),
    defaultValues: { name: "", phone: "" },
  })

  useEffect(() => {
    form.reset({ name: user.name, phone: user.phone ?? "" })
  }, [user.uid, user.name, user.phone, form])

  function onSubmit(data: ProfileFormData) {
    const toastId = toast.loading("Salvando...")
    updateProfile(
      { name: data.name, phone: data.phone || undefined },
      {
        onSuccess: () => toast.success("Dados atualizados com sucesso!", { id: toastId }),
        onError: (err) =>
          toast.error(err instanceof Error ? err.message : "Erro ao salvar.", { id: toastId }),
      },
    )
  }

  const { errors } = form.formState

  return (
    <Section title="Dados pessoais" icon={<User className="w-4 h-4" />}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Field label="Nome completo" icon={<User className="w-3.5 h-3.5" />}>
          <Input
            {...form.register("name")}
            className="h-10 focus-visible:ring-brand/40 focus-visible:border-brand"
          />
          {errors.name && <p className="text-[11px] text-destructive mt-1">{errors.name.message}</p>}
        </Field>

        <Field label="E-mail" icon={<Mail className="w-3.5 h-3.5" />}>
          <Input
            value={user.email}
            disabled
            className="h-10 bg-zinc-50 text-zinc-400 cursor-not-allowed"
          />
          <p className="text-[11px] text-zinc-400 mt-1">
            O e-mail não pode ser alterado. Entre em contato com a academia.
          </p>
        </Field>

        <Field label="Telefone" icon={<Phone className="w-3.5 h-3.5" />}>
          <Input
            {...form.register("phone")}
            placeholder="(11) 99999-0000"
            className="h-10 focus-visible:ring-brand/40 focus-visible:border-brand"
          />
        </Field>

        <div className="pt-1">
          <Button
            type="submit"
            disabled={isPending}
            className="h-9 px-5 text-sm font-semibold bg-brand hover:bg-brand-dark text-white transition-all"
          >
            {isPending ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />Salvando...</>
            ) : "Salvar alterações"}
          </Button>
        </div>
      </form>
    </Section>
  )
}

// ─── Nível ────────────────────────────────────────────────────────────────────

function LevelSection({ currentLevel, levelIndex }: { currentLevel: string; levelIndex: number }) {
  return (
    <Section title="Nível de jogo" icon={<ShieldCheck className="w-4 h-4" />}>
      <div className="space-y-1.5">
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
                    : "text-zinc-300",
              )}
            >
              <div
                className={cn(
                  "w-2 h-2 rounded-full shrink-0",
                  isCurrent ? "bg-brand" : isUnlocked ? "bg-zinc-300" : "bg-zinc-200",
                )}
              />
              <span className={cn("font-medium", isCurrent && "text-brand-dark font-semibold")}>
                {lvl}
              </span>
              {isCurrent && <LevelBadge level={lvl} size="xs" className="ml-auto" />}
              {!isUnlocked && (
                <span className="ml-auto text-[10px] text-zinc-300">Bloqueado</span>
              )}
            </div>
          )
        })}
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
  wallet: Wallet
  plan: PlanConfig | undefined
}) {
  const expiresAtDate = parsePlanExpiresAt(wallet.expiresAt)
  const { daysLeft, isExpired } = getDaysLeft(expiresAtDate)

  const expiryBadge = isExpired
    ? { label: "Expirado", className: "bg-red-100 text-red-600 border-red-200" }
    : daysLeft <= 7
      ? { label: `Expira em ${daysLeft} dias`, className: "bg-amber-100 text-amber-700 border-amber-200" }
      : { label: "Ativo", className: "bg-green-100 text-green-700 border-green-200" }

  const formattedExpiry = expiresAtDate
    ? expiresAtDate.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" })
    : "—"

  return (
    <Section title="Plano ativo" icon={<CalendarDays className="w-4 h-4" />}>
      <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-bold text-zinc-800">{plan?.label ?? "—"}</p>
            <span
              className={cn(
                "text-[10px] font-semibold px-2 py-0.5 rounded-full border",
                expiryBadge.className,
              )}
            >
              {expiryBadge.label}
            </span>
          </div>
          <p className="text-xs text-zinc-500">
            {plan ? `${plan.totalPlays} Plays · R$ ${(plan.priceInCents / 100).toLocaleString("pt-BR")} / ${plan.validityDays} dias` : "—"}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-zinc-400">Vence em</p>
          <p className="text-xs font-semibold text-zinc-600">{formattedExpiry}</p>
        </div>
      </div>
      <Link
        href="/carteira"
        className="mt-3 w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-zinc-100 hover:bg-zinc-50 transition-colors text-sm text-zinc-600 font-medium"
      >
        <span>Ver carteira de horas</span>
        <ChevronRight className="w-4 h-4 text-zinc-400" />
      </Link>
    </Section>
  )
}

// ─── Segurança ────────────────────────────────────────────────────────────────

function SecuritySection() {
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const { mutate: changePassword, isPending } = useChangePassword()

  const form = useForm<PasswordFormData>({
    resolver: zodResolver(PasswordFormSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  })

  function onSubmit(data: PasswordFormData) {
    const toastId = toast.loading("Alterando senha...")
    changePassword(
      { currentPassword: data.currentPassword, newPassword: data.newPassword },
      {
        onSuccess: () => {
          toast.success("Senha alterada com sucesso!", { id: toastId })
          form.reset()
        },
        onError: (err) =>
          toast.error(err instanceof Error ? err.message : "Erro ao alterar senha.", { id: toastId }),
      },
    )
  }

  const { errors } = form.formState

  return (
    <Section title="Segurança" icon={<Lock className="w-4 h-4" />}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Field label="Senha atual" icon={<Lock className="w-3.5 h-3.5" />}>
          <div className="relative">
            <Input
              type={showCurrent ? "text" : "password"}
              placeholder="••••••••"
              className="h-10 pr-10 focus-visible:ring-brand/40 focus-visible:border-brand"
              {...form.register("currentPassword")}
            />
            <button
              type="button"
              onClick={() => setShowCurrent((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
            >
              {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.currentPassword && (
            <p className="text-[11px] text-destructive mt-1">{errors.currentPassword.message}</p>
          )}
        </Field>

        <Field label="Nova senha" icon={<Lock className="w-3.5 h-3.5" />}>
          <div className="relative">
            <Input
              type={showNew ? "text" : "password"}
              placeholder="Mínimo 6 caracteres"
              className="h-10 pr-10 focus-visible:ring-brand/40 focus-visible:border-brand"
              {...form.register("newPassword")}
            />
            <button
              type="button"
              onClick={() => setShowNew((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
            >
              {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.newPassword && (
            <p className="text-[11px] text-destructive mt-1">{errors.newPassword.message}</p>
          )}
        </Field>

        <Field label="Confirmar nova senha" icon={<Lock className="w-3.5 h-3.5" />}>
          <div className="relative">
            <Input
              type={showConfirm ? "text" : "password"}
              placeholder="••••••••"
              className="h-10 pr-10 focus-visible:ring-brand/40 focus-visible:border-brand"
              {...form.register("confirmPassword")}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
            >
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-[11px] text-destructive mt-1">{errors.confirmPassword.message}</p>
          )}
        </Field>

        <div className="pt-1">
          <Button
            type="submit"
            disabled={isPending}
            className="h-9 px-5 text-sm font-semibold bg-brand hover:bg-brand-dark text-white disabled:opacity-40 transition-all"
          >
            {isPending ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />Alterando...</>
            ) : "Alterar senha"}
          </Button>
        </div>
      </form>
    </Section>
  )
}

// ─── Staff info ───────────────────────────────────────────────────────────────

function StaffInfoSection({ role }: { role: "ADMIN" | "TEACHER" }) {
  const roleLabel = role === "ADMIN" ? "Administrador" : "Professor"

  return (
    <Section title="Nível e plano" icon={<ShieldCheck className="w-4 h-4" />}>
      <div className="flex flex-col items-center py-4 gap-2 text-center">
        <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center">
          <ShieldCheck className="w-5 h-5 text-zinc-400" />
        </div>
        <p className="text-sm font-semibold text-zinc-700">{roleLabel}</p>
        <p className="text-xs text-zinc-400 max-w-xs leading-relaxed">
          As seções de nível de jogo e plano de horas são exclusivas para alunos cadastrados.
        </p>
      </div>
    </Section>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
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

function Field({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
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

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl border border-zinc-100 shadow-sm p-3 text-center">
      <div className="flex justify-center mb-1.5">{icon}</div>
      <p className="text-base font-bold text-zinc-800 tabular-nums">{value}</p>
      <p className="text-[11px] text-zinc-400 mt-0.5">{label}</p>
    </div>
  )
}
