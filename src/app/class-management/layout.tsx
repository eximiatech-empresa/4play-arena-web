import { DashboardShell } from "@/components/shared/dashboard-shell"

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