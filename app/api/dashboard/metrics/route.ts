import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET() {
  try {
    const { db } = await connectToDatabase()

    // Get today's date range
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000)

    // Get yesterday's date range for comparison
    const yesterday = new Date(startOfDay.getTime() - 24 * 60 * 60 * 1000)
    const startOfYesterday = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate())

    // Aggregate today's and yesterday's metrics
    const [todayResult, yesterdayResult, menuItemsCount] = await Promise.all([
      db
        .collection("orders")
        .aggregate([
          {
            $match: {
              createdAt: { $gte: startOfDay, $lt: endOfDay },
              status: { $ne: "cancelled" },
            },
          },
          {
            $group: {
              _id: null,
              totalSales: { $sum: "$total" },
              totalOrders: { $sum: 1 },
              averageOrder: { $avg: "$total" },
            },
          },
        ])
        .toArray(),
      db
        .collection("orders")
        .aggregate([
          {
            $match: {
              createdAt: { $gte: startOfYesterday, $lt: startOfDay },
              status: { $ne: "cancelled" },
            },
          },
          {
            $group: {
              _id: null,
              totalSales: { $sum: "$total" },
              totalOrders: { $sum: 1 },
              averageOrder: { $avg: "$total" },
            },
          },
        ])
        .toArray(),
      db.collection("menuItems").countDocuments({ available: true }),
    ])

    const todayMetrics = todayResult[0] || {
      totalSales: 0,
      totalOrders: 0,
      averageOrder: 0,
    }

    const yesterdayMetrics = yesterdayResult[0] || {
      totalSales: 0,
      totalOrders: 0,
      averageOrder: 0,
    }

    // Calculate growth percentages
    const salesGrowth =
      yesterdayMetrics.totalSales > 0
        ? ((todayMetrics.totalSales - yesterdayMetrics.totalSales) / yesterdayMetrics.totalSales) * 100
        : todayMetrics.totalSales > 0
          ? 100
          : 0

    const ordersGrowth =
      yesterdayMetrics.totalOrders > 0
        ? ((todayMetrics.totalOrders - yesterdayMetrics.totalOrders) / yesterdayMetrics.totalOrders) * 100
        : todayMetrics.totalOrders > 0
          ? 100
          : 0

    const averageGrowth =
      yesterdayMetrics.averageOrder > 0
        ? ((todayMetrics.averageOrder - yesterdayMetrics.averageOrder) / yesterdayMetrics.averageOrder) * 100
        : todayMetrics.averageOrder > 0
          ? 100
          : 0

    // Get new menu items added today
    const newItemsToday = await db.collection("menuItems").countDocuments({
      createdAt: { $gte: startOfDay, $lt: endOfDay },
    })

    return NextResponse.json({
      totalSales: todayMetrics.totalSales || 0,
      totalOrders: todayMetrics.totalOrders || 0,
      averageOrder: todayMetrics.averageOrder || 0,
      menuItems: menuItemsCount,
      salesGrowth: Number(salesGrowth.toFixed(1)),
      ordersGrowth: Number(ordersGrowth.toFixed(1)),
      averageGrowth: Number(averageGrowth.toFixed(1)),
      itemsGrowth: newItemsToday,
    })
  } catch (error) {
    console.error("Failed to fetch metrics:", error)
    return NextResponse.json({ error: "Failed to fetch metrics" }, { status: 500 })
  }
}
