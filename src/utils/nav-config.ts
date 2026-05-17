import {
  LayoutDashboard,
  CreditCard,
  CalendarCheck,
  UserCircle,
  ClipboardList,
  Users,
  History,
  ReceiptText,
  CalendarDays,
  PackageOpen,
  UsersRound,
  GraduationCap,
  type LucideIcon,
} from "lucide-react"

export type Role = "STUDENT" | "TEACHER" | "ADMIN"

export interface NavItemConfig {
  label: string
  href: string
  icon: LucideIcon
  roles?: Role[]
}

export const MENU_CONFIG: NavItemConfig[] = [
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
    roles: ["STUDENT"],
  },
  {
    label: "Carteira",
    href: "/carteira-professor",
    icon: CreditCard,
    roles: ["TEACHER"],
  },
  {
    label: "Meu Plano",
    href: "/plano",
    icon: ReceiptText,
    roles: ["STUDENT"],
  },
  {
    label: "Aulas",
    href: "/aulas",
    icon: CalendarCheck,
    roles: ["STUDENT"],
  },
  {
    label: "Histórico",
    href: "/historico",
    icon: History,
    roles: ["STUDENT"],
  },
  {
    label: "Histórico",
    href: "/historico-professor",
    icon: History,
    roles: ["TEACHER"],
  },
  {
    label: "Gestão",
    href: "/class-management",
    icon: ClipboardList,
    roles: ["TEACHER"],
  },
  {
    label: "Minha Turma",
    href: "/gestao-turma",
    icon: UsersRound,
    roles: ["TEACHER"],
  },
  {
    label: "Níveis",
    href: "/niveis-alunos",
    icon: GraduationCap,
    roles: ["TEACHER", "ADMIN"],
  },
  {
    label: "Grade de Aulas",
    href: "/admin-lessons",
    icon: CalendarDays,
    roles: ["ADMIN"],
  },
  {
    label: "Planos",
    href: "/admin-plans",
    icon: PackageOpen,
    roles: ["ADMIN"],
  },
  {
    label: "Usuários",
    href: "/users-management",
    icon: Users,
    roles: ["ADMIN"],
  },
  { label: "Perfil", href: "/perfil", icon: UserCircle },
]

export function getNavItemsForRole(userRole?: string): NavItemConfig[] {
  return MENU_CONFIG.filter((item) => {
    if (!item.roles || item.roles.length === 0) return true
    if (!userRole) return false
    return item.roles.includes(userRole as Role)
  })
}
