// src/features/users-management/components/users-details-modal.tsx
"use client";
import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LevelBadge } from "@/components/shared/level-badge";
import {
  Mail,
  Shield,
  Wallet,
  History,
  Info,
  ShieldOff,
  ShieldCheck,
  Pencil,
  Check,
  X,
} from "lucide-react";
import {
  useSetUserStatus,
  useUpdateLessonPrice,
  useUpdateUserRole,
  useUpdateStudentLevel,
  type UserListItem,
} from "../hooks/use-users";
import { useCurrentUser } from "@/hooks/use-current-user";
import { STUDENT_LEVELS } from "@/core/constants/professors";
import { formatCurrency } from "@/utils/formatters";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface UserDetailsModalProps {
  user: UserListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ROLE_LABEL: Record<string, string> = {
  STUDENT: "Aluno",
  TEACHER: "Professor",
  ADMIN: "Administrador",
};

export function UserDetailsModal({
  user,
  open,
  onOpenChange,
}: UserDetailsModalProps) {
  const { data: currentUser } = useCurrentUser();
  const { mutate: setStatus, isPending } = useSetUserStatus();
  const { mutate: updatePrice, isPending: isSavingPrice } =
    useUpdateLessonPrice();
  const { mutate: updateRole, isPending: isSavingRole } = useUpdateUserRole();
  const { mutate: updateLevel, isPending: isSavingLevel } =
    useUpdateStudentLevel();

  const [editingPrice, setEditingPrice] = useState(false);
  const [priceInput, setPriceInput] = useState("");

  const [editingRole, setEditingRole] = useState(false);
  const [roleInput, setRoleInput] = useState("");

  const [editingLevel, setEditingLevel] = useState(false);
  const [levelInput, setLevelInput] = useState("");

  if (!user) return null;

  const isBlocked = !user.isActive;

  function handleToggleStatus() {
    const next = !user!.isActive;
    setStatus(
      { uid: user!.uid, isActive: next },
      {
        onSuccess: () => {
          toast.success(
            next
              ? "Acesso reativado com sucesso."
              : "Acesso bloqueado com sucesso.",
          );
          onOpenChange(false);
        },
        onError: () => toast.error("Erro ao alterar o status do usuário."),
      },
    );
  }

  function handleStartEditRole() {
    setRoleInput(user!.role);
    setEditingRole(true);
  }

  function handleSaveRole() {
    updateRole(
      { uid: user!.uid, role: roleInput },
      {
        onSuccess: () => {
          toast.success("Perfil de acesso atualizado com sucesso.");
          setEditingRole(false);
          onOpenChange(false); // Optionally auto-close or leave open
        },
        onError: () => toast.error("Erro ao alterar perfil de acesso."),
      },
    );
  }

  function handleStartEditPrice() {
    setPriceInput(String(user!.lessonPrice ?? 0));
    setEditingPrice(true);
  }

  function handleSavePrice() {
    const value = parseFloat(priceInput);
    if (isNaN(value) || value < 0) {
      toast.error("Informe um valor válido (≥ 0).");
      return;
    }
    updatePrice(
      { uid: user!.uid, lessonPrice: value },
      {
        onSuccess: () => {
          toast.success("Preço da aula atualizado.");
          setEditingPrice(false);
        },
        onError: () => toast.error("Erro ao salvar o preço."),
      },
    );
  }

  function handleCancelEdit() {
    setEditingPrice(false);
    setPriceInput("");
  }

  function handleStartEditLevel() {
    setLevelInput(user!.level ?? "Iniciante");
    setEditingLevel(true);
  }

  function handleSaveLevel() {
    if (!currentUser) return;
    const previous = user!.level ?? "Iniciante";
    if (levelInput === previous) {
      setEditingLevel(false);
      return;
    }
    updateLevel(
      {
        studentId: user!.uid,
        previousLevel: previous,
        newLevel: levelInput,
        actorId: currentUser.uid,
        actorName: currentUser.name,
        studentName: user!.name,
      },
      {
        onSuccess: () => {
          toast.success("Nível do aluno atualizado.");
          setEditingLevel(false);
        },
        onError: () => toast.error("Erro ao atualizar o nível."),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-125 p-0 overflow-hidden border-none">
        <div className="bg-chart-5 p-8 text-white">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-chart-4 flex items-center justify-center text-2xl font-bold border-2 border-amber-800">
                {user.name.charAt(0)}
              </div>
              {isBlocked && (
                <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-red-500 border-2 border-white flex items-center justify-center">
                  <ShieldOff className="w-3 h-3 text-white" />
                </span>
              )}
            </div>
            <div>
              <DialogHeader>
                <DialogTitle className="text-2xl text-white flex items-center gap-2">
                  {user.name}
                </DialogTitle>
                <DialogDescription asChild>
                  <div className="flex items-center gap-2 mt-2 text-white/70 text-sm">
                    <Shield className="w-4 h-4 shrink-0" />

                    {editingRole ? (
                      <div className="flex items-center gap-2">
                        <Select value={roleInput} onValueChange={setRoleInput}>
                          <SelectTrigger className="h-7 w-32 bg-white/10 border-white/20 text-white text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="STUDENT">Aluno</SelectItem>
                            <SelectItem value="TEACHER">Professor</SelectItem>
                            <SelectItem value="ADMIN">Administrador</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={handleSaveRole}
                          disabled={isSavingRole}
                          className="h-7 w-7 bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-200 shrink-0"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setEditingRole(false)}
                          disabled={isSavingRole}
                          className="h-7 w-7 bg-red-500/20 hover:bg-red-500/40 text-red-200 shrink-0"
                        >
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span>{ROLE_LABEL[user.role] ?? user.role}</span>
                        <button
                          type="button"
                          onClick={handleStartEditRole}
                          className="text-white/50 hover:text-white transition-colors"
                          title="Mudar cargo do usuário"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {isBlocked && (
                      <span className="ml-1 text-[10px] font-bold text-red-200 bg-red-500/30 border border-red-400/30 rounded-full px-1.5 py-0.5 leading-none">
                        Bloqueado
                      </span>
                    )}
                  </div>
                </DialogDescription>
              </DialogHeader>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className={`p-3 rounded-lg bg-zinc-50 border border-zinc-100 ${(user.role === "ADMIN" || user.role === "TEACHER") ? "col-span-2" : "col-span-1"}`}>
              <div className="flex items-baseline gap-2">
                <Mail className="w-3.5 h-3.5" />
                <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">
                  E-mail
                </p>
              </div>
              <p className="text-sm font-medium mt-1 break-all">{user.email}</p>
            </div>
            {user.role !== "ADMIN" && user.role !== "TEACHER" && (
              <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-100">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-baseline gap-2">
                    <Info className="w-3.5 h-3.5" />
                    <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">
                      Nível
                    </p>
                  </div>
                  {!editingLevel && (
                    <button
                      type="button"
                      onClick={handleStartEditLevel}
                      className="flex items-center gap-1 text-xs text-brand hover:text-brand-dark transition-colors"
                    >
                      <Pencil className="w-3 h-3" />
                      Editar
                    </button>
                  )}
                </div>

                {editingLevel ? (
                  <div className="flex items-center gap-2 mt-1">
                    <Select value={levelInput} onValueChange={setLevelInput}>
                      <SelectTrigger className="h-7 flex-1 text-xs">
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
                      size="icon"
                      className="h-7 w-7 bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
                      disabled={isSavingLevel}
                      onClick={handleSaveLevel}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-7 w-7 shrink-0"
                      disabled={isSavingLevel}
                      onClick={() => setEditingLevel(false)}
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ) : (
                  <div className="mt-1">
                    {user.level ? (
                      <LevelBadge level={user.level} size="sm" />
                    ) : (
                      <span className="text-xs text-zinc-400">—</span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {user.role === "STUDENT" && (
            <div className="p-4 rounded-xl bg-brand-subtle/30 border border-brand/10 flex items-center gap-3">
              <Wallet className="w-5 h-5 text-brand-dark" />
              <div>
                <p className="text-[.8em] font-extrabold text-brand-dark/70 uppercase">
                  Saldo Atual
                </p>
                <p className="text-xl font-bold text-brand-dark">
                  {user.walletBalance ?? 0}{" "}
                  <span className="text-sm font-normal">Plays</span>
                </p>
              </div>
            </div>
          )}

          {user.role === "TEACHER" && (
            <div className="space-y-3">
              {/* Preço da aula */}
              <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">
                    Preço da Aula (Plays)
                  </p>
                  {!editingPrice && (
                    <button
                      type="button"
                      onClick={handleStartEditPrice}
                      className="flex items-center gap-1 text-xs text-brand hover:text-brand-dark transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Editar
                    </button>
                  )}
                </div>

                {editingPrice ? (
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={0}
                      step={0.5}
                      value={priceInput}
                      onChange={(e) => setPriceInput(e.target.value)}
                      className="h-8 text-sm w-32"
                      autoFocus
                    />
                    <Button
                      type="button"
                      size="icon"
                      className="h-8 w-8 bg-emerald-600 hover:bg-emerald-700 text-white"
                      disabled={isSavingPrice}
                      onClick={handleSavePrice}
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      className="h-8 w-8"
                      disabled={isSavingPrice}
                      onClick={handleCancelEdit}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <p className="text-xl font-bold text-zinc-900">
                    {(user.lessonPrice ?? 0).toFixed(2)}{" "}
                    <span className="text-sm font-normal text-zinc-500">
                      Plays / aula
                    </span>
                  </p>
                )}
              </div>

              {/* Saldo de ganhos */}
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center gap-3">
                <Wallet className="w-5 h-5 text-emerald-600" />
                <div>
                  <p className="text-[.8em] font-extrabold text-emerald-700/70 uppercase">
                    Saldo de Ganhos
                  </p>
                  <p className="text-xl font-bold text-emerald-700">
                    {formatCurrency(user.earningsBalance ?? 0)}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <p className="text-sm font-bold text-zinc-800 flex items-center gap-2">
              <History className="w-4 h-4" /> Últimas Atividades
            </p>
            <div className="text-xs text-zinc-500 italic py-2">
              Nenhuma atividade recente registrada para este usuário.
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Fechar
            </Button>
            <Button
              className={
                isBlocked
                  ? "flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                  : "flex-1 bg-red-600 hover:bg-red-700 text-white"
              }
              disabled={isPending}
              onClick={handleToggleStatus}
            >
              {isPending ? (
                "Aguarde..."
              ) : isBlocked ? (
                <>
                  <ShieldCheck className="w-4 h-4 mr-2" /> Desbloquear Acesso
                </>
              ) : (
                <>
                  <ShieldOff className="w-4 h-4 mr-2" /> Bloquear Acesso
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
