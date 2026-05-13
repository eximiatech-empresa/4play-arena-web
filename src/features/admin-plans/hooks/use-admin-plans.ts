"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  getPlans,
  createPlan,
  updatePlan,
  deletePlan,
} from "@/lib/firebase/plans"
import {
  getPlayPackages,
  createPlayPackage,
  updatePlayPackage,
  deletePlayPackage,
  type PlayPackage,
} from "@/lib/firebase/play-packages"
import type { PlanConfig } from "@/core/constants/plan-pricing"

export const ADMIN_PLANS_KEY = ["admin-plans"] as const
export const PLAY_PACKAGES_KEY = ["play-packages"] as const

export function usePlansAdmin() {
  return useQuery({
    queryKey: ADMIN_PLANS_KEY,
    queryFn: getPlans,
    staleTime: 2 * 60 * 1000,
  })
}

export function useCreatePlan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (plan: PlanConfig) => createPlan(plan),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_PLANS_KEY })
      queryClient.invalidateQueries({ queryKey: ["plans"] })
      toast.success("Plano criado com sucesso")
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Erro ao criar plano")
    },
  })
}

export function useUpdatePlan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PlanConfig> }) =>
      updatePlan(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_PLANS_KEY })
      queryClient.invalidateQueries({ queryKey: ["plans"] })
      toast.success("Plano atualizado")
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Erro ao atualizar plano")
    },
  })
}

export function useDeletePlan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deletePlan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_PLANS_KEY })
      queryClient.invalidateQueries({ queryKey: ["plans"] })
      toast.success("Plano excluído")
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Erro ao excluir plano")
    },
  })
}

export function usePlayPackages() {
  return useQuery({
    queryKey: PLAY_PACKAGES_KEY,
    queryFn: getPlayPackages,
    staleTime: 2 * 60 * 1000,
  })
}

export function useCreatePlayPackage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (pkg: PlayPackage) => createPlayPackage(pkg),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PLAY_PACKAGES_KEY })
      toast.success("Pacote criado com sucesso")
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Erro ao criar pacote")
    },
  })
}

export function useUpdatePlayPackage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PlayPackage> }) =>
      updatePlayPackage(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PLAY_PACKAGES_KEY })
      toast.success("Pacote atualizado")
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Erro ao atualizar pacote")
    },
  })
}

export function useDeletePlayPackage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deletePlayPackage(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PLAY_PACKAGES_KEY })
      toast.success("Pacote excluído")
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Erro ao excluir pacote")
    },
  })
}
