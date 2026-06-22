import { DashboardShell } from "@/components/layout/dashboard-shell"

export const dynamic = "force-dynamic"

export default function FamiliaLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>
}
