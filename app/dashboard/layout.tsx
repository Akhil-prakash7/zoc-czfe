import type React from "react"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-screen w-full overflow-hidden">
        <AppSidebar />
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Absolutely Fixed Header */}
          <div className="flex-shrink-0 border-b bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl supports-[backdrop-filter]:bg-white/80 dark:supports-[backdrop-filter]:bg-gray-900/80 shadow-sm z-50">
            <DashboardHeader />
          </div>
          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">{children}</div>
        </div>
      </div>
    </SidebarProvider>
  )
}
