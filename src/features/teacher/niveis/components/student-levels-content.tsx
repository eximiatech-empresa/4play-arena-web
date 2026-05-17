"use client"

import { useState, useMemo } from "react"
import {
  Search,
  ChevronRight,
  Loader2,
  ArrowLeft,
  History,
  TrendingUp,
  TrendingDown,
  UserCircle,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { LevelBadge } from "@/components/shared/level-badge"
import { cn } from "@/lib/utils"
import { useCurrentUser } from "@/hooks/use-current-user"
import { useStudents, useStudentAuditLogs, useUpdateLevel } from "../hooks/use-student-levels"
import { STUDENT_LEVELS } from "@/core/constants/professors"
import type { UserListItem } from "@/lib/firebase/firestore"
import type { AuditLogDocument } from "@/lib/firebase/audit-logs"

// ─── Student list item ────────────────────────────────────────────────────────

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase()
}

interface StudentRowProps {
  student: UserListItem
  isSelected: boolean
  onClick: () => void
}

function StudentRow({ student, isSelected, onClick }: StudentRowProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-colors",
        isSelected
          ? "bg-brand/10 border border-brand/20"
          : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50 border border-transparent",
      )}
    >
      <div className="w-9 h-9 rounded-full bg-brand-dark flex items-center justify-center shrink-0">
        <span className="text-xs font-bold text-white">{initials(student.name)}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100 truncate">{student.name}</p>
        <p className="text-xs text-zinc-400 truncate">{student.email}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {student.level && <LevelBadge level={student.level} size="xs" />}
        <ChevronRight className="w-4 h-4 text-zinc-300" />
      </div>
    </button>
  )
}

// ─── Audit log entry ──────────────────────────────────────────────────────────

function levelIndex(level: string) {
  return STUDENT_LEVELS.indexOf(level as (typeof STUDENT_LEVELS)[number])
}

