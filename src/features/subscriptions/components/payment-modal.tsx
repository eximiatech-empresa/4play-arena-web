"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useQueryClient } from "@tanstack/react-query"
import { Loader2, Lock, CreditCard } from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { getFirebaseAuth } from "@/lib/firebase/auth"
import { processPlanPurchase } from "@/lib/firebase/transactions"
import { createSubscription } from "@/lib/firebase/subscription"
import { PLAN_MULTIPLIERS } from "@/core/math/consumption"
import { formatCurrency } from "@/utils/formatters"
import type { Plan } from "@/core/entities/wallet"

// ─── Schema ───────────────────────────────────────────────────────────────────

const cardSchema = z.object({
  type: z.enum(["debit", "credit"]),
  number: z
    .string()
    .regex(/^(\d{4} ){3}\d{4}$/, "Número do cartão inválido"),
  name: z.string().min(3, "Nome inválido"),
  expiry: z
    .string()
    .regex(/^(0[1-9]|1[0-2])\/\d{2}$/, "Use o formato MM/AA"),
  cvv: z.string().regex(/^\d{3,4}$/, "CVV inválido"),
})

type CardForm = z.infer<typeof cardSchema>

// ─── Helpers ──────────────────────────────────────────────────────────────────

function detectBrand(raw: string): string {
  const n = raw.replace(/\s/g, "")
  if (/^4/.test(n)) return "visa"
  if (/^5[1-5]/.test(n) || /^2[2-7]/.test(n)) return "mastercard"
  if (/^636/.test(n) || /^6550/.test(n)) return "elo"
  if (/^3[47]/.test(n)) return "amex"
  return "unknown"
}

const BRAND_LABEL: Record<string, string> = {
  visa: "Visa",
  mastercard: "Mastercard",
  elo: "Elo",
  amex: "Amex",
  unknown: "",
}

function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 16)
  return digits.replace(/(.{4})/g, "$1 ").trim()
}

