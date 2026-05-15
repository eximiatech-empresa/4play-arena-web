"use client"

import { useState } from "react"
import { PackageOpen, Plus, Pencil, Trash2, Sparkles, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { formatCurrency } from "@/utils/formatters"
import {
  usePlansAdmin,
  useCreatePlan,
  useUpdatePlan,
  useDeletePlan,
  usePlayPackages,
  useCreatePlayPackage,
  useUpdatePlayPackage,
  useDeletePlayPackage,
} from "../hooks/use-admin-plans"
import { PlanFormModal } from "./plan-form-modal"
import { PackageFormModal } from "./package-form-modal"
import { DeleteConfirmDialog } from "./delete-confirm-dialog"
import type { PlanFormData, PlayPackageFormData } from "../schemas"
import type { PlanConfig } from "@/core/constants/plan-pricing"
import type { PlayPackage } from "@/lib/firebase/play-packages"

function formatPlayValue(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  }).format(value)
}

function SectionHeader({
  title,
  subtitle,
  onNew,
  label,
}: {
  title: string
  subtitle: string
  onNew: () => void
  label: string
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        <p className="text-xs text-zinc-400 mt-0.5">{subtitle}</p>
      </div>
      <Button
        onClick={onNew}
        size="sm"
        className="bg-brand hover:bg-brand-dark text-white shrink-0"
      >
        <Plus className="w-4 h-4 mr-1.5" />
        {label}
      </Button>
    </div>
  )
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <p className="text-sm text-zinc-400">{label}</p>
    </div>
  )
}

