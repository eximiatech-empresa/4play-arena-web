"use client"
import { useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Eye, EyeOff } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useCreateUser } from "../hooks/use-users"
import { CreateUserFormSchema, type CreateUserFormData } from "@/core/entities/user"

interface CreateUserModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateUserModal({ open, onOpenChange }: CreateUserModalProps) {
  const [showPassword, setShowPassword] = useState(false)
  const { mutate: createUser, isPending } = useCreateUser()

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(CreateUserFormSchema),
    defaultValues: { name: "", email: "", role: "TEACHER", password: "" },
  })

  function handleClose(value: boolean) {
    if (!value) {
      reset()
      setShowPassword(false)
    }
    onOpenChange(value)
  }

  function onSubmit(data: CreateUserFormData) {
    const toastId = toast.loading("Criando usuário...")
    createUser(data, {
      onSuccess: () => {
        toast.success("Usuário criado! Ele deverá alterar a senha no primeiro acesso.", { id: toastId })
        handleClose(false)
      },
      onError: (err) => {
        toast.error(err instanceof Error ? err.message : "Erro ao criar usuário.", { id: toastId })
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-106.25">
        <DialogHeader>
          <DialogTitle>Novo Usuário Gerencial</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome Completo</Label>
            <Input
              className="border-chart-4"
              id="name"
              placeholder="Ex: João Silva"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              className="border-chart-4"
              id="email"
              type="email"
              placeholder="joao@email.com"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Cargo</Label>
            <Controller
              name="role"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full h-10 border-chart-4 focus:ring-2 focus:ring-brand cursor-pointer">
                    <SelectValue placeholder="Selecione um cargo..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TEACHER" className="focus:bg-brand-subtle focus:text-brand-dark cursor-pointer">
                      Professor
                    </SelectItem>
                    <SelectItem value="ADMIN" className="focus:bg-brand-subtle cursor-pointer">
                      Administrador
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.role && (
              <p className="text-xs text-destructive">{errors.role.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha Padrão</Label>
            <div className="relative">
              <Input
                className="border-chart-4 pr-10"
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Mínimo 6 caracteres"
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
            <p className="text-xs text-zinc-400">O usuário será obrigado a alterar a senha no primeiro acesso.</p>
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="submit"
              className="w-full bg-brand hover:bg-brand-dark text-white"
              disabled={isPending}
            >
              {isPending ? "Criando..." : "Criar Usuário"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
