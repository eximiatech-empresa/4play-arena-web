"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Eye, EyeOff, KeyRound, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { AuthBrandPanel } from "@/components/shared/auth-brand-panel"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useCurrentUser } from "@/hooks/use-current-user"
import { useForcePasswordChange } from "../hooks/use-force-password-change"

const Schema = z
  .object({
    newPassword: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  })

type FormData = z.infer<typeof Schema>

export function ForcePasswordChangeContent() {
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const { data: user, isLoading } = useCurrentUser()
  const { mutate: changePassword, isPending } = useForcePasswordChange()
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(Schema),
  })

  useEffect(() => {
    if (isLoading) return
    if (!user) {
      router.replace("/login")
      return
    }
    if (!user.mustChangePassword) {
      if (user.role === "ADMIN") router.replace("/painel")
      else if (user.role === "TEACHER") router.replace("/class-management")
      else router.replace("/dashboard")
    }
  }, [isLoading, user, router])

  function onSubmit({ newPassword }: FormData) {
    const toastId = toast.loading("Atualizando senha...")
    changePassword(newPassword, {
      onSuccess: () => {
        toast.success("Senha alterada com sucesso! Bem-vindo.", { id: toastId })
      },
      onError: (err) => {
        toast.error(err instanceof Error ? err.message : "Erro ao alterar senha.", { id: toastId })
      },
    })
  }

  if (isLoading || !user) return null

  return (
    <div className="flex min-h-screen">
      <AuthBrandPanel />

      <div className="flex flex-1 items-center justify-center bg-white px-6 py-12 lg:px-16">
        <div className="w-full max-w-90">
          <div className="flex justify-center mb-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand/10">
              <KeyRound className="h-7 w-7 text-brand" />
            </div>
          </div>

          <div className="mb-8 text-center">
            <h1 className="text-[1.65rem] font-bold tracking-tight text-zinc-900">
              Crie sua senha
            </h1>
            <p className="mt-1.5 text-sm text-zinc-500">
              Por segurança, defina uma senha pessoal antes de continuar.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="newPassword" className="text-zinc-700 font-medium">
                Nova Senha
              </Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNew ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="h-11 pr-10 focus-visible:ring-brand/40 focus-visible:border-brand"
                  {...register("newPassword")}
                />
                <button
                  type="button"
                  onClick={() => setShowNew((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
                  aria-label={showNew ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.newPassword && (
                <p className="text-xs text-destructive mt-1">{errors.newPassword.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword" className="text-zinc-700 font-medium">
                Confirmar Nova Senha
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="h-11 pr-10 focus-visible:ring-brand/40 focus-visible:border-brand"
                  {...register("confirmPassword")}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
                  aria-label={showConfirm ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-destructive mt-1">{errors.confirmPassword.message}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isPending}
              className="w-full h-11 bg-chart-4 hover:bg-chart-5 text-brand-subtle font-medium transition-colors"
            >
              {isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvando...</>
              ) : "Salvar senha e continuar"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
