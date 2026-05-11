import { DashboardShell } from "@/components/layout/dashboard-shell"

export default function AdminLessonsLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>
}
