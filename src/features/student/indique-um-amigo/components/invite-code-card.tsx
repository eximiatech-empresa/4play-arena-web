// src/features/student/indique-um-amigo/components/invite-code-card.tsx
"use client"
import { useState } from "react"
import { Check, Copy, Gift } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface InviteCodeCardProps {
  code: string
}

export function InviteCodeCard({ code }: InviteCodeCardProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    toast.success("Código copiado!")
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm p-6 overflow-hidden relative">
      <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-brand-subtle" />
      <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-brand-subtle shrink-0">
            <Gift className="w-5 h-5 text-brand" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Seu código de convite</p>
            <p className="text-2xl font-bold text-foreground tracking-wide tabular-nums">{code}</p>
          </div>
        </div>

        <Button onClick={handleCopy} className="sm:w-44" variant={copied ? "outline" : "default"}>
          {copied ? (
            <>
              <Check className="w-4 h-4" />
              Copiado!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              Copiar Código
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
