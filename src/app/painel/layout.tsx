import { DashboardShell } from "@/components/layout/dashboard-shell"

export const dynamic = "force-dynamic"

export default function PainelLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>
}
