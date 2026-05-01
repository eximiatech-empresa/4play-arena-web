"use client"
import { useState } from "react"
import { toast } from "sonner"
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
import type { UserRole } from "@/core/entities/user"

interface CreateUserModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const emptyForm = { name: "", email: "", role: "TEACHER" as UserRole, level: "" }

export function CreateUserModal({ open, onOpenChange }: CreateUserModalProps) {
  const [form, setForm] = useState(emptyForm)
  const { mutate: createUser, isPending } = useCreateUser()

  function handleClose(value: boolean) {
    if (!value) setForm(emptyForm)
    onOpenChange(value)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.role) return

    createUser(
      {
        name: form.name,
        email: form.email,
        role: form.role as UserRole,
        level: form.role === "STUDENT" ? form.level || "Iniciante" : undefined,
      },
      {
        onSuccess: () => {
          toast.success("Usuário criado com sucesso!")
          handleClose(false)
        },
        onError: () => {
          toast.error("Erro ao criar usuário. Tente novamente.")
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Novo Usuário</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome Completo</Label>
            <Input
              className="border-chart-4"
              id="name"
              placeholder="Ex: João Silva"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              className="border-chart-4"
              id="email"
              type="email"
              placeholder="joao@email.com"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Tipo de Conta</Label>
            <Select
              value={form.role}
              onValueChange={(v) => setForm((f) => ({ ...f, role: v as UserRole, level: "" }))}
              required
            >
              <SelectTrigger className="w-full h-10 border-chart-4 focus:ring-2 focus:ring-brand cursor-pointer">
                <SelectValue placeholder="Selecione um tipo..." />
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
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="submit"
              className="w-full bg-brand hover:bg-brand-dark text-white"
              disabled={isPending || !form.role}
            >
              {isPending ? "Criando..." : "Criar Usuário"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