function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 4)
  if (digits.length > 2) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  return digits
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface PaymentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  plan: { id: Plan; label: string; price: number; hours: number; days: number }
  currentBalance: number
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PaymentModal({ open, onOpenChange, plan, currentBalance }: PaymentModalProps) {
  const queryClient = useQueryClient()
  const [isPaying, setIsPaying] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CardForm>({
    resolver: zodResolver(cardSchema),
    defaultValues: { type: "credit" },
  })

  const cardType = watch("type")
  const cardNumber = watch("number") ?? ""
  const brand = detectBrand(cardNumber)
  const brandLabel = BRAND_LABEL[brand]

  async function onSubmit(data: CardForm) {
    const fbUser = getFirebaseAuth().currentUser
    if (!fbUser) {
      toast.error("Sessão expirada. Faça login novamente.")
      return
    }

    setIsPaying(true)
    try {
      const playsAmount = plan.hours * PLAN_MULTIPLIERS[plan.id]
      const now = new Date().toISOString()
      const periodEnd = new Date(Date.now() + plan.days * 24 * 60 * 60 * 1000).toISOString()

      await processPlanPurchase(
        fbUser.uid,
        plan.id,
        playsAmount,
        plan.days,
        currentBalance,
      )

      await createSubscription({
        studentId: fbUser.uid,
        planId: plan.id,
        status: "active",
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: false,
        provider: "pagarme_mock",
        autoRenew: data.type === "credit",
        cardBrand: detectBrand(data.number),
        cardLast4: data.number.replace(/\s/g, "").slice(-4),
        startedAt: now,
        nextBillingDate: periodEnd,
      })

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["wallet"] }),
        queryClient.invalidateQueries({ queryKey: ["currentUser"] }),
        queryClient.invalidateQueries({ queryKey: ["subscription", "active", fbUser.uid] }),
      ])

      toast.success(`Plano ${plan.label} ativado com sucesso!`)
      reset()
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao processar pagamento.")
    } finally {
      setIsPaying(false)
    }
  }

  function handleClose(nextOpen: boolean) {
    if (isPaying) return
    if (!nextOpen) reset()
    onOpenChange(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm gap-5">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-brand" />
            Dados de Pagamento
          </DialogTitle>
          <DialogDescription>
            Plano {plan.label} ·{" "}
            <span className="font-semibold text-foreground">{formatCurrency(plan.price)}</span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Card type toggle */}
          <div>
            <Label className="text-xs text-zinc-400 mb-1.5 block">Tipo de cartão</Label>
            <div className="grid grid-cols-2 gap-2">
              {(["credit", "debit"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setValue("type", t)}
                  className={cn(
                    "h-9 rounded-lg border text-sm font-medium transition-all cursor-pointer",
                    cardType === t
                      ? "border-brand bg-brand-subtle text-brand"
                      : "border-border text-zinc-400 hover:border-zinc-300",
                  )}
                >
                  {t === "credit" ? "Crédito" : "Débito"}
                </button>
              ))}
            </div>
          </div>

          {/* Card number */}
          <div className="space-y-1.5">
            <Label htmlFor="card-number" className="text-xs text-zinc-400">
              Número do cartão
            </Label>
            <div className="relative">
              <Input
                id="card-number"
                placeholder="0000 0000 0000 0000"
                inputMode="numeric"
                autoComplete="cc-number"
                className={cn("pr-16", errors.number && "border-destructive")}
                {...register("number")}
                onChange={(e) => setValue("number", formatCardNumber(e.target.value))}
              />
              {brandLabel && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-zinc-400">
                  {brandLabel}
                </span>
              )}
            </div>
            {errors.number && (
              <p className="text-xs text-destructive">{errors.number.message}</p>
            )}
          </div>

          {/* Cardholder name */}
          <div className="space-y-1.5">
            <Label htmlFor="card-name" className="text-xs text-zinc-400">
              Nome no cartão
            </Label>
            <Input
              id="card-name"
              placeholder="NOME SOBRENOME"
              autoComplete="cc-name"
              className={cn("uppercase", errors.name && "border-destructive")}
              {...register("name", {
                onChange: (e) => {
                  e.target.value = e.target.value.toUpperCase()
                },
              })}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Expiry + CVV */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="card-expiry" className="text-xs text-zinc-400">
                Validade
              </Label>
              <Input
                id="card-expiry"
                placeholder="MM/AA"
                inputMode="numeric"
                autoComplete="cc-exp"
                maxLength={5}
                className={cn(errors.expiry && "border-destructive")}
                {...register("expiry")}
                onChange={(e) => setValue("expiry", formatExpiry(e.target.value))}
              />
              {errors.expiry && (
                <p className="text-xs text-destructive">{errors.expiry.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="card-cvv" className="text-xs text-zinc-400">
                CVV
              </Label>
              <Input
                id="card-cvv"
                placeholder="123"
                inputMode="numeric"
                autoComplete="cc-csc"
                maxLength={4}
                className={cn(errors.cvv && "border-destructive")}
                {...register("cvv", {
                  onChange: (e) => {
                    e.target.value = e.target.value.replace(/\D/g, "")
                  },
                })}
              />
              {errors.cvv && (
                <p className="text-xs text-destructive">{errors.cvv.message}</p>
              )}
            </div>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={isPaying}
            className="w-full bg-brand hover:bg-brand-dark text-white font-semibold"
          >
            {isPaying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Processando…
              </>
            ) : (
              `Pagar ${formatCurrency(plan.price)}`
            )}
          </Button>

          {/* Mock notice */}
          <p className="flex items-center justify-center gap-1.5 text-[11px] text-zinc-400">
            <Lock className="w-3 h-3" />
            Ambiente de teste — sem cobrança real
          </p>
        </form>
      </DialogContent>
    </Dialog>
  )
}
