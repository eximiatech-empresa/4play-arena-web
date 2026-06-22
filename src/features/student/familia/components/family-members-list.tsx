// src/features/student/familia/components/family-members-list.tsx
import { Users2, Trash2, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { FamilyMemberView } from "../hooks/use-family"

interface FamilyMembersListProps {
  members: FamilyMemberView[]
  onRemove: (member: FamilyMemberView) => void
}

function formatDateBR(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("")
}

export function FamilyMembersList({ members, onRemove }: FamilyMembersListProps) {
  if (members.length === 0) {
    return (
      <div className="bg-card rounded-2xl border border-border shadow-sm p-8 text-center">
        <Users2 className="w-8 h-8 text-zinc-300 mx-auto mb-3" />
        <p className="text-sm font-medium text-muted-foreground">Nenhum familiar adicionado ainda</p>
        <p className="text-xs text-zinc-400 mt-1">Convide alguém da sua família para começar</p>
      </div>
    )
  }

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-border">
        <h2 className="text-base font-semibold text-foreground">Membros da Família</h2>
        <p className="text-xs text-zinc-400 mt-0.5">
          {members.length} membro{members.length === 1 ? "" : "s"} na sua família
        </p>
      </div>

      <div className="divide-y divide-border">
        {members.map((member) => (
          <div key={member.id} className="px-6 py-3.5 flex items-center gap-4">
            <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 bg-brand-subtle text-brand text-xs font-bold">
              {getInitials(member.name)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-medium text-foreground truncate">{member.name}</p>
                <span className="text-[9px] font-semibold text-zinc-400 uppercase tracking-wide border border-border rounded-full px-1.5 py-0.5">
                  {member.role === "TITULAR" ? "Titular" : "Dependente"}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5 truncate">{member.email}</p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {member.status === "ATIVO" ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-brand-subtle border border-brand/20 px-2.5 py-1 text-xs font-semibold text-brand-dark">
                  Ativo
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-1 text-xs font-semibold text-amber-600">
                  <Clock className="w-3 h-3" />
                  Convite pendente
                </span>
              )}

              <p className="text-xs text-zinc-400 hidden sm:block tabular-nums">
                {formatDateBR(member.addedAt)}
              </p>

              {member.invite && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-zinc-400 hover:text-red-500"
                  onClick={() => onRemove(member)}
                  aria-label={`Remover ${member.name}`}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
