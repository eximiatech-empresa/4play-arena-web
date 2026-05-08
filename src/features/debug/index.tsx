"use client"

import dynamic from "next/dynamic"

const DevToolsInternal = dynamic(
  () =>
    import("./dev-tools-internal").then((m) => ({ default: m.DevToolsInternal })),
  { ssr: false },
)

export function DevTools() {
  if (process.env.NODE_ENV !== "development") return null
  return <DevToolsInternal />
}
