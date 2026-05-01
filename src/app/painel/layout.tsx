import { DashboardShell } from "@/components/shared/dashboard-shell"

export const dynamic = "force-dynamic"

export default function PainelLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>
}
