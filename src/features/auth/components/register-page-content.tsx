"use client"

import { useState } from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, EyeOff, Loader2 } from "lucide-react"

import { RegisterSchema, type RegisterInput } from "@/core/entities/auth"
import { useRegister } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AuthBrandPanel } from "@/components/shared/auth-brand-panel"
import { MobileLogo } from "./mobile-logo"

export function RegisterPageContent() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const { mutate: register, isPending, error } = useRegister()

  const {
    register: field,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  })

  return (
    <div className="flex min-h-screen">
      <AuthBrandPanel />

      <div className="flex flex-1 items-center justify-center bg-white px-6 py-12 lg:px-16">
        <div className="w-full max-w-[360px]">

          <div className="flex items-center gap-2.5 mb-10 lg:hidden">
            <MobileLogo />
          </div>

          <div className="mb-8">
            <h1 className="text-[1.65rem] font-bold tracking-tight text-zinc-900">
              Crie sua conta
            </h1>
            <p className="mt-1.5 text-sm text-zinc-500">
              Preencha os dados abaixo para começar a usar o 4Play Arena
            </p>
          </div>

          <form onSubmit={handleSubmit((data) => register(data))} className="space-y-5" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-zinc-700 font-medium">Nome completo</Label>
              <Input
                id="name"
                type="text"
                placeholder="Carlos Silva"
                autoComplete="name"
                className="h-11 focus-visible:ring-brand/40 focus-visible:border-brand"
                {...field("name")}
              />
              {errors.name && (
                <p className="text-xs text-destructive mt-1">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-zinc-700 font-medium">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                autoComplete="email"
                className="h-11 focus-visible:ring-brand/40 focus-visible:border-brand"
                {...field("email")}
              />
              {errors.email && (
                <p className="text-xs text-destructive mt-1">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-zinc-700 font-medium">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Mínimo 6 caracteres"
                  autoComplete="new-password"
                  className="h-11 pr-10 focus-visible:ring-brand/40 focus-visible:border-brand"
                  {...field("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-destructive mt-1">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword" className="text-zinc-700 font-medium">
                Confirmar senha
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="h-11 pr-10 focus-visible:ring-brand/40 focus-visible:border-brand"
                  {...field("confirmPassword")}
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

            {error && (
              <div className="rounded-lg bg-destructive/8 border border-destructive/20 px-3.5 py-2.5">
                <p className="text-sm text-destructive">{error.message}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={isPending}
              className="w-full h-11 bg-brand hover:bg-brand-dark text-brand-foreground font-medium transition-colors"
            >
              {isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Criando conta...</>
              ) : "Criar conta"}
            </Button>
          </form>

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
