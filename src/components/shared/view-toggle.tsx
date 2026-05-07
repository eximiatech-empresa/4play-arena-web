"use client"

import { LayoutGrid, List } from "lucide-react"
import { cn } from "@/lib/utils"

interface ViewToggleProps {
  value: "grid" | "list"
  onChange: (v: "grid" | "list") => void
}

export function ViewToggle({ value, onChange }: ViewToggleProps) {
  return (
    <div className="flex items-center gap-0.5 border border-border rounded-lg p-0.5 bg-muted shrink-0">
      <button
        onClick={() => onChange("grid")}
        title="Visualização em grade"
        className={cn(
          "p-1.5 rounded-md transition-colors",
          value === "grid" ? "bg-card shadow-sm text-foreground" : "text-zinc-400 hover:text-zinc-600",
        )}
      >
        <LayoutGrid className="w-4 h-4" />
      </button>
      <button
        onClick={() => onChange("list")}
        title="Visualização em lista"
        className={cn(
          "p-1.5 rounded-md transition-colors",
          value === "list" ? "bg-card shadow-sm text-foreground" : "text-zinc-400 hover:text-zinc-600",
        )}
      >
        <List className="w-4 h-4" />
      </button>
    </div>
  )
}
