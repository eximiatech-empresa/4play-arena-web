"use client"

import { useState } from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, EyeOff, Loader2, Check, User, CalendarDays, BookUser } from "lucide-react"
import { cn } from "@/lib/utils"

import { RegisterSchema, type RegisterInput, type OnboardingStep2Input, type OnboardingStep3Input } from "@/core/entities/auth"
import { authService } from "@/lib/auth"
import { useOnboarding } from "../hooks/use-onboarding"
import { useTeachers } from "../hooks/use-teachers"
import { usePlans } from "@/features/shared/planos-data/hooks/use-plans"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AuthBrandPanel } from "@/components/shared/auth-brand-panel"
import { MobileLogo } from "./mobile-logo"
import type { StudentPlan } from "@/core/entities/user"

// ─── Step indicator ────────────────────────────────────────────────────────────

const STEPS = [
  { icon: User,         label: "Conta" },
  { icon: CalendarDays, label: "Plano" },
  { icon: BookUser,     label: "Professor" },
]

function StepIndicator({ current }: { current: 1 | 2 | 3 }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {STEPS.map((s, i) => {
        const stepNum = i + 1
        const isDone = stepNum < current
        const isActive = stepNum === current
        const Icon = s.icon
        return (
          <div key={i} className="flex items-center gap-2">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold transition-all",
              isDone  && "bg-brand text-brand-foreground",
              isActive && "bg-brand-dark text-white ring-4 ring-brand/20",
              !isDone && !isActive && "bg-zinc-100 text-zinc-400",
            )}>
              {isDone ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
            </div>
            <span className={cn(
              "text-xs font-medium hidden sm:block",
              isActive ? "text-brand-dark" : "text-zinc-400"
            )}>
              {s.label}
            </span>
            {i < STEPS.length - 1 && (
              <div className={cn(
                "h-px w-6 mx-1",
                isDone ? "bg-brand" : "bg-zinc-200"
              )} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Step 1 — Account creation ────────────────────────────────────────────────

interface Step1Props {
  onNext: (uid: string, name: string, email: string) => void
}

function Step1({ onNext }: Step1Props) {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm]   = useState(false)
  const [isLoading, setIsLoading]       = useState(false)
  const [error, setError]               = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  })

  async function onSubmit(data: RegisterInput) {
    setIsLoading(true)
    setError(null)
    const result = await authService.signUp({
      email: data.email,
      password: data.password,
      options: { data: { name: data.name } },
    })
    setIsLoading(false)
    if (result.error || !result.data.user) {
      setError(result.error?.message ?? "Erro ao criar conta")
      return
    }
    onNext(result.data.user.id, data.name, data.email)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="name" className="text-zinc-700 font-medium">Nome completo</Label>
        <Input id="name" type="text" placeholder="Carlos Silva" autoComplete="name"
          className="h-11 focus-visible:ring-brand/40 focus-visible:border-brand"
          {...register("name")} />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email" className="text-zinc-700 font-medium">E-mail</Label>
        <Input id="email" type="email" placeholder="seu@email.com" autoComplete="email"
          className="h-11 focus-visible:ring-brand/40 focus-visible:border-brand"
          {...register("email")} />
        {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password" className="text-zinc-700 font-medium">Senha</Label>
        <div className="relative">
          <Input id="password" type={showPassword ? "text" : "password"}
            placeholder="Mínimo 6 caracteres" autoComplete="new-password"
            className="h-11 pr-10 focus-visible:ring-brand/40 focus-visible:border-brand"
            {...register("password")} />
          <button type="button" onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}>
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="confirmPassword" className="text-zinc-700 font-medium">Confirmar senha</Label>
        <div className="relative">
          <Input id="confirmPassword" type={showConfirm ? "text" : "password"}
            placeholder="••••••••" autoComplete="new-password"
            className="h-11 pr-10 focus-visible:ring-brand/40 focus-visible:border-brand"
            {...register("confirmPassword")} />
          <button type="button" onClick={() => setShowConfirm((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
            aria-label={showConfirm ? "Ocultar senha" : "Mostrar senha"}>
            {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/8 border border-destructive/20 px-3.5 py-2.5">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <Button type="submit" disabled={isLoading}
        className="w-full h-11 bg-brand hover:bg-brand-dark text-brand-foreground font-medium transition-colors">
        {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Criando conta...</> : "Continuar"}
      </Button>
    </form>
  )
}

// ─── Step 2 — Plan selection ──────────────────────────────────────────────────

interface Step2Props {
  onNext: (plan: StudentPlan, validityDays: number, totalPlays: number, playValue: number) => void
}

function Step2({ onNext }: Step2Props) {
  const [selected, setSelected] = useState<StudentPlan | null>(null)
  const { data: plans = [] } = usePlans()

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {plans.map((plan) => {
          const isSelected = selected === plan.id
          return (
            <button
              key={plan.id}
              type="button"
              onClick={() => setSelected(plan.id as StudentPlan)}
              className={cn(
                "w-full text-left rounded-xl border-2 p-4 transition-all",
                isSelected
                  ? "border-brand bg-brand-subtle"
                  : "border-zinc-200 bg-white hover:border-brand/40"
              )}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className={cn("font-semibold text-sm", isSelected ? "text-brand-dark" : "text-zinc-800")}>
                    {plan.label}
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">{plan.totalPlays} Plays · {plan.validityDays} dias</p>
                </div>
                <div className="text-right">
                  <p className={cn("text-lg font-bold tabular-nums", isSelected ? "text-brand-dark" : "text-zinc-800")}>
                    R$ {(plan.priceInCents / 100).toLocaleString("pt-BR")}
                  </p>
                  {isSelected && <Check className="w-4 h-4 text-brand ml-auto mt-0.5" />}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <Button
        type="button"
        disabled={!selected}
        onClick={() => {
          const planConfig = plans.find((p) => p.id === selected)
          if (selected && planConfig) onNext(selected, planConfig.validityDays, planConfig.totalPlays, planConfig.playValue)
        }}
        className="w-full h-11 bg-brand hover:bg-brand-dark text-brand-foreground font-medium transition-colors"
      >
        Continuar
      </Button>
    </div>
  )
}

// ─── Step 3 — Teacher selection ───────────────────────────────────────────────

interface Step3Props {
  onFinish: (teacherId: string) => void
  isPending: boolean
}

function Step3({ onFinish, isPending }: Step3Props) {
  const [selected, setSelected] = useState<string | null>(null)
  const { data: teachers = [], isLoading } = useTeachers()

  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-brand" />
        </div>
      ) : (
        <div className="space-y-2">
          {teachers.map((teacher) => {
            const isSelected = selected === teacher.uid
            const initials = teacher.name.split(" ").slice(0, 2).map((n) => n[0]).join("")
            return (
              <button
                key={teacher.uid}
                type="button"
                onClick={() => setSelected(teacher.uid)}
                className={cn(
                  "w-full text-left rounded-xl border-2 p-3 flex items-center gap-3 transition-all",
                  isSelected
                    ? "border-brand bg-brand-subtle"
                    : "border-zinc-200 bg-white hover:border-brand/40"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-sm font-bold",
                  isSelected ? "bg-brand-dark text-white" : "bg-zinc-100 text-zinc-600"
                )}>
                  {initials}
                </div>
                <span className={cn(
                  "font-semibold text-sm",
                  isSelected ? "text-brand-dark" : "text-zinc-800"
                )}>
                  {teacher.name}
                </span>
                {isSelected && <Check className="w-4 h-4 text-brand ml-auto" />}
              </button>
            )
          })}
        </div>
      )}

      <Button
        type="button"
        disabled={!selected || isPending}
        onClick={() => selected && onFinish(selected)}
        className="w-full h-11 bg-brand hover:bg-brand-dark text-brand-foreground font-medium transition-colors"
      >
        {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Finalizando...</> : "Finalizar cadastro"}
      </Button>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

const STEP_TITLES: Record<number, { title: string; subtitle: string }> = {
  1: { title: "Crie sua conta",     subtitle: "Preencha os dados abaixo para começar" },
  2: { title: "Escolha seu plano",  subtitle: "Selecione o plano que melhor se encaixa na sua rotina" },
  3: { title: "Seu professor",      subtitle: "Vincule-se ao professor que acompanhará sua evolução" },
}

interface OnboardingState {
  uid: string
  name: string
  email: string
  plan: StudentPlan | null
  validityDays: number
  totalPlays: number
  playValue: number
}

export function RegisterPageContent() {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [state, setState] = useState<OnboardingState>({ uid: "", name: "", email: "", plan: null, validityDays: 30, totalPlays: 0, playValue: 0 })
  const { mutate: finishOnboarding, isPending, error } = useOnboarding()

  const { title, subtitle } = STEP_TITLES[step]

  function handleStep1(uid: string, name: string, email: string) {
    setState((s) => ({ ...s, uid, name, email }))
    setStep(2)
  }

  function handleStep2(plan: StudentPlan, validityDays: number, totalPlays: number, playValue: number) {
    setState((s) => ({ ...s, plan, validityDays, totalPlays, playValue }))
    setStep(3)
  }

  function handleStep3(originalTeacherId: string) {
    if (!state.plan) return
    finishOnboarding({
      uid: state.uid,
      name: state.name,
      email: state.email,
      plan: state.plan,
      originalTeacherId,
      validityDays: state.validityDays,
      totalPlays: state.totalPlays,
      playValue: state.playValue,
    })
  }

  return (
    <div className="flex min-h-screen">
      <AuthBrandPanel />

      <div className="flex flex-1 items-center justify-center bg-white px-6 py-12 lg:px-16">
        <div className="w-full max-w-95">
          <div className="flex items-center gap-2.5 mb-10 lg:hidden">
            <MobileLogo />
          </div>

          <StepIndicator current={step} />

          <div className="mb-8">
            <h1 className="text-[1.65rem] font-bold tracking-tight text-zinc-900">{title}</h1>
            <p className="mt-1.5 text-sm text-zinc-500">{subtitle}</p>
          </div>

          {step === 1 && <Step1 onNext={handleStep1} />}
          {step === 2 && <Step2 onNext={handleStep2} />}
          {step === 3 && <Step3 onFinish={handleStep3} isPending={isPending} />}

          {error && (
            <div className="mt-4 rounded-lg bg-destructive/8 border border-destructive/20 px-3.5 py-2.5">
              <p className="text-sm text-destructive">{error.message}</p>
            </div>
          )}

          <p className="mt-6 text-center text-sm text-zinc-500">
            Já tem uma conta?{" "}
            <Link href="/login" className="font-semibold text-brand hover:text-brand-dark transition-colors">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
