"use client"

import { useEffect, useState } from "react"
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { ShieldAlert, RotateCcw, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useCurrentUser } from "@/hooks/use-current-user"
import { UserRoleSchema, type UserRole } from "@/core/entities/user"
import { db } from "@/lib/firebase/firestore"
import { getFirebaseAuth } from "@/lib/firebase/auth"

const ROLE_COLORS: Record<UserRole, string> = {
  ADMIN: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  TEACHER: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  STUDENT: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
}

interface TargetUserInfo {
  uid: string
  role?: UserRole
  name?: string
  email?: string
  exists: boolean
}

export function RoleSwitcherTab() {
  const [authUser, setAuthUser] = useState<FirebaseUser | null | undefined>(undefined)
  const { data: firestoreUser } = useCurrentUser()
  const queryClient = useQueryClient()

  const [targetUid, setTargetUid] = useState("")
  const [targetInfo, setTargetInfo] = useState<TargetUserInfo | null>(null)
  const [lookingUp, setLookingUp] = useState(false)

  const [selectedRole, setSelectedRole] = useState<UserRole | "">("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    return onAuthStateChanged(getFirebaseAuth(), (user) => {
      setAuthUser(user)
      if (user) setTargetUid(user.uid)
    })
  }, [])

  // When targetUid is reset to the current auth user, sync targetInfo from firestoreUser
  useEffect(() => {
    if (authUser && targetUid === authUser.uid) {
      if (firestoreUser) {
        setTargetInfo({
          uid: firestoreUser.uid,
          role: firestoreUser.role,
          name: firestoreUser.name,
          email: firestoreUser.email,
          exists: true,
        })
      } else {
        setTargetInfo({ uid: authUser.uid, email: authUser.email ?? undefined, exists: false })
      }
    }
  }, [authUser, firestoreUser, targetUid])

  async function handleLookup() {
    const uid = targetUid.trim()
    if (!uid) return
    setLookingUp(true)
    setSelectedRole("")
    try {
      const snap = await getDoc(doc(db, "users", uid))
      if (!snap.exists()) {
        setTargetInfo({ uid, exists: false })
        toast.info("Documento não encontrado para esse UID.")
      } else {
        const d = snap.data()
        setTargetInfo({
          uid,
          role: d.role as UserRole,
          name: d.name,
          email: d.email,
          exists: true,
        })
      }
    } catch (err) {
      toast.error("Erro ao buscar UID: " + String(err))
    } finally {
      setLookingUp(false)
    }
  }

  function handleResetToSelf() {
    if (!authUser) return
    setTargetUid(authUser.uid)
    setSelectedRole("")
  }

  async function handleSave() {
    const uid = targetUid.trim()
    if (!uid || !selectedRole) return
    setSaving(true)
    try {
      await setDoc(doc(db, "users", uid), { role: selectedRole }, { merge: true })
      if (authUser && uid === authUser.uid) {
        await queryClient.invalidateQueries({ queryKey: ["currentUser"] })
      }
      setTargetInfo((prev) => prev ? { ...prev, role: selectedRole, exists: true } : prev)
      toast.success(`Role de "${uid.slice(0, 8)}…" alterada para ${selectedRole}`)
      setSelectedRole("")
    } catch (err) {
      toast.error("Erro ao salvar: " + String(err))
    } finally {
      setSaving(false)
    }
  }

  if (authUser === undefined) {
    return (
      <div className="p-6 text-xs text-muted-foreground font-mono">
        Verificando autenticação...
      </div>
    )
  }

  if (authUser === null) {
    return (
      <div className="p-6 text-xs text-muted-foreground font-mono">
        Nenhum usuário autenticado. Faça login para usar esta aba.
      </div>
    )
  }

  const isTargetingSelf = targetUid.trim() === authUser.uid
  const currentRole = targetInfo?.role

  return (
    <div className="p-5 space-y-5 overflow-y-auto h-full">

      {/* Target UID */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-foreground">UID alvo</p>
          {!isTargetingSelf && (
            <button
              onClick={handleResetToSelf}
              className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
            >
              <RotateCcw size={10} />
              voltar para meu UID
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <Input
            value={targetUid}
            onChange={(e) => setTargetUid(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLookup()}
            placeholder="UID do usuário..."
            className="h-8 text-xs font-mono flex-1"
          />
          <Button
            size="sm"
            variant="outline"
            className="h-8 px-3 shrink-0"
            onClick={handleLookup}
            disabled={!targetUid.trim() || lookingUp}
          >
            <Search size={13} />
          </Button>
        </div>
        {!isTargetingSelf && (
          <p className="text-[10px] text-violet-500 font-mono">
            operando em UID externo
          </p>
        )}
      </div>

      <hr className="border-border" />

      {/* Target info */}
      {targetInfo && (
        <div className="space-y-2.5">
          <Row label="UID">
            <code className="text-xs bg-muted px-2 py-1 rounded font-mono break-all">
              {targetInfo.uid}
            </code>
          </Row>
          {targetInfo.email && (
            <Row label="Email">
              <span className="text-xs font-mono">{targetInfo.email}</span>
            </Row>
          )}
          {targetInfo.name && (
            <Row label="Nome">
              <span className="text-xs font-mono">{targetInfo.name}</span>
            </Row>
          )}
          <Row label="Firestore">
            {targetInfo.exists ? (
              <span className="text-xs text-green-600 dark:text-green-400 font-mono">
                documento encontrado
              </span>
            ) : (
              <span className="text-xs text-yellow-600 dark:text-yellow-400 font-mono">
                documento não encontrado
              </span>
            )}
          </Row>
          <Row label="Role atual">
            {currentRole ? (
              <span
                className={cn(
                  "inline-block px-2 py-0.5 rounded text-xs font-bold tracking-wide",
                  ROLE_COLORS[currentRole],
                )}
              >
                {currentRole}
              </span>
            ) : (
              <span className="text-xs text-muted-foreground font-mono">—</span>
            )}
          </Row>
        </div>
      )}

      <hr className="border-border" />

      {/* Role selector */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-foreground">Alterar Role</p>
        <Select
          value={selectedRole}
          onValueChange={(v) => setSelectedRole(v as UserRole)}
        >
          <SelectTrigger className="w-52 h-8 text-xs">
            <SelectValue placeholder="Selecionar nova role..." />
          </SelectTrigger>
          <SelectContent className="z-[10000]">
            {UserRoleSchema.options.map((role) => (
              <SelectItem key={role} value={role} className="text-xs">
                {role}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          size="sm"
          className="h-7 text-xs"
          onClick={handleSave}
          disabled={!targetUid.trim() || !selectedRole || selectedRole === currentRole || saving}
        >
          {saving ? "Salvando..." : "Salvar Role"}
        </Button>
      </div>

      <div className="flex items-start gap-2 rounded-md border border-yellow-200 bg-yellow-50 dark:border-yellow-900/50 dark:bg-yellow-900/10 p-3">
        <ShieldAlert size={14} className="text-yellow-600 dark:text-yellow-500 mt-0.5 shrink-0" />
        <p className="text-xs text-yellow-700 dark:text-yellow-400 leading-relaxed">
          Trocar a role pode deixar o documento Firestore em estado inconsistente
          (campos ausentes). Use apenas para testes locais.
        </p>
      </div>
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="w-24 shrink-0 text-xs text-muted-foreground pt-0.5">{label}</span>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  )
}
