"use client"

import { useEffect, useState } from "react"

type BrandTheme = "green" | "orange"

const STORAGE_KEY = "4play-brand-theme"

function readStoredTheme(): BrandTheme {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === "orange" || raw === "green") return raw
  } catch {
    // localStorage unavailable (private mode, security policy)
  }
  return "green"
}

function writeStoredTheme(theme: BrandTheme) {
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // ignore
  }
}

export function useBrandTheme() {
  const [theme, setTheme] = useState<BrandTheme>("green")

  useEffect(() => {
    const stored = readStoredTheme()
    setTheme(stored)
    if (stored === "orange") {
      document.documentElement.classList.add("theme-orange")
    }
  }, [])

  function toggle() {
    setTheme((prev) => {
      const next: BrandTheme = prev === "green" ? "orange" : "green"
      writeStoredTheme(next)
      if (next === "orange") {
        document.documentElement.classList.add("theme-orange")
      } else {
        document.documentElement.classList.remove("theme-orange")
      }
      return next
    })
  }

  return { theme, toggle }
}
