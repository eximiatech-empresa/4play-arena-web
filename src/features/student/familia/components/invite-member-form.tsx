// src/features/student/familia/components/invite-member-form.tsx
"use client"
import { useState, type FormEvent } from "react"
import { UserPlus } from "lucide-react"
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
import type { FamilyMemberRole } from "@/core/entities/family"

interface InviteMemberFormProps {
  onInvite: (email: string, role: FamilyMemberRole) => void
}

export function InviteMemberForm({ onInvite }: InviteMemberFormProps) {
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<FamilyMemberRole>("DEPENDENTE")

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    onInvite(email.trim(), role)
    setEmail("")
  }

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-brand-subtle shrink-0">
          <UserPlus className="w-5 h-5 text-brand" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-foreground">Convidar Familiar</h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Adicione membros da família para compartilhar sua conta
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 sm:items-end">
        <div className="flex-1 space-y-1.5">
          <Label htmlFor="family-email">E-mail do familiar</Label>
          <Input
            id="family-email"
            type="email"
            placeholder="nome@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="family-role">Tipo</Label>
          <Select value={role} onValueChange={(v) => setRole(v as FamilyMemberRole)}>
            <SelectTrigger id="family-role" className="w-full sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DEPENDENTE">Dependente</SelectItem>
              <SelectItem value="TITULAR">Titular</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button type="submit" className="sm:w-36">
          <UserPlus className="w-4 h-4" />
          Convidar
        </Button>
      </form>
    </div>
  )
}
