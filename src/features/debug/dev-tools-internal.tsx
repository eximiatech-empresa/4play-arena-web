"use client"

import { useEffect, useRef, useState } from "react"
import { Bug, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { loggerStore } from "./logger-store"
import { RoleSwitcherTab } from "./tabs/role-switcher-tab"
import { TerminalTab } from "./tabs/terminal-tab"

type Tab = "role" | "terminal"

const TABS: { id: Tab; label: string }[] = [
  { id: "role", label: "Troca de Role" },
  { id: "terminal", label: "Terminal" },
]

export function DevToolsInternal() {
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>("role")
  const [errorCount, setErrorCount] = useState(0)
  const patchedRef = useRef(false)

  // Set up console/fetch interceptors once
  useEffect(() => {
    if (patchedRef.current) return
    patchedRef.current = true

    const origLog = console.log.bind(console)
    const origWarn = console.warn.bind(console)
    const origError = console.error.bind(console)
    const origFetch = window.fetch.bind(window)

    console.log = (...args: unknown[]) => {
      origLog(...args)
      loggerStore.add("log", args.map(formatArg).join(" "))
    }

    console.warn = (...args: unknown[]) => {
      origWarn(...args)
      loggerStore.add("warn", args.map(formatArg).join(" "))
    }

    console.error = (...args: unknown[]) => {
      origError(...args)
      loggerStore.add("error", args.map(formatArg).join(" "))
    }

    window.fetch = async (...args: Parameters<typeof fetch>) => {
      const url = resolveUrl(args[0])
      const method = ((args[1]?.method) ?? "GET").toUpperCase()
      loggerStore.add("fetch-req", `${method} ${url}`)
      try {
        const res = await origFetch(...args)
        loggerStore.add("fetch-res", `${res.status} ${res.statusText || "OK"} — ${url}`)
        return res
      } catch (err) {
        loggerStore.add("fetch-err", `${url} — ${String(err)}`)
        throw err
      }
    }

    return () => {
      console.log = origLog
      console.warn = origWarn
      console.error = origError
      window.fetch = origFetch
      patchedRef.current = false
    }
  }, [])

  // Track error count for the badge
  useEffect(() => {
    return loggerStore.subscribe((entries) => {
      setErrorCount(entries.filter((e) => e.level === "error" || e.level === "fetch-err").length)
    })
  }, [])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) setOpen(false)
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [open])

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={() => setOpen((p) => !p)}
        className="fixed bottom-4 right-4 z-[9999] flex h-10 w-10 items-center justify-center rounded-full bg-violet-600 text-white shadow-xl hover:bg-violet-700 active:scale-95 transition-all"
        title="DevTools (Dev only)"
      >
        <Bug size={18} />
        {errorCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
            {errorCount > 9 ? "9+" : errorCount}
          </span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[9998] bg-black/30 backdrop-blur-[1px]"
            onClick={() => setOpen(false)}
          />

          {/* DevTools window */}
          <div className="fixed bottom-16 right-4 z-[9999] w-[min(680px,calc(100vw-2rem))] h-[520px] rounded-xl border border-border bg-background shadow-2xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/40 shrink-0">
              <div className="flex items-center gap-2">
                <Bug size={13} className="text-violet-500" />
                <span className="text-xs font-mono font-semibold tracking-tight">
                  DevTools
                </span>
                <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                  dev only
                </span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded hover:bg-muted"
              >
                <X size={13} />
              </button>
            </div>

            {/* Tab bar */}
            <div className="flex gap-0 border-b shrink-0 bg-muted/20">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "px-4 py-2 text-xs font-medium transition-colors border-b-2 -mb-px",
                    activeTab === tab.id
                      ? "border-violet-500 text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50",
                  )}
                >
                  {tab.label}
                  {tab.id === "terminal" && errorCount > 0 && (
                    <span className="ml-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                      {errorCount > 9 ? "9+" : errorCount}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-hidden">
              {activeTab === "role" && <RoleSwitcherTab />}
              {activeTab === "terminal" && <TerminalTab />}
            </div>
          </div>
        </>
      )}
    </>
  )
}

function formatArg(arg: unknown): string {
  if (typeof arg === "string") return arg
  if (arg instanceof Error) return `${arg.name}: ${arg.message}`
  try {
    return JSON.stringify(arg)
  } catch {
    return String(arg)
  }
}

function resolveUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") return input
  if (input instanceof URL) return input.toString()
  if (input instanceof Request) return input.url
  return String(input)
}