function AuditEntry({ log }: { log: AuditLogDocument }) {
  const wasUpgrade = levelIndex(log.newValue) > levelIndex(log.previousValue)
  const date = new Date(log.createdAt)

  return (
    <div className="flex items-start gap-3">
      <div
        className={cn(
          "w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5",
          wasUpgrade ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-amber-100 dark:bg-amber-900/30",
        )}
      >
        {wasUpgrade ? (
          <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
        ) : (
          <TrendingDown className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-zinc-700 dark:text-zinc-200">
          <span className="font-medium">{log.previousValue}</span>
          <span className="text-zinc-400 mx-1.5">→</span>
          <span className="font-medium">{log.newValue}</span>
        </p>
        <p className="text-xs text-zinc-400 mt-0.5">
          Por <span className="font-medium text-zinc-500 dark:text-zinc-300">{log.actorName}</span>
          {" · "}
          {formatDistanceToNow(date, { locale: ptBR, addSuffix: true })}
        </p>
      </div>
    </div>
  )
}

// ─── Detail panel ─────────────────────────────────────────────────────────────

interface DetailPanelProps {
  student: UserListItem
  onBack: () => void
  actorId: string
  actorName: string
}

function DetailPanel({ student, onBack, actorId, actorName }: DetailPanelProps) {
  const [selectedLevel, setSelectedLevel] = useState(student.level ?? "Iniciante")
  const { data: logs = [], isLoading: isLoadingLogs } = useStudentAuditLogs(student.uid)
  const { mutate: updateLevel, isPending } = useUpdateLevel()

  const currentLevel = student.level ?? "Iniciante"
  const hasChange = selectedLevel !== currentLevel

  function handleSave() {
    if (!hasChange) return
    updateLevel({
      studentId: student.uid,
      previousLevel: currentLevel,
      newLevel: selectedLevel,
      actorId,
      actorName,
      studentName: student.name,
    })
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={onBack}
          className="lg:hidden p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-zinc-500" />
        </button>
        <div className="w-10 h-10 rounded-full bg-brand-dark flex items-center justify-center shrink-0">
          <span className="text-sm font-bold text-white">{initials(student.name)}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-zinc-800 dark:text-zinc-100 truncate">{student.name}</p>
          <p className="text-xs text-zinc-400 truncate">{student.email}</p>
        </div>
      </div>

      {/* Current level */}
      <div className="rounded-xl border border-border bg-muted/50 p-4 mb-4">
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-2">Nível atual</p>
        <LevelBadge level={currentLevel} size="sm" />
      </div>

      {/* Level editor */}
      <div className="space-y-3 mb-6">
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Alterar nível</p>
        <Select value={selectedLevel} onValueChange={setSelectedLevel} disabled={isPending}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STUDENT_LEVELS.map((lvl) => (
              <SelectItem key={lvl} value={lvl}>
                {lvl}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          onClick={handleSave}
          disabled={!hasChange || isPending}
          className="w-full bg-brand hover:bg-brand-dark text-white"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar alteração"}
        </Button>
      </div>

      {/* Audit log */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex items-center gap-2 mb-3">
          <History className="w-4 h-4 text-zinc-400" />
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Histórico de níveis</p>
        </div>
        {isLoadingLogs ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-zinc-300" />
          </div>
        ) : logs.length === 0 ? (
          <p className="text-sm text-zinc-400 text-center py-8">Nenhuma alteração registrada.</p>
        ) : (
          <div className="space-y-4">
            {logs.map((log) => (
              <AuditEntry key={log.id} log={log} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main content ─────────────────────────────────────────────────────────────

export function StudentLevelsContent() {
  const { data: currentUser } = useCurrentUser()
  const { data: students = [], isLoading } = useStudents()
  const [search, setSearch] = useState("")
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined)

  const filtered = useMemo(() => {
    const term = search.toLowerCase()
    return students.filter(
      (s) =>
        term === "" ||
        s.name.toLowerCase().includes(term) ||
        s.email.toLowerCase().includes(term),
    )
  }, [students, search])

  const selected = students.find((s) => s.uid === selectedId)

  const actorId = currentUser?.uid ?? ""
  const actorName = currentUser?.name ?? "Professor"

  return (
    <div className="px-5 py-6 lg:px-8 lg:py-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-zinc-800 dark:text-zinc-100">Níveis dos Alunos</h1>
        <p className="text-sm text-zinc-500 mt-0.5">
          Gerencie o nível de cada aluno e consulte o histórico de alterações.
        </p>
      </div>

      <div className="flex gap-6 h-[calc(100vh-220px)]">
        {/* ── Student list ── */}
        <div
          className={cn(
            "flex flex-col min-w-0",
            selected ? "hidden lg:flex lg:w-80 lg:shrink-0" : "flex-1",
          )}
        >
          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <Input
              placeholder="Buscar aluno..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto space-y-1 pr-1">
            {isLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-zinc-300" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-16 text-zinc-400">
                <UserCircle className="w-10 h-10" />
                <p className="text-sm">{search ? "Nenhum aluno encontrado." : "Nenhum aluno ativo."}</p>
              </div>
            ) : (
              filtered.map((s) => (
                <StudentRow
                  key={s.uid}
                  student={s}
                  isSelected={s.uid === selectedId}
                  onClick={() => setSelectedId(s.uid)}
                />
              ))
            )}
          </div>

          {!isLoading && filtered.length > 0 && (
            <p className="text-xs text-zinc-400 text-center mt-2 shrink-0">
              {filtered.length} aluno{filtered.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        {/* ── Detail panel ── */}
        {selected ? (
          <div className="flex-1 min-w-0 rounded-2xl border border-border bg-card p-5 overflow-y-auto">
            <DetailPanel
              key={selected.uid}
              student={selected}
              onBack={() => setSelectedId(undefined)}
              actorId={actorId}
              actorName={actorName}
            />
          </div>
        ) : (
          <div className="hidden lg:flex flex-1 items-center justify-center rounded-2xl border border-dashed border-border text-zinc-300">
            <div className="text-center space-y-2">
              <UserCircle className="w-10 h-10 mx-auto" />
              <p className="text-sm">Selecione um aluno para ver os detalhes</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
