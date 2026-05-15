"use client"

import { useState, useMemo } from "react"
import { Users, UserPlus, X, Search, Loader2, UsersRound, Trophy, Shield } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LevelBadge } from "@/components/shared/level-badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { useCurrentUser } from "@/hooks/use-current-user"
import { useTeachers } from "@/features/auth/hooks/use-teachers"
import { useUsers } from "@/features/users-management/hooks/use-users"
import { useTeacherClass, useUpdateTeacherClass } from "../hooks/use-teacher-class"
import type { UserListItem } from "@/lib/firebase/firestore"

// ─── Student card in roster ───────────────────────────────────────────────────

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
}

interface RosterCardProps {
  student: UserListItem
  onRemove: () => void
  isPending: boolean
}

function RosterCard({ student, onRemove, isPending }: RosterCardProps) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
      <div className="w-8 h-8 rounded-full bg-brand-dark flex items-center justify-center shrink-0">
        <span className="text-xs font-bold text-white">{initials(student.name)}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100 truncate">{student.name}</p>
        {student.level && <LevelBadge level={student.level} size="xs" className="mt-0.5" />}
      </div>
      <button
        onClick={onRemove}
        disabled={isPending}
        className="p-1 rounded-md text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors disabled:opacity-40"
        title="Remover"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

// ─── Student picker modal ─────────────────────────────────────────────────────

type RosterType = "titular" | "reserva"

interface StudentPickerModalProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  type: RosterType
  allStudents: UserListItem[]
  excludeIds: string[]
  onAdd: (studentId: string) => void
  isPending: boolean
}

