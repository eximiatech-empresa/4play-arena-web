"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard,
  CreditCard,
  CalendarCheck,
  UserCircle,
  LogOut,
  ClipboardList,
  Users,
  Moon,
  Sun,
  type LucideIcon,
} from "lucide-react";
import gsap from "gsap";
import { cn } from "@/lib/utils";
import { LevelBadge } from "@/components/shared/level-badge";
import { authService } from "@/lib/auth";
import { useCurrentUser } from "@/hooks/use-current-user";

// ─── Lógica de Permissões (RBAC) ──────────────────────────────────────────

type Role = "STUDENT" | "TEACHER" | "ADMIN";

interface NavItemConfig {
  label: string;
  href: string;
  icon: LucideIcon;
  roles?: Role[];
}

const MENU_CONFIG: NavItemConfig[] = [
  {
    label: "Visão Geral",
    href: "/dashboard",
    roles: ["STUDENT"],
    icon: LayoutDashboard,
  },
  {
    label: "Painel Executivo",
    href: "/painel",
    roles: ["ADMIN"],
    icon: LayoutDashboard,
  },
  {
    label: "Carteira",
    href: "/carteira",
    icon: CreditCard,
    roles: ["STUDENT", "ADMIN"],
  },
  {
    label: "Carteira",
    href: "/carteira-professor",
    icon: CreditCard,
    roles: ["TEACHER"],
  },
  {
    label: "Aulas",
    href: "/aulas",
    icon: CalendarCheck,
    roles: ["STUDENT", "TEACHER", "ADMIN"],
  },
  {
    label: "Gestão",
    href: "/class-management",
    icon: ClipboardList,
    roles: ["TEACHER", "ADMIN"],
  },
  {
    label: "Usuários",
    href: "/users-management",
    icon: Users,
    roles: ["ADMIN"],
  },
  { label: "Perfil", href: "/perfil", icon: UserCircle },
];

function getNavItemsForRole(userRole?: string): NavItemConfig[] {
  return MENU_CONFIG.filter((item) => {
    if (!item.roles || item.roles.length === 0) return true;
    if (!userRole) return false;
    return item.roles.includes(userRole as Role);
  });
}

// ─── Desktop nav with sliding indicator ──────────────────────────────────────

interface DesktopNavProps {
  pathname: string;
  items: NavItemConfig[];
}

