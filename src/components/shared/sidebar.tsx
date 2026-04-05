"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  CreditCard,
  CalendarCheck,
  UserCircle,
  LogOut,
  Palette,
  type LucideIcon,
} from "lucide-react"
import gsap from "gsap"
import { cn } from "@/lib/utils"
import { MOCK_STUDENT } from "@/features/profile/mock-data"
import { LevelBadge } from "@/components/shared/level-badge"
import { useBrandTheme } from "@/hooks/use-brand-theme"

const NAV_ITEMS = [
  { label: "Visão Geral", href: "/dashboard", icon: LayoutDashboard },
  { label: "Carteira",    href: "/carteira",  icon: CreditCard },
  { label: "Aulas",       href: "/aulas",     icon: CalendarCheck },
  { label: "Perfil",      href: "/perfil",    icon: UserCircle },
]

// ─── Desktop nav with sliding indicator ──────────────────────────────────────

function DesktopNav({ pathname }: { pathname: string }) {
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([])
  const indicatorRef = useRef<HTMLDivElement>(null)
  const prevIndexRef = useRef<number>(-1)

  const activeIndex = NAV_ITEMS.findIndex((item) => item.href === pathname)

  useEffect(() => {
    const indicator = indicatorRef.current
    const nav = indicator?.parentElement
    const activeEl = itemRefs.current[activeIndex]
    if (!indicator || !activeEl || !nav) return

    // getBoundingClientRect is robust regardless of intermediate positioned ancestors
    const navRect = nav.getBoundingClientRect()
    const activeRect = activeEl.getBoundingClientRect()
    const activeTop = activeRect.top - navRect.top + nav.scrollTop

    const prevIndex = prevIndexRef.current

    if (prevIndex === -1) {
      // First mount: snap into position without animation
      gsap.set(indicator, { top: activeTop, height: activeRect.height, opacity: 1 })
    } else {
      const prevEl = itemRefs.current[prevIndex]
      if (prevEl) {
        const prevRect = prevEl.getBoundingClientRect()
        const prevTop = prevRect.top - navRect.top + nav.scrollTop
        gsap.fromTo(
          indicator,
          { top: prevTop, height: prevRect.height },
          { top: activeTop, height: activeRect.height, duration: 0.35, ease: "power2.inOut" }
        )
      }
    }

    prevIndexRef.current = activeIndex
  }, [activeIndex])

  return (
    <nav className="flex-1 px-3 py-4 relative">
      {/* Sliding background indicator */}
      <div
        ref={indicatorRef}
        className="absolute left-3 right-3 bg-brand-subtle rounded-lg pointer-events-none opacity-0"
      />

      {NAV_ITEMS.map((item, i) => {
        const isActive = activeIndex === i
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            ref={(el) => { itemRefs.current[i] = el }}
            className={cn(
              "relative flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors group",
              isActive ? "text-brand-dark" : "text-zinc-500 hover:text-zinc-800"
            )}
          >
            <Icon
              className={cn(
                "w-4 h-4 shrink-0 transition-colors",
                isActive ? "text-brand" : "text-zinc-400 group-hover:text-zinc-600"
              )}
            />
            <span>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}

// ─── Mobile nav with icon bounce ─────────────────────────────────────────────

interface MobileNavItemProps {
  href: string
  label: string
  icon: LucideIcon
  isActive: boolean
}

function MobileNavItem({ href, label, icon: Icon, isActive }: MobileNavItemProps) {
  const iconRef = useRef<HTMLSpanElement>(null)
  const prevActive = useRef(false)

  useEffect(() => {
    if (isActive && !prevActive.current && iconRef.current) {
      gsap.fromTo(
        iconRef.current,
        { scale: 0.5, rotate: -15 },
        { scale: 1, rotate: 0, duration: 0.45, ease: "back.out(2.5)" }
      )
    }
    prevActive.current = isActive
  }, [isActive])

  return (
    <Link
      href={href}
      className={cn(
        "flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors",
        isActive ? "text-brand" : "text-zinc-400"
      )}
    >
      <span ref={iconRef} className="flex items-center justify-center">
        <Icon className="w-5 h-5" />
      </span>
      {label}
    </Link>
  )
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { theme, toggle } = useBrandTheme()

  function handleLogout() {
    router.push("/login")
  }

  const initials = MOCK_STUDENT.name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-[220px] shrink-0 flex-col bg-white border-r border-zinc-100 h-screen">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-zinc-100">
          <TennisBallIcon className="w-7 h-7 shrink-0" />
          <div className="leading-tight">
            <p className="text-[9px] font-bold tracking-[0.22em] uppercase text-zinc-400">
              4 Play
            </p>
            <p className="text-base font-bold tracking-tight text-brand-dark leading-none">
              Arena
            </p>
          </div>
        </div>

        <DesktopNav pathname={pathname} />

        {/* User card */}
        <div className="border-t border-zinc-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-brand-dark flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-white">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-zinc-800 truncate">
                {MOCK_STUDENT.name}
              </p>
              <LevelBadge level={MOCK_STUDENT.level} size="xs" className="mt-0.5" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-600 transition-colors"
            >
              <LogOut className="w-3 h-3" />
              Sair
            </button>
            <button
              onClick={toggle}
              title={theme === "green" ? "Mudar para laranja" : "Mudar para verde"}
              className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-600 transition-colors"
            >
              <Palette className="w-3 h-3" />
              <span
                className="w-2.5 h-2.5 rounded-full border border-zinc-200"
                style={{
                  background:
                    theme === "green"
                      ? "var(--theme-preview-orange)"
                      : "var(--theme-preview-green)",
                }}
              />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-zinc-100 flex">
        {NAV_ITEMS.map((item) => (
          <MobileNavItem
            key={item.href}
            {...item}
            isActive={pathname === item.href}
          />
        ))}
      </nav>
    </>
  )
}

function TennisBallIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="20" cy="20" r="18" className="stroke-brand" strokeWidth="2" />
      <path d="M 7 12 Q 20 4 33 12" className="stroke-brand" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M 7 28 Q 20 36 33 28" className="stroke-brand" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </svg>
  )
}
