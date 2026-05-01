import { DashboardShell } from "@/components/shared/dashboard-shell"

export const dynamic = "force-dynamic"

export default function CarteiraLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>
}
