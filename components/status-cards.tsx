"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, ChefHat, CheckCircle, Star } from "lucide-react"

interface OrderStatus {
  pending: number
  preparing: number
  ready: number
  completed: number
}

export function StatusCards() {
  const [status, setStatus] = useState<OrderStatus>({
    pending: 0,
    preparing: 0,
    ready: 0,
    completed: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOrderStatus()
    const interval = setInterval(fetchOrderStatus, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const fetchOrderStatus = async () => {
    try {
      const response = await fetch("/api/orders/status")
      if (response.ok) {
        const data = await response.json()
        setStatus(data)
      }
    } catch (error) {
      console.error("Failed to fetch order status:", error)
    } finally {
      setLoading(false)
    }
  }

  const cards = [
    {
      title: "Pending Orders",
      value: loading ? "..." : status.pending,
      description: "Awaiting preparation",
      icon: Clock,
      color: "text-amber-600",
      bgColor: "bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950 dark:to-yellow-950",
      iconBg: "bg-amber-100 dark:bg-amber-900",
      pulse: status.pending > 0,
    },
    {
      title: "Preparing Orders",
      value: loading ? "..." : status.preparing,
      description: "In kitchen",
      icon: ChefHat,
      color: "text-blue-600",
      bgColor: "bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950",
      iconBg: "bg-blue-100 dark:bg-blue-900",
      pulse: status.preparing > 0,
    },
    {
      title: "Ready Orders",
      value: loading ? "..." : status.ready,
      description: "Ready for pickup",
      icon: CheckCircle,
      color: "text-emerald-600",
      bgColor: "bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950 dark:to-green-950",
      iconBg: "bg-emerald-100 dark:bg-emerald-900",
      pulse: status.ready > 0,
    },
    {
      title: "Completed Today",
      value: loading ? "..." : status.completed,
      description: "Successfully delivered",
      icon: Star,
      color: "text-purple-600",
      bgColor: "bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950 dark:to-violet-950",
      iconBg: "bg-purple-100 dark:bg-purple-900",
      pulse: false,
    },
  ]

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => (
        <Card
          key={index}
          className={`${card.bgColor} border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${card.pulse ? "animate-pulse" : ""}`}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground">{card.title}</CardTitle>
            <div className={`p-2 rounded-xl ${card.iconBg} ${card.pulse ? "animate-bounce" : ""}`}>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-4xl font-bold mb-2 ${card.color}`}>{card.value}</div>
            <p className="text-sm text-muted-foreground">{card.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
