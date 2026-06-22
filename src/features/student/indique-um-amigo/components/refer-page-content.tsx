// src/features/student/indique-um-amigo/components/refer-page-content.tsx
"use client"
import { Coins, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { InviteCodeCard } from "./invite-code-card"
import { InviteFriendForm } from "./invite-friend-form"
import { FriendsList } from "./friends-list"
import { useReferrals, useInviteFriend } from "../hooks/use-referrals"
import { useCurrentUser } from "@/hooks/use-current-user"

export function ReferPageContent() {
  const { data: currentUser } = useCurrentUser()
  const { data, isLoading, isError } = useReferrals()
  const { mutate: invite } = useInviteFriend()

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
        <p className="text-sm font-medium text-zinc-600">Erro ao carregar suas indicações</p>
        <p className="text-xs text-zinc-400 mt-1">Tente novamente mais tarde</p>
      </div>
    )
  }

  const totalEarned = data.referrals
    .filter((r) => r.status === "CONCLUIDO")
    .reduce((sum, r) => sum + r.bonusCredits, 0)

  function handleInvite(email: string) {
    if (!currentUser) return
    invite(
      { referrerId: currentUser.uid, referralCode: data!.code, friendEmail: email },
      {
        onSuccess: () => toast.success(`Convite enviado para ${email}`),
        onError: (err) => toast.error(err.message || "Não foi possível enviar o convite"),
      },
    )
  }

  return (
    <div className="px-5 py-6 lg:px-8 lg:py-8 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Convide seus amigos para a 4play-arena!</h1>
        <p className="text-sm text-muted-foreground mt-0.5 max-w-2xl">
          Para cada amigo que se inscrever usando seu código, você ganha 50 Plays.
          E o melhor: seu amigo também já começa com 50 Plays totalmente de graça!
        </p>
      </div>

      <InviteCodeCard code={data.code} />

      <div className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-4">
        <div>
          <h2 className="text-base font-semibold text-foreground">Convidar por e-mail</h2>
          <p className="text-xs text-zinc-400 mt-0.5">Envie seu código diretamente para um amigo</p>
        </div>
        <InviteFriendForm onInvite={handleInvite} />
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-subtle border border-brand/20 px-3 py-1 text-xs font-semibold text-brand-dark">
          <Coins className="w-3.5 h-3.5" />
          {totalEarned} Plays ganhos com indicações
        </span>
      </div>

      <FriendsList referrals={data.referrals} />
    </div>
  )
}
