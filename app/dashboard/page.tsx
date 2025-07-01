import { MetricCards } from "@/components/metric-cards"
import { StatusCards } from "@/components/status-cards"
import { DashboardCharts } from "@/components/dashboard-charts"

export default function DashboardPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-blue-600">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, Team Member! Here's what's happening at your restaurant today.
        </p>
      </div>

      <MetricCards />
      <StatusCards />
      <DashboardCharts />
    </div>
  )
}
