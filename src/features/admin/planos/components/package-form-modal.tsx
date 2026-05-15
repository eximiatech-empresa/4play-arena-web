"use client"

import { useEffect, useRef } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PlayPackageFormSchema, type PlayPackageFormData } from "../schemas"
import { CurrencyInput } from "./currency-input"
import { validatePackageForm } from "@/core/usecases/admin-plans/validate-package-form"
import type { PlayPackage } from "@/lib/firebase/play-packages"

function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
}

interface PackageFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initial?: PlayPackage
  existingIds: string[]
  onSubmit: (data: PlayPackageFormData) => void
  isPending: boolean
}

export function PackageFormModal({
  open,
  onOpenChange,
  initial,
  existingIds,
  onSubmit,
  isPending,
}: PackageFormModalProps) {
  const isEdit = !!initial
  const idTouched = useRef(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    reset,
    trigger,
    formState: { errors, isValid },
  } = useForm<PlayPackageFormData>({
    resolver: zodResolver(PlayPackageFormSchema),
    mode: "onChange",
    defaultValues: initial
      ? {
          id: initial.id,
          label: initial.label,
          plays: initial.plays,
          priceInCents: initial.priceInCents,
          popular: initial.popular ?? false,
        }
      : { popular: false },
  })

  useEffect(() => {
    if (open) {
      idTouched.current = false
      reset(
        initial
          ? {
              id: initial.id,
              label: initial.label,
              plays: initial.plays,
              priceInCents: initial.priceInCents,
              popular: initial.popular ?? false,
            }
          : { popular: false },
      )
      if (isEdit) trigger()
    }
  }, [open, initial, isEdit, reset, trigger])

  const formValues = watch()

  useEffect(() => {
    if (!isEdit && !idTouched.current && formValues.label !== undefined) {
      setValue("id", slugify(formValues.label), { shouldValidate: true })
    }
  }, [formValues.label, isEdit, setValue])

  const issues = validatePackageForm({
    ...formValues,
    existingIds,
    isEdit,
  })

  const isSubmitDisabled = !isValid || isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar Pacote" : "Novo Pacote Extra"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="pkg-label">Nome exibido</Label>
              <Input id="pkg-label" placeholder="ex: Pacote Básico" {...register("label")} />
              {errors.label && (
                <p className="text-xs text-destructive">{errors.label.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pkg-id">
                ID (slug)
                {!isEdit && (
                  <span className="ml-1.5 text-[10px] font-normal text-zinc-400">auto-sugerido</span>
                )}
              </Label>
              <Input
                id="pkg-id"
                placeholder="ex: pkg-20"
                disabled={isEdit}
                {...register("id", {
                  onChange: () => { idTouched.current = true },
                  validate: (value) =>
                    isEdit || !existingIds.includes(value) || "Este ID já está em uso",
                })}
              />
              {errors.id && (
                <p className="text-xs text-destructive">{errors.id.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="pkg-plays">Plays</Label>
              <Input
                id="pkg-plays"
                type="number"
                placeholder="20"
                {...register("plays", { valueAsNumber: true })}
              />
              {errors.plays && (
                <p className="text-xs text-destructive">{errors.plays.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pkg-price">Preço</Label>
              <Controller
                name="priceInCents"
                control={control}
                render={({ field }) => (
                  <CurrencyInput
                    id="pkg-price"
                    value={field.value ?? 0}
                    onChange={field.onChange}
                  />
                )}
              />
              {errors.priceInCents && (
                <p className="text-xs text-destructive">{errors.priceInCents.message}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="pkg-popular"
              type="checkbox"
              className="w-4 h-4 accent-brand"
              {...register("popular")}
            />
            <Label htmlFor="pkg-popular" className="cursor-pointer">
              Destacar como Popular
            </Label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>

            <TooltipProvider>
              <Tooltip open={isSubmitDisabled && issues.length > 0 ? undefined : false}>
                <TooltipTrigger asChild>
                  <span className="inline-block">
                    <Button
                      type="submit"
                      className="bg-brand hover:bg-brand-dark text-white"
                      disabled={isSubmitDisabled}
                    >
                      {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      {isEdit ? "Salvar" : "Criar"}
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  className="max-w-[260px] p-0 overflow-hidden border-0"
                >
                  <div className="bg-zinc-900 rounded-md px-3.5 py-3 space-y-2">
                    <p className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wide">
                      Pendente
                    </p>
                    <ul className="space-y-1.5">
                      {issues.map((issue, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-zinc-100">
                          <span className="text-red-400 shrink-0 mt-px">•</span>
                          {issue.message}
                        </li>
                      ))}
                    </ul>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
