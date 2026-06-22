// src/features/student/indique-um-amigo/components/friends-list.tsx
import { Users2, CircleCheck, Clock } from "lucide-react"
import type { Referral } from "@/core/entities/referral"

interface FriendsListProps {
  referrals: Referral[]
}

function formatDateBR(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export function FriendsList({ referrals }: FriendsListProps) {
  if (referrals.length === 0) {
    return (
      <div className="bg-card rounded-2xl border border-border shadow-sm p-8 text-center">
        <Users2 className="w-8 h-8 text-zinc-300 mx-auto mb-3" />
        <p className="text-sm font-medium text-muted-foreground">Você ainda não indicou ninguém</p>
        <p className="text-xs text-zinc-400 mt-1">Compartilhe seu código para começar a ganhar créditos</p>
      </div>
    )
  }

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-border">
        <h2 className="text-base font-semibold text-foreground">Amigos Indicados</h2>
        <p className="text-xs text-zinc-400 mt-0.5">
          {referrals.length} indicaç{referrals.length === 1 ? "ão" : "ões"} registrada
          {referrals.length === 1 ? "" : "s"}
        </p>
      </div>

      <div className="divide-y divide-border">
        {referrals.map((referral) => (
          <div key={referral.id} className="px-6 py-3.5 flex items-center gap-4">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-brand-subtle">
              <Users2 className="w-4 h-4 text-brand" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {referral.friendName ?? referral.friendEmail}
              </p>
              <p className="text-xs text-zinc-400 mt-0.5 truncate">{referral.friendEmail}</p>
            </div>

            <div className="flex items-center gap-1.5 shrink-0 text-right">
              {referral.status === "CONCLUIDO" ? (
                <>
                  <CircleCheck className="w-3.5 h-3.5 text-brand" />
                  <p className="text-sm font-bold text-brand-dark tabular-nums">
                    +{referral.bonusCredits} Plays recebidos
                  </p>
                </>
              ) : (
                <>
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  <p className="text-sm font-medium text-amber-600">
                    Aguardando cadastro · {formatDateBR(referral.createdAt)}
                  </p>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
