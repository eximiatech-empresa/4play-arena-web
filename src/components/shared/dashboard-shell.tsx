import { Sidebar } from "./sidebar"

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-zinc-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto pb-16 lg:pb-0">
        {children}
      </main>
    </div>
  )
}
