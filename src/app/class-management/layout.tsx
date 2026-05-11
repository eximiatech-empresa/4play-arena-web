import { DashboardShell } from "@/components/layout/dashboard-shell"

export default function ClassManagementLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <DashboardShell>
      {children}
    </DashboardShell>
  )
}