export function AdminPlansContent() {
  const { data: plans = [], isLoading: plansLoading } = usePlansAdmin()
  const { data: packages = [], isLoading: packagesLoading } = usePlayPackages()

  const createPlanMutation = useCreatePlan()
  const updatePlanMutation = useUpdatePlan()
  const deletePlanMutation = useDeletePlan()
  const createPackageMutation = useCreatePlayPackage()
  const updatePackageMutation = useUpdatePlayPackage()
  const deletePackageMutation = useDeletePlayPackage()

  const [planModal, setPlanModal] = useState<{ open: boolean; initial?: PlanConfig }>({
    open: false,
  })
  const [packageModal, setPackageModal] = useState<{
    open: boolean
    initial?: PlayPackage
  }>({ open: false })
  const [deletePlan, setDeletePlan] = useState<PlanConfig | null>(null)
  const [deletePackage, setDeletePackage] = useState<PlayPackage | null>(null)

  function handleSubmitPlan(data: PlanFormData) {
    const playValue = data.priceInCents / 100 / data.totalPlays
    if (planModal.initial) {
      updatePlanMutation.mutate(
        { id: data.id, data: { ...data, playValue } },
        { onSuccess: () => setPlanModal({ open: false }) },
      )
    } else {
      createPlanMutation.mutate(
        { ...data, playValue },
        { onSuccess: () => setPlanModal({ open: false }) },
      )
    }
  }

  function handleSubmitPackage(data: PlayPackageFormData) {
    if (packageModal.initial) {
      updatePackageMutation.mutate(
        { id: data.id, data },
        { onSuccess: () => setPackageModal({ open: false }) },
      )
    } else {
      createPackageMutation.mutate(data, {
        onSuccess: () => setPackageModal({ open: false }),
      })
    }
  }

  return (
    <div className="px-5 py-6 lg:px-8 lg:py-8 max-w-6xl mx-auto space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
          <PackageOpen className="w-6 h-6 text-brand" />
          Gestão de Planos
        </h1>
        <p className="text-sm text-zinc-500">
          Gerencie planos de assinatura e pacotes extras de Plays da plataforma.
        </p>
      </div>

      {/* Planos de assinatura */}
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <SectionHeader
            title="Planos de Assinatura"
            subtitle="Planos que os alunos adquirem para obter Plays e acesso às aulas"
            onNew={() => setPlanModal({ open: true })}
            label="Novo Plano"
          />
        </div>
        <div className="p-6">
          {plansLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
            </div>
          ) : plans.length === 0 ? (
            <EmptyState label="Nenhum plano cadastrado. Crie o primeiro." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {plans.map((plan) => {
                const playValue = plan.playValue ?? plan.priceInCents / 100 / plan.totalPlays
                return (
                  <div
                    key={plan.id}
                    className={cn(
                      "relative rounded-xl border-2 p-5",
                      plan.popular ? "border-brand bg-brand-subtle/50" : "border-border",
                    )}
                  >
                    {plan.popular && (
                      <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                        <span className="inline-flex items-center gap-1 bg-brand text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                          <Sparkles className="w-3 h-3" />
                          Popular
                        </span>
                      </div>
                    )}

                    <div className="text-center mb-4">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">
                        {plan.id}
                      </p>
                      <p className="text-sm font-semibold text-foreground">{plan.label}</p>
                      <div className="mt-2 flex items-end justify-center gap-1">
                        <span className={cn("text-3xl font-bold tabular-nums", plan.popular ? "text-chart-2" : "text-foreground")}>
                          {plan.totalPlays}
                        </span>
                        <span className="text-sm font-medium text-zinc-400 mb-0.5">Plays</span>
                      </div>
                      <p className={cn("text-lg font-bold mt-1", plan.popular ? "text-chart-2" : "text-foreground")}>
                        {formatCurrency(plan.priceInCents / 100)}
                      </p>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        Validade {plan.validityDays} dias
                      </p>
                      <p className={cn(
                        "text-[11px] font-semibold mt-1.5 px-2 py-0.5 rounded-full inline-block",
                        plan.popular ? "bg-brand-subtle text-brand-dark" : "bg-muted text-zinc-500",
                      )}>
                        R$ {formatPlayValue(playValue)}/Play
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-8 text-xs"
                        onClick={() => setPlanModal({ open: true, initial: plan })}
                      >
                        <Pencil className="w-3 h-3 mr-1.5" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
                        onClick={() => setDeletePlan(plan)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Pacotes extras */}
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <SectionHeader
            title="Pacotes Extras"
            subtitle="Plays avulsos que o aluno pode comprar para adicionar saldo sem renovar o plano"
            onNew={() => setPackageModal({ open: true })}
            label="Novo Pacote"
          />
        </div>
        <div className="p-6">
          {packagesLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
            </div>
          ) : packages.length === 0 ? (
            <EmptyState label="Nenhum pacote cadastrado. Crie o primeiro." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {packages.map((pkg) => {
                const playValue = pkg.priceInCents / 100 / pkg.plays
                return (
                  <div
                    key={pkg.id}
                    className={cn(
                      "relative rounded-xl border-2 p-5",
                      pkg.popular ? "border-brand bg-brand-subtle/50" : "border-border",
                    )}
                  >
                    {pkg.popular && (
                      <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                        <span className="inline-flex items-center gap-1 bg-brand text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                          <Sparkles className="w-3 h-3" />
                          Popular
                        </span>
                      </div>
                    )}

                    <div className="text-center mb-4">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">
                        {pkg.id}
                      </p>
                      <p className="text-sm font-semibold text-foreground">{pkg.label}</p>
                      <div className="mt-2 flex items-end justify-center gap-1">
                        <span className={cn("text-3xl font-bold tabular-nums", pkg.popular ? "text-chart-2" : "text-foreground")}>
                          {pkg.plays}
                        </span>
                        <span className="text-sm font-medium text-zinc-400 mb-0.5">Plays</span>
                      </div>
                      <p className={cn("text-lg font-bold mt-1", pkg.popular ? "text-chart-2" : "text-foreground")}>
                        {formatCurrency(pkg.priceInCents / 100)}
                      </p>
                      <p className={cn(
                        "text-[11px] font-semibold mt-1.5 px-2 py-0.5 rounded-full inline-block",
                        pkg.popular ? "bg-brand-subtle text-brand-dark" : "bg-muted text-zinc-500",
                      )}>
                        R$ {formatPlayValue(playValue)}/Play
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-8 text-xs"
                        onClick={() => setPackageModal({ open: true, initial: pkg })}
                      >
                        <Pencil className="w-3 h-3 mr-1.5" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
                        onClick={() => setDeletePackage(pkg)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <PlanFormModal
        open={planModal.open}
        onOpenChange={(open) => setPlanModal((s) => ({ ...s, open }))}
        initial={planModal.initial}
        existingIds={plans
          .map((p) => p.id)
          .filter((id) => id !== planModal.initial?.id)}
        onSubmit={handleSubmitPlan}
        isPending={createPlanMutation.isPending || updatePlanMutation.isPending}
      />

      <PackageFormModal
        open={packageModal.open}
        onOpenChange={(open) => setPackageModal((s) => ({ ...s, open }))}
        initial={packageModal.initial}
        existingIds={packages
          .map((p) => p.id)
          .filter((id) => id !== packageModal.initial?.id)}
        onSubmit={handleSubmitPackage}
        isPending={createPackageMutation.isPending || updatePackageMutation.isPending}
      />

      <DeleteConfirmDialog
        open={!!deletePlan}
        onOpenChange={(open) => !open && setDeletePlan(null)}
        title="Excluir plano"
        description={`Tem certeza que deseja excluir o plano "${deletePlan?.label}"? Esta ação não pode ser desfeita.`}
        onConfirm={() => {
          if (!deletePlan) return
          deletePlanMutation.mutate(deletePlan.id, {
            onSuccess: () => setDeletePlan(null),
          })
        }}
        isPending={deletePlanMutation.isPending}
      />

      <DeleteConfirmDialog
        open={!!deletePackage}
        onOpenChange={(open) => !open && setDeletePackage(null)}
        title="Excluir pacote"
        description={`Tem certeza que deseja excluir o pacote "${deletePackage?.label}"? Esta ação não pode ser desfeita.`}
        onConfirm={() => {
          if (!deletePackage) return
          deletePackageMutation.mutate(deletePackage.id, {
            onSuccess: () => setDeletePackage(null),
          })
        }}
        isPending={deletePackageMutation.isPending}
      />
    </div>
  )
}
