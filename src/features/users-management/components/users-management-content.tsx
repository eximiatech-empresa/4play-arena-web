"use client"
import { useState } from "react"
import { Users, UserPlus, Search, Loader2, ShieldOff, LayoutGrid, List } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LevelBadge } from "@/components/shared/level-badge"
import { CreateUserModal } from "./create-user-modal"
import { UserDetailsModal } from "./users-details-modal"
import { useUsers, type UserListItem } from "../hooks/use-users"
import { cn } from "@/lib/utils"

const ROLE_LABEL: Record<string, string> = {
  STUDENT: "Aluno",
  TEACHER: "Professor",
  ADMIN: "Admin",
}

const ROLE_COLOR: Record<string, string> = {
  STUDENT: "bg-brand-subtle text-brand-dark border-brand/20",
  TEACHER: "bg-blue-50 text-blue-700 border-blue-200",
  ADMIN: "bg-green-200 text-zinc-900 border-none",
}

function ViewToggle({
  value,
  onChange,
}: {
  value: "grid" | "list"
  onChange: (v: "grid" | "list") => void
}) {
  return (
    <div className="flex items-center gap-0.5 border border-brand/50 rounded-lg p-0.5 bg-card shrink-0">
      <button
        onClick={() => onChange("grid")}
        title="Visualização em grade"
        className={cn(
          "p-1.5 rounded-md transition-colors cursor-pointer",
          value === "grid" ? "bg-zinc-200 shadow-sm text-foreground" : "text-foreground hover:text-foreground/50",
        )}
      >
        <LayoutGrid className="w-4 h-4" />
      </button>
      <button
        onClick={() => onChange("list")}
        title="Visualização em lista"
        className={cn(
          "p-1.5 rounded-md transition-colors cursor-pointer",
          value === "list" ? "bg-zinc-200 shadow-sm text-foreground" : "text-foreground hover:text-foreground/50",
        )}
      >
        <List className="w-4 h-4" />
      </button>
    </div>
  )
}

function UserCard({ user, onClick }: { user: UserListItem; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="bg-card hover:bg-card/20 rounded-xl border border-brand/50 p-4 flex flex-col gap-3 hover:shadow-md cursor-pointer transition-shadow"
    >
      <div className="flex items-center gap-3">
        <div className="relative shrink-0">
          <div className="w-12 h-12 rounded-full bg-brand flex items-center justify-center font-bold text-white text-lg">
            {user.name.charAt(0)}
          </div>
          {!user.isActive && (
            <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-red-500 border-2 border-white flex items-center justify-center">
              <ShieldOff className="w-2.5 h-2.5 text-white" />
            </span>
          )}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="text-sm font-semibold text-foreground">{user.name}</p>
            {!user.isActive && (
              <span className="text-[9px] font-bold text-red-500 bg-red-50 border border-red-200 rounded-full px-1.5 py-0.5 leading-none shrink-0">
                Bloqueado
              </span>
            )}
          </div>
          <p className="text-xs text-foreground/50 truncate">{user.email}</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <span
          className={cn(
            "text-[10px] font-bold uppercase tracking-wide border rounded-full px-2 py-0.5",
            ROLE_COLOR[user.role] ?? "bg-zinc-50 text-zinc-500 border-zinc-200",
          )}
        >
          {ROLE_LABEL[user.role] ?? user.role}
        </span>
        {user.level && <LevelBadge level={user.level} size="xs" />}
      </div>
    </div>
  )
}

function UserRow({ user, onClick }: { user: UserListItem; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="bg-card hover:bg-card/95  p-4 sm:px-6 flex items-center justify-between cursor-pointer transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-brand flex items-center justify-center font-bold text-white">
            {user.name.charAt(0)}
          </div>
          {!user.isActive && (
            <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 border-2 border-white flex items-center justify-center">
              <ShieldOff className="w-2 h-2 text-white" />
            </span>
          )}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-foreground">{user.name}</p>
            {!user.isActive && (
              <span className="text-[10px] font-bold text-red-500 bg-red-50 border border-red-200 rounded-full px-1.5 py-0.5 leading-none">
                Bloqueado
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-500">{user.email}</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="hidden sm:block text-right">
          <p className="text-[10px] font-bold text-brand/80 uppercase tracking-tighter">
            {ROLE_LABEL[user.role] ?? user.role}
          </p>
          {user.level && <LevelBadge level={user.level} size="xs" />}
        </div>
        <Button variant="ghost" size="sm" className="text-zinc-400">
          Ver
        </Button>
      </div>
    </div>
  )
}

export function UsersManagementContent() {
  const { data: users = [], isLoading, isError } = useUsers()
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserListItem | null>(null)
  const [viewMode, setViewMode] = useState<"grid" | "list">("list")

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="px-5 py-6 lg:px-8 lg:py-8 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-brand" /> Gestão de Usuários
          </h1>
          <p className="text-sm text-zinc-500">Gerencie contas e permissões da plataforma.</p>
        </div>
        <div className="flex items-center gap-2">
          <ViewToggle value={viewMode} onChange={setViewMode} />
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-brand hover:bg-brand-dark text-white"
          >
            <UserPlus className="w-4 h-4 mr-2" /> Novo Usuário
          </Button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <Input
          placeholder="Buscar usuário..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9 bg-white"
        />
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
        </div>
      )}

      {isError && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-sm font-medium text-zinc-600">Erro ao carregar usuários</p>
          <p className="text-xs text-zinc-400 mt-1">Tente novamente mais tarde</p>
        </div>
      )}

      {!isLoading && !isError && filteredUsers.length === 0 && (
        <div className="flex items-center justify-center py-16">
          <p className="text-sm text-zinc-400">Nenhum usuário encontrado</p>
        </div>
      )}

      {!isLoading && !isError && filteredUsers.length > 0 && (
        viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredUsers.map((user) => (
              <UserCard key={user.uid} user={user} onClick={() => setSelectedUser(user)} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-sm">
            <div className="divide-y divide-zinc-100">
              {filteredUsers.map((user) => (
                <UserRow key={user.uid} user={user} onClick={() => setSelectedUser(user)} />
              ))}
            </div>
          </div>
        )
      )}

      <CreateUserModal open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen} />
      <UserDetailsModal
        user={selectedUser}
        open={!!selectedUser}
        onOpenChange={(open) => !open && setSelectedUser(null)}
      />
    </div>
  )
}
