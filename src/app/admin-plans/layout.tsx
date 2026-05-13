import { DashboardShell } from "@/components/layout/dashboard-shell"

export default function AdminPlansLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>
}
