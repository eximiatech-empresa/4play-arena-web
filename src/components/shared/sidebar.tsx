"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  CreditCard,
  CalendarCheck,
  UserCircle,
  LogOut,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { MOCK_STUDENT } from "@/features/profile/mock-data"
import { LevelBadge } from "@/components/shared/level-badge"

const NAV_ITEMS = [
  {
    label: "Visão Geral",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Carteira",
    href: "/carteira",
    icon: CreditCard,
  },
  {
    label: "Aulas",
    href: "/aulas",
    icon: CalendarCheck,
  },
  {
    label: "Perfil",
    href: "/perfil",
    icon: UserCircle,
  },
]

export function Sidebar() {
  const pathname = usePathname()

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

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors group",
                  isActive
                    ? "bg-brand-subtle text-brand-dark"
                    : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800"
                )}
              >
                <Icon
                  className={cn(
                    "w-4 h-4 shrink-0",
                    isActive ? "text-brand" : "text-zinc-400 group-hover:text-zinc-600"
                  )}
                />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

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
          <button className="mt-3 flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-600 transition-colors">
            <LogOut className="w-3 h-3" />
            Sair
          </button>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-zinc-100 flex">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors",
                isActive ? "text-brand" : "text-zinc-400"
              )}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Link>
          )
        })}
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
      <path
        d="M 7 12 Q 20 4 33 12"
        className="stroke-brand"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M 7 28 Q 20 36 33 28"
        className="stroke-brand"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  )
}