function DesktopNav({ pathname, items }: DesktopNavProps) {
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const prevIndexRef = useRef<number>(-1);

  const activeIndex = items.findIndex((item) => item.href === pathname);

  useEffect(() => {
    const indicator = indicatorRef.current;
    const nav = indicator?.parentElement;
    const activeEl = itemRefs.current[activeIndex];
    if (!indicator || !activeEl || !nav) return;

    const navRect = nav.getBoundingClientRect();
    const activeRect = activeEl.getBoundingClientRect();
    const activeTop = activeRect.top - navRect.top + nav.scrollTop;

    const prevIndex = prevIndexRef.current;

    if (prevIndex === -1) {
      gsap.set(indicator, {
        top: activeTop,
        height: activeRect.height,
        opacity: 1,
      });
    } else {
      const prevEl = itemRefs.current[prevIndex];
      if (prevEl) {
        const prevRect = prevEl.getBoundingClientRect();
        const prevTop = prevRect.top - navRect.top + nav.scrollTop;
        gsap.fromTo(
          indicator,
          { top: prevTop, height: prevRect.height },
          {
            top: activeTop,
            height: activeRect.height,
            duration: 0.35,
            ease: "power2.inOut",
          },
        );
      }
    }

    prevIndexRef.current = activeIndex;
  }, [activeIndex, items]);

  return (
    <nav className="flex-1 px-3 py-4 relative">
      <div
        ref={indicatorRef}
        className="absolute left-3 right-3 bg-brand-subtle rounded-lg pointer-events-none opacity-0"
      />

      {items.map((item, i) => {
        const isActive = activeIndex === i;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            ref={(el) => {
              itemRefs.current[i] = el;
            }}
            className={cn(
              "relative flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors group",
              isActive
                ? "text-brand-dark"
                : "text-zinc-500 dark:text-zinc-400 hover:text-brand hover:bg-brand/5 dark:hover:text-zinc-100",
            )}
          >
            <Icon
              className={cn(
                "w-4 h-4 shrink-0 transition-colors",
                isActive
                  ? "text-brand"
                  : "text-zinc-400 dark:text-zinc-500 group-hover:text-brand dark:group-hover:text-zinc-300",
              )}
            />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

// ─── Mobile nav with icon bounce ─────────────────────────────────────────────

interface MobileNavItemProps {
  href: string;
  label: string;
  icon: LucideIcon;
  isActive: boolean;
}

function MobileNavItem({
  href,
  label,
  icon: Icon,
  isActive,
}: MobileNavItemProps) {
  const iconRef = useRef<HTMLSpanElement>(null);
  const prevActive = useRef(false);

  useEffect(() => {
    if (isActive && !prevActive.current && iconRef.current) {
      gsap.fromTo(
        iconRef.current,
        { scale: 0.5, rotate: -15 },
        { scale: 1, rotate: 0, duration: 0.45, ease: "back.out(2.5)" },
      );
    }
    prevActive.current = isActive;
  }, [isActive]);

  return (
    <Link
      href={href}
      className={cn(
        "flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors",
        isActive ? "text-brand" : "text-zinc-400 dark:text-zinc-500",
      )}
    >
      <span ref={iconRef} className="flex items-center justify-center">
        <Icon className="w-5 h-5" />
      </span>
      {label}
    </Link>
  );
}

// ─── Sidebar user card ────────────────────────────────────────────────────────

import type { User } from "@/core/entities/user";

function SidebarUserCard({ user }: { user: User | null | undefined }) {
  const name = user?.name ?? "Usuário";
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((n: string) => n[0])
    .join("")
    .toUpperCase();

  // Exibe a role ou o nível
  let badgeText = "Iniciante";
  if (user?.role === "ADMIN") {
    badgeText = "Admin";
  } else if (user?.role === "TEACHER") {
    badgeText = "Professor";
  } else if (user?.role === "STUDENT") {
    badgeText = user.level || "Iniciante";
  }

  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-full bg-brand-dark flex items-center justify-center shrink-0">
        <span className="text-xs font-bold text-white">{initials}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-100 ">
          {name}
        </p>
        <LevelBadge level={badgeText} size="xs" className="mt-0.5" />
      </div>
    </div>
  );
}

// ─── Sidebar Principal ───────────────────────────────────────────────────────

export function Sidebar() {
  const pathname = usePathname();
  // const router = useRouter()
  const { data: user } = useCurrentUser();
  const { resolvedTheme, setTheme } = useTheme();
  const queryClient = useQueryClient();
  const isDark = resolvedTheme === "dark";
  const toggleTheme = () => setTheme(isDark ? "light" : "dark");

  const navItems = getNavItemsForRole(user?.role);

  async function handleLogout() {
    await authService.signOut();

    // 1. Limpa todo o cache do TanStack Query da memória
    queryClient.clear();

    // 2. Força o navegador a destruir a árvore do React e recarregar a página no login
    window.location.href = "/login";
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-55 shrink-0 flex-col bg-card border-r border-border h-screen">
        <div className="flex items-center justify-center px-5 py-5">
          <img
            src="/logos/logo1.png"
            alt="4-Play Arena"
            className="w-28 h-auto object-contain"
          />
        </div>

        <DesktopNav pathname={pathname} items={navItems} />

        <div className="border-t border-border p-4">
          <SidebarUserCard user={user} />
          <div className="mt-3 flex items-center justify-between w-full">
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
            >
              <LogOut className="w-3 h-3" />
              Sair
            </button>
            {/* <button
              onClick={toggleTheme}
              title={isDark ? "Modo claro" : "Modo escuro"}
              className="p-1.5 rounded-md text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              {isDark ? (
                <Sun className="w-3.5 h-3.5" />
              ) : (
                <Moon className="w-3.5 h-3.5" />
              )}
            </button> */}
          </div>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border flex">
        {navItems.map((item) => (
          <MobileNavItem
            key={item.href}
            {...item}
            isActive={pathname === item.href}
          />
        ))}
      </nav>
    </>
  );
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
  );
}
