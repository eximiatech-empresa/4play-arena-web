import { DashboardShell } from "@/components/layout/dashboard-shell"

export default function UsersManagementLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>
}