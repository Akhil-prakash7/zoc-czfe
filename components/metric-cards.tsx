"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, ShoppingCart, TrendingUp, Package } from "lucide-react"

interface Metrics {
  totalSales: number
  totalOrders: number
  averageOrder: number
  menuItems: number
  salesGrowth: number
  ordersGrowth: number
  averageGrowth: number
  itemsGrowth: number
}

export function MetricCards() {
  const [metrics, setMetrics] = useState<Metrics>({
    totalSales: 0,
    totalOrders: 0,
    averageOrder: 0,
    menuItems: 0,
    salesGrowth: 0,
    ordersGrowth: 0,
    averageGrowth: 0,
    itemsGrowth: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMetrics()
  }, [])

  const fetchMetrics = async () => {
    try {
      const response = await fetch("/api/dashboard/metrics")
      if (response.ok) {
        const data = await response.json()
        setMetrics(data)
      }
    } catch (error) {
      console.error("Failed to fetch metrics:", error)
    } finally {
      setLoading(false)
    }
  }

  const cards = [
    {
      title: "Total Sales",
      value: loading ? "Loading..." : `₹${metrics.totalSales.toFixed(2)}`,
      growth: loading ? "" : `${metrics.salesGrowth >= 0 ? "+" : ""}${metrics.salesGrowth.toFixed(1)}%`,
      description: "Today's revenue",
      icon: DollarSign,
      color: "text-emerald-600",
      bgColor: "bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/50 dark:to-teal-950/50",
      iconBg: "bg-emerald-100 dark:bg-emerald-900/50",
      growthColor: metrics.salesGrowth >= 0 ? "text-emerald-600" : "text-red-600",
    },
    {
      title: "Total Orders",
      value: loading ? "Loading..." : metrics.totalOrders.toString(),
      growth: loading ? "" : `${metrics.ordersGrowth >= 0 ? "+" : ""}${metrics.ordersGrowth.toFixed(1)}%`,
      description: "Orders processed",
      icon: ShoppingCart,
      color: "text-blue-600",
      bgColor: "bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50",
      iconBg: "bg-blue-100 dark:bg-blue-900/50",
      growthColor: metrics.ordersGrowth >= 0 ? "text-emerald-600" : "text-red-600",
    },
    {
      title: "Average Order",
      value: loading ? "Loading..." : `₹${metrics.averageOrder.toFixed(2)}`,
      growth: loading ? "" : `${metrics.averageGrowth >= 0 ? "+" : ""}${metrics.averageGrowth.toFixed(1)}%`,
      description: "Per order value",
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/50 dark:to-pink-950/50",
      iconBg: "bg-purple-100 dark:bg-purple-900/50",
      growthColor: metrics.averageGrowth >= 0 ? "text-emerald-600" : "text-red-600",
    },
    {
      title: "Menu Items",
      value: loading ? "Loading..." : metrics.menuItems.toString(),
      growth: loading ? "" : `+${metrics.itemsGrowth} new`,
      description: "Available items",
      icon: Package,
      color: "text-orange-600",
      bgColor: "bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/50 dark:to-red-950/50",
      iconBg: "bg-orange-100 dark:bg-orange-900/50",
      growthColor: "text-emerald-600",
    },
  ]

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => (
        <Card
          key={index}
          className={`${card.bgColor} border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 backdrop-blur-sm`}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground">{card.title}</CardTitle>
            <div className={`p-2 rounded-xl ${card.iconBg}`}>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold mb-2 ${card.color}`}>{card.value}</div>
            <div className="flex items-center space-x-2 text-sm">
              {card.growth && <span className={`font-medium ${card.growthColor}`}>{card.growth}</span>}
              <span className="text-muted-foreground">{card.description}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
