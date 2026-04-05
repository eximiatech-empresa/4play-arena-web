"use client"

import { useEffect, useState } from "react"

type BrandTheme = "green" | "orange"

const STORAGE_KEY = "4play-brand-theme"

export function useBrandTheme() {
  const [theme, setTheme] = useState<BrandTheme>("green")

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as BrandTheme | null
    if (stored === "orange") {
      setTheme("orange")
      document.documentElement.classList.add("theme-orange")
    }
  }, [])

  function toggle() {
    setTheme((prev) => {
      const next = prev === "green" ? "orange" : "green"
      localStorage.setItem(STORAGE_KEY, next)
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