function StudentPickerModal({
  open,
  onOpenChange,
  type,
  allStudents,
  excludeIds,
  onAdd,
  isPending,
}: StudentPickerModalProps) {
  const [search, setSearch] = useState("")

  const available = useMemo(() => {
    const term = search.toLowerCase()
    return allStudents.filter(
      (s) =>
        s.role === "STUDENT" &&
        s.isActive &&
        !excludeIds.includes(s.uid) &&
        (term === "" || s.name.toLowerCase().includes(term) || s.email.toLowerCase().includes(term)),
    )
  }, [allStudents, excludeIds, search])

  function handleAdd(studentId: string) {
    onAdd(studentId)
    setSearch("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {type === "titular" ? "Adicionar Titular" : "Adicionar ao Banco"}
          </DialogTitle>
        </DialogHeader>

        <div className="relative mt-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <Input
            placeholder="Buscar aluno..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            autoFocus
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-1.5 mt-2 min-h-0">
          {available.length === 0 ? (
            <p className="text-center text-sm text-zinc-400 py-8">
              {search ? "Nenhum aluno encontrado." : "Todos os alunos já foram adicionados."}
            </p>
          ) : (
            available.map((s) => (
              <button
                key={s.uid}
                disabled={isPending}
                onClick={() => handleAdd(s.uid)}
                className="w-full flex items-center gap-3 p-3 rounded-lg border border-transparent hover:border-brand/30 hover:bg-brand/5 transition-colors text-left disabled:opacity-50"
              >
                <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-zinc-600 dark:text-zinc-300">{initials(s.name)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100 truncate">{s.name}</p>
                  <p className="text-xs text-zinc-400 truncate">{s.email}</p>
                </div>
                {s.level && <LevelBadge level={s.level} size="xs" />}
              </button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Section header ───────────────────────────────────────────────────────────

interface SectionHeaderProps {
  icon: React.ReactNode
  title: string
  count: number
  limit?: number
  action?: React.ReactNode
}

function SectionHeader({ icon, title, count, limit, action }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">{title}</h3>
        <span className="text-xs text-zinc-400 tabular-nums">
          {limit !== undefined ? `${count}/${limit}` : count}
        </span>
      </div>
      {action}
    </div>
  )
}

// ─── Main content ─────────────────────────────────────────────────────────────

export function TeacherRosterContent() {
  const { data: currentUser } = useCurrentUser()
  const { data: teachers = [], isLoading: isLoadingTeachers } = useTeachers()
  const { data: allUsers = [], isLoading: isLoadingUsers } = useUsers()

  const isAdmin = currentUser?.role === "ADMIN"

  // Admin selects which teacher to manage; teacher always sees their own class
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | undefined>(undefined)
  const teacherId = isAdmin ? selectedTeacherId : currentUser?.uid

  const { data: teacherClass, isLoading: isLoadingClass } = useTeacherClass(teacherId)
  const { mutate: updateClass, isPending } = useUpdateTeacherClass(teacherId)

  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerType, setPickerType] = useState<RosterType>("titular")
  const [classSizeInput, setClassSizeInput] = useState<string>("")

  const classSize = teacherClass?.classSize ?? 4
  const titularIds = teacherClass?.titularIds ?? []
  const reservaIds = teacherClass?.reservaIds ?? []

  // Keep classSize input in sync with loaded data
  const displayedClassSize = classSizeInput !== "" ? classSizeInput : String(classSize)

  const allStudents = allUsers.filter((u) => u.role === "STUDENT")
  const titulares = allStudents.filter((s) => titularIds.includes(s.uid))
  const reservas = allStudents.filter((s) => reservaIds.includes(s.uid))

  // IDs to exclude from picker (already in any list)
  const excludedFromTitular = [...titularIds, ...reservaIds]
  const excludedFromReserva = [...titularIds, ...reservaIds]

  function openPicker(type: RosterType) {
    setPickerType(type)
    setPickerOpen(true)
  }

  function handleAddStudent(studentId: string) {
    if (!teacherClass && !teacherId) return

    if (pickerType === "titular") {
      if (titularIds.length >= classSize) {
        toast.error(`Turma cheia. Aumente o número de vagas ou remova um titular.`)
        return
      }
      updateClass(
        { titularIds: [...titularIds, studentId] },
        { onSuccess: () => setPickerOpen(false) },
      )
    } else {
      updateClass(
        { reservaIds: [...reservaIds, studentId] },
        { onSuccess: () => setPickerOpen(false) },
      )
    }
  }

  function handleRemoveTitular(studentId: string) {
    updateClass({ titularIds: titularIds.filter((id) => id !== studentId) })
  }

  function handleRemoveReserva(studentId: string) {
    updateClass({ reservaIds: reservaIds.filter((id) => id !== studentId) })
  }

  function handleClassSizeBlur() {
    const parsed = parseInt(classSizeInput, 10)
    if (!isNaN(parsed) && parsed >= 1 && parsed !== classSize) {
      if (parsed < titularIds.length) {
        toast.error(`Não é possível definir ${parsed} vagas com ${titularIds.length} titulares na turma.`)
        setClassSizeInput("")
        return
      }
      updateClass({ classSize: parsed })
    }
    setClassSizeInput("")
  }

  const isLoading = isLoadingClass || isLoadingUsers || (isAdmin && isLoadingTeachers)

  if (isAdmin && !selectedTeacherId) {
    return (
      <div className="px-5 py-6 lg:px-8 lg:py-8 max-w-3xl mx-auto">
        <h1 className="text-xl font-bold text-zinc-800 dark:text-zinc-100 mb-6">Gestão de Turma</h1>
        <div className="max-w-xs space-y-2">
          <Label>Selecione o professor</Label>
          {isLoadingTeachers ? (
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <Loader2 className="w-4 h-4 animate-spin" /> Carregando...
            </div>
          ) : (
            <Select onValueChange={(v) => setSelectedTeacherId(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Escolha um professor..." />
              </SelectTrigger>
              <SelectContent>
                {teachers.map((t) => (
                  <SelectItem key={t.uid} value={t.uid}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>
    )
  }

  const selectedTeacher = isAdmin
    ? teachers.find((t) => t.uid === selectedTeacherId)
    : null

  return (
    <div className="px-5 py-6 lg:px-8 lg:py-8 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-zinc-800 dark:text-zinc-100">
            {isAdmin && selectedTeacher ? `Turma — ${selectedTeacher.name}` : "Minha Turma"}
          </h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            Gerencie os titulares e o banco de reservas da turma.
          </p>
        </div>
        {isAdmin && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedTeacherId(undefined)}
            className="text-xs"
          >
            Trocar professor
          </Button>
        )}
      </div>

      {/* Class size */}
      <div className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card">
        <div className="w-9 h-9 rounded-lg bg-brand/10 flex items-center justify-center shrink-0">
          <UsersRound className="w-4 h-4 text-brand" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">Vagas na turma (titulares)</p>
          <p className="text-xs text-zinc-500">Número máximo de alunos titulares nesta turma.</p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={1}
            max={50}
            value={displayedClassSize}
            onChange={(e) => setClassSizeInput(e.target.value)}
            onBlur={handleClassSizeBlur}
            onKeyDown={(e) => e.key === "Enter" && handleClassSizeBlur()}
            className="w-16 text-center"
            disabled={isPending || isLoading}
          />
          <span className="text-xs text-zinc-400">vagas</span>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Titulares */}
          <div className="rounded-xl border border-border bg-card p-4">
            <SectionHeader
              icon={<Trophy className="w-4 h-4 text-amber-500" />}
              title="Titulares"
              count={titulares.length}
              limit={classSize}
              action={
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs gap-1"
                  onClick={() => openPicker("titular")}
                  disabled={isPending || titulares.length >= classSize}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Adicionar
                </Button>
              }
            />
            <div className="space-y-1.5">
              {titulares.length === 0 ? (
                <p className="text-center text-sm text-zinc-400 py-6">Nenhum titular ainda.</p>
              ) : (
                titulares.map((s) => (
                  <RosterCard
                    key={s.uid}
                    student={s}
                    onRemove={() => handleRemoveTitular(s.uid)}
                    isPending={isPending}
                  />
                ))
              )}
            </div>
            {titulares.length >= classSize && classSize > 0 && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 text-center">
                Turma cheia — aumente o número de vagas para adicionar mais.
              </p>
            )}
          </div>

          {/* Banco (reservas) */}
          <div className="rounded-xl border border-border bg-card p-4">
            <SectionHeader
              icon={<Shield className="w-4 h-4 text-blue-500" />}
              title="Banco (Reservas)"
              count={reservas.length}
              action={
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs gap-1"
                  onClick={() => openPicker("reserva")}
                  disabled={isPending}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Adicionar
                </Button>
              }
            />
            <div className="space-y-1.5">
              {reservas.length === 0 ? (
                <p className="text-center text-sm text-zinc-400 py-6">Nenhum reserva ainda.</p>
              ) : (
                reservas.map((s) => (
                  <RosterCard
                    key={s.uid}
                    student={s}
                    onRemove={() => handleRemoveReserva(s.uid)}
                    isPending={isPending}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Priority legend */}
      <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-border p-4 space-y-2">
        <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 mb-2">Ordem de prioridade nas aulas</p>
        {[
          { icon: <Trophy className="w-3.5 h-3.5 text-amber-500" />, label: "Titulares", desc: "Inscrição prioritária (janela T−24h)" },
          { icon: <Shield className="w-3.5 h-3.5 text-blue-500" />, label: "Banco (reservas)", desc: "Segunda prioridade (janela T−6h)" },
          { icon: <Users className="w-3.5 h-3.5 text-zinc-400" />, label: "Outros alunos", desc: "Alunos de outras turmas (janela T−6h)" },
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-2.5">
            <span className="w-5 h-5 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-[10px] font-bold text-zinc-500 shrink-0">
              {i + 1}
            </span>
            {item.icon}
            <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">{item.label}</span>
            <span className="text-xs text-zinc-400">— {item.desc}</span>
          </div>
        ))}
      </div>

      <StudentPickerModal
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        type={pickerType}
        allStudents={allStudents}
        excludeIds={pickerType === "titular" ? excludedFromTitular : excludedFromReserva}
        onAdd={handleAddStudent}
        isPending={isPending}
      />
    </div>
  )
}
