"use client"

import { forwardRef } from "react"
import { Input } from "@/components/ui/input"

interface CurrencyInputProps {
  value: number
  onChange: (cents: number) => void
  id?: string
  placeholder?: string
}

export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onChange, id, placeholder }, ref) => {
    const displayValue =
      value > 0
        ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value / 100)
        : ""

    return (
      <Input
        ref={ref}
        id={id}
        value={displayValue}
        inputMode="numeric"
        placeholder={placeholder ?? "R$ 0,00"}
        onChange={(e) => {
          const digits = e.target.value.replace(/\D/g, "")
          onChange(digits === "" ? 0 : parseInt(digits, 10))
        }}
      />
    )
  },
)
CurrencyInput.displayName = "CurrencyInput"
