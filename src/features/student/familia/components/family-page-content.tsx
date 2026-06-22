// src/features/student/familia/components/family-page-content.tsx
"use client"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { InviteMemberForm } from "./invite-member-form"
import { FamilyMembersList } from "./family-members-list"
import { useFamily, useInviteFamilyMember, useRemoveFamilyMember, type FamilyMemberView } from "../hooks/use-family"
import type { FamilyMemberRole } from "@/core/entities/family"

export function FamilyPageContent() {
  const { data, isLoading, isError } = useFamily()
  const { mutate: invite } = useInviteFamilyMember()
  const { mutate: remove } = useRemoveFamilyMember()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <p className="text-sm font-medium text-zinc-600">Erro ao carregar sua família</p>
        <p className="text-xs text-zinc-400 mt-1">Tente novamente mais tarde</p>
      </div>
    )
  }

  function handleInvite(email: string, role: FamilyMemberRole) {
    invite(
      { familyId: data!.familyId, email, role },
      {
        onSuccess: () => toast.success(`Convite enviado para ${email}`),
        onError: (err) => toast.error(err.message || "Não foi possível enviar o convite"),
      },
    )
  }

  function handleRemove(member: FamilyMemberView) {
    if (!member.invite) return
    remove(member.invite, {
      onSuccess: () => toast.success(`${member.name} foi removido da família`),
      onError: (err) => toast.error(err.message || "Não foi possível remover o membro"),
    })
  }

  return (
    <div className="px-5 py-6 lg:px-8 lg:py-8 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Gerencie sua Família</h1>
        <p className="text-sm text-muted-foreground mt-0.5 max-w-2xl">
          Convide e gerencie os membros da sua família para compartilharem sua conta na 4play-arena.
        </p>
      </div>

      <InviteMemberForm onInvite={handleInvite} />
      <FamilyMembersList members={data.members} onRemove={handleRemove} />
    </div>
  )
}
