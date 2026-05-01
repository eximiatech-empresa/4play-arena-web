"use client"

import { useState } from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, EyeOff, Loader2 } from "lucide-react"

import { LoginSchema, type LoginInput } from "@/core/entities/auth"
import { useLogin } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AuthBrandPanel } from "@/components/shared/auth-brand-panel"
import { MobileLogo } from "./mobile-logo"

export function LoginPageContent() {
  const [showPassword, setShowPassword] = useState(false)
  const { mutate: login, isPending, error } = useLogin()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: "", password: "" },
  })

  return (
    <div className="flex min-h-screen">
      <AuthBrandPanel />

      <div className="flex flex-1 items-center justify-center bg-white px-6 py-12 lg:px-16">
        <div className="w-full max-w-90">

          <div className="flex items-center gap-2.5 mb-10 lg:hidden">
            <MobileLogo />
          </div>

          <div className="mb-8">
            <h1 className="text-[1.65rem] font-bold tracking-tight text-zinc-900">
              Bem-vindo de volta
            </h1>
            <p className="mt-1.5 text-sm text-zinc-500">
              Entre com sua conta para acessar sua carteira de horas
            </p>
          </div>

          <form onSubmit={handleSubmit((data) => login(data))} className="space-y-5" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-zinc-700 font-medium">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                autoComplete="email"
                className="h-11 focus-visible:ring-brand/40 focus-visible:border-brand"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-destructive mt-1">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-zinc-700 font-medium">Senha</Label>
                <Link href="/forgot-password" className="text-xs text-brand hover:text-brand-dark transition-colors">
                  Esqueceu a senha?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="h-11 pr-10 focus-visible:ring-brand/40 focus-visible:border-brand"
                  {...register("password")}
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

            {error && (
              <div className="rounded-lg bg-destructive/8 border border-destructive/20 px-3.5 py-2.5">
                <p className="text-sm text-destructive">{error.message}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={isPending}
              className="w-full h-11 bg-chart-4 hover:bg-chart-5 text-brand-subtle font-medium transition-colors"
            >
              {isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Entrando...</>
              ) : "Entrar"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-zinc-500">
            Não tem uma conta?{" "}
            <Link href="/register" className="font-semibold text-brand hover:text-brand-dark transition-colors">
              Cadastre-se
            </Link>
          </p>

          <div className="mt-8 rounded-lg border border-zinc-100 bg-zinc-50 px-4 py-3">
            <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-wide mb-1.5">
              Acesso de teste
            </p>
            <p className="text-xs text-zinc-500 font-mono">aluno@4playarena.com</p>
            <p className="text-xs text-zinc-500 font-mono">senha123</p>
          </div>
        </div>
      </div>
    </div>
  )
}
