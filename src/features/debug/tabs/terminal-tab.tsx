"use client"

import { useEffect, useRef, useState } from "react"
import { Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { loggerStore, type LogEntry, type LogLevel } from "../logger-store"

const LEVEL_TEXT: Record<LogLevel, string> = {
  log: "text-zinc-300",
  warn: "text-yellow-400",
  error: "text-red-400",
  "fetch-req": "text-cyan-400",
  "fetch-res": "text-green-400",
  "fetch-err": "text-red-400",
}

const LEVEL_BADGE: Record<LogLevel, string> = {
  log: "text-zinc-500",
  warn: "text-yellow-500",
  error: "text-red-500",
  "fetch-req": "text-cyan-500",
  "fetch-res": "text-green-500",
  "fetch-err": "text-red-500",
}

const LEVEL_LABEL: Record<LogLevel, string> = {
  log: "LOG",
  warn: "WARN",
  error: "ERR",
  "fetch-req": "→ REQ",
  "fetch-res": "← RES",
  "fetch-err": "✗ ERR",
}

export function TerminalTab() {
  const [entries, setEntries] = useState<LogEntry[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)
  const shouldAutoScroll = useRef(true)

  useEffect(() => loggerStore.subscribe(setEntries), [])

  useEffect(() => {
    if (shouldAutoScroll.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [entries])

  return (
    <div className="flex flex-col h-full bg-zinc-950">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-zinc-800">
        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
          console — {entries.length} eventos
        </span>
        <button
          onClick={() => loggerStore.clear()}
          className="flex items-center gap-1 text-zinc-500 hover:text-zinc-200 transition-colors text-[10px] font-mono"
          title="Limpar terminal"
        >
          <Trash2 size={11} />
          limpar
        </button>
      </div>

      <div
        className="flex-1 overflow-y-auto p-3 font-mono text-xs space-y-0.5"
        onScroll={(e) => {
          const el = e.currentTarget
          shouldAutoScroll.current =
            el.scrollHeight - el.scrollTop - el.clientHeight < 40
        }}
      >
        {entries.length === 0 ? (
          <span className="text-zinc-600">
            Aguardando eventos de console e fetch...
          </span>
        ) : (
          entries.map((entry) => <LogLine key={entry.id} entry={entry} />)
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}

function LogLine({ entry }: { entry: LogEntry }) {
  const [expanded, setExpanded] = useState(false)
  const isLong = entry.message.length > 120
  const displayMessage =
    isLong && !expanded ? entry.message.slice(0, 120) + "…" : entry.message

  return (
    <div
      className={cn("flex gap-2 leading-5", LEVEL_TEXT[entry.level])}
      onClick={() => isLong && setExpanded((p) => !p)}
      style={{ cursor: isLong ? "pointer" : "default" }}
    >
      <span className="text-zinc-600 shrink-0 tabular-nums">
        {entry.timestamp.toLocaleTimeString("pt-BR", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })}
      </span>
      <span
        className={cn(
          "shrink-0 text-[10px] font-bold w-14 text-right",
          LEVEL_BADGE[entry.level],
        )}
      >
        {LEVEL_LABEL[entry.level]}
      </span>
      <span className="break-all whitespace-pre-wrap flex-1">{displayMessage}</span>
    </div>
  )
}
