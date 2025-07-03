import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const { db } = await connectToDatabase()
    const { searchParams } = new URL(request.url)

    const dateFrom = searchParams.get("dateFrom")
    const dateTo = searchParams.get("dateTo")
    const paymentMethod = searchParams.get("paymentMethod")
    const orderStatus = searchParams.get("orderStatus")
    const category = searchParams.get("category")
    const minAmount = searchParams.get("minAmount")
    const maxAmount = searchParams.get("maxAmount")

    console.log("Analytics API - Received filters:", {
      dateFrom,
      dateTo,
      paymentMethod,
      orderStatus,
      category,
      minAmount,
      maxAmount,
    })

   
    let dateFilter = {}
    if (dateFrom && dateTo) {
      dateFilter = {
        createdAt: {
          $gte: new Date(dateFrom),
          $lte: new Date(dateTo),
        },
      }
    } else {
   
      const endDate = new Date()
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      dateFilter = {
        createdAt: { $gte: startDate, $lte: endDate },
      }
    }

    // Build base match filter for orders
    const baseMatchFilter: any = {
      ...dateFilter,
    }

    // Only exclude cancelled orders if no specific status is selected
    if (!orderStatus || orderStatus === "all") {
      baseMatchFilter.status = { $ne: "cancelled" }
    } else {
      baseMatchFilter.status = orderStatus
    }

    // Add payment method filter
    if (paymentMethod && paymentMethod !== "all") {
      baseMatchFilter.paymentMethod = paymentMethod
    }

    // Add amount range filter
    if (minAmount && !isNaN(Number.parseFloat(minAmount))) {
      baseMatchFilter.total = { ...baseMatchFilter.total, $gte: Number.parseFloat(minAmount) }
    }
    if (maxAmount && !isNaN(Number.parseFloat(maxAmount))) {
      baseMatchFilter.total = { ...baseMatchFilter.total, $lte: Number.parseFloat(maxAmount) }
    }

    console.log("Analytics API - Base match filter:", JSON.stringify(baseMatchFilter, null, 2))

    // Daily Revenue Data
    const dailyRevenue = await db
      .collection("orders")
      .aggregate([
        { $match: baseMatchFilter },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            revenue: { $sum: "$total" },
            orders: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        {
          $project: {
            date: "$_id",
            revenue: { $round: ["$revenue", 2] },
            orders: 1,
            _id: 0,
          },
        },
      ])
      .toArray()

    console.log("Analytics API - Daily revenue count:", dailyRevenue.length)

    // Top Menu Items Pipeline
    const topMenuItemsPipeline: any[] = [{ $match: baseMatchFilter }, { $unwind: "$items" }]

    
    if (category && category !== "all") {
      topMenuItemsPipeline.push(
        {
          $lookup: {
            from: "menuItems",
            let: { itemName: "$items.name" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [{ $eq: ["$name", "$$itemName"] }, { $eq: ["$category", category] }],
                  },
                },
              },
            ],
            as: "menuItemMatch",
          },
        },
        {
          $match: {
            menuItemMatch: { $ne: [] },
          },
        },
      )
    }

    topMenuItemsPipeline.push(
      {
        $group: {
          _id: "$items.name",
          orders: { $sum: "$items.quantity" },
          revenue: { $sum: { $multiply: ["$items.quantity", "$items.price"] } },
        },
      },
      { $sort: { orders: -1 } },
      { $limit: 10 },
      {
        $project: {
          name: "$_id",
          orders: 1,
          revenue: { $round: ["$revenue", 2] },
          _id: 0,
        },
      },
    )

    const topMenuItems = await db.collection("orders").aggregate(topMenuItemsPipeline).toArray()

    console.log("Analytics API - Top menu items count:", topMenuItems.length)

    // Payment Methods Distribution
    const paymentMethodsResult = await db
      .collection("orders")
      .aggregate([
        { $match: baseMatchFilter },
        {
          $group: {
            _id: "$paymentMethod",
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ])
      .toArray()

    const totalPaymentOrders = paymentMethodsResult.reduce((sum, item) => sum + item.count, 0)
    const paymentMethods = paymentMethodsResult.map((item) => ({
      method: item._id || "Unknown",
      count: item.count,
      percentage: totalPaymentOrders > 0 ? Math.round((item.count / totalPaymentOrders) * 100 * 10) / 10 : 0,
    }))

    console.log("Analytics API - Payment methods count:", paymentMethods.length)

    // Hourly Orders Distribution
    const hourlyOrders = await db
      .collection("orders")
      .aggregate([
        { $match: baseMatchFilter },
        {
          $group: {
            _id: { $hour: "$createdAt" },
            orders: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        {
          $project: {
            hour: {
              $concat: [
                {
                  $cond: {
                    if: { $lt: ["$_id", 10] },
                    then: { $concat: ["0", { $toString: "$_id" }] },
                    else: { $toString: "$_id" },
                  },
                },
                ":00",
              ],
            },
            orders: 1,
            _id: 0,
          },
        },
      ])
      .toArray()

    console.log("Analytics API - Hourly orders count:", hourlyOrders.length)

    // Summary
    const summaryResult = await db
      .collection("orders")
      .aggregate([
        { $match: baseMatchFilter },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$total" },
            totalOrders: { $sum: 1 },
            averageOrderValue: { $avg: "$total" },
          },
        },
      ])
      .toArray()

    const currentStats = summaryResult[0] || { totalRevenue: 0, totalOrders: 0, averageOrderValue: 0 }

    // Previous period for growth calculation
    const currentPeriodStart = dateFrom ? new Date(dateFrom) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const currentPeriodEnd = dateTo ? new Date(dateTo) : new Date()
    const periodDiff = currentPeriodEnd.getTime() - currentPeriodStart.getTime()

    const previousPeriodStart = new Date(currentPeriodStart.getTime() - periodDiff)
    const previousPeriodEnd = new Date(currentPeriodStart.getTime())

    const previousPeriodFilter = {
      createdAt: { $gte: previousPeriodStart, $lte: previousPeriodEnd },
      status: { $ne: "cancelled" },
    }

    const previousSummaryResult = await db
      .collection("orders")
      .aggregate([
        { $match: previousPeriodFilter },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$total" },
            totalOrders: { $sum: 1 },
          },
        },
      ])
      .toArray()

    const previousStats = previousSummaryResult[0] || { totalRevenue: 0, totalOrders: 0 }

    const revenueGrowth =
      previousStats.totalRevenue > 0
        ? ((currentStats.totalRevenue - previousStats.totalRevenue) / previousStats.totalRevenue) * 100
        : currentStats.totalRevenue > 0
          ? 100
          : 0

    const ordersGrowth =
      previousStats.totalOrders > 0
        ? ((currentStats.totalOrders - previousStats.totalOrders) / previousStats.totalOrders) * 100
        : currentStats.totalOrders > 0
          ? 100
          : 0

    // Get available filter options
    const availableCategories = await db.collection("menuItems").distinct("category")
    const availablePaymentMethods = await db.collection("orders").distinct("paymentMethod")
    const availableStatuses = await db.collection("orders").distinct("status")

    const response = {
      dailyRevenue,
      topMenuItems,
      paymentMethods,
      hourlyOrders,
      summary: {
        totalRevenue: Math.round(currentStats.totalRevenue * 100) / 100,
        totalOrders: currentStats.totalOrders,
        averageOrderValue: Math.round((currentStats.averageOrderValue || 0) * 100) / 100,
        revenueGrowth: Math.round(revenueGrowth * 10) / 10,
        ordersGrowth: Math.round(ordersGrowth * 10) / 10,
      },
      filterOptions: {
        categories: availableCategories.filter(Boolean),
        paymentMethods: availablePaymentMethods.filter(Boolean),
        statuses: availableStatuses.filter(Boolean),
      },
    }

    console.log("Analytics API - Final response summary:", {
      dailyRevenueCount: response.dailyRevenue.length,
      topMenuItemsCount: response.topMenuItems.length,
      paymentMethodsCount: response.paymentMethods.length,
      hourlyOrdersCount: response.hourlyOrders.length,
      totalRevenue: response.summary.totalRevenue,
      totalOrders: response.summary.totalOrders,
    })

    return NextResponse.json(response)
  } catch (error) {
    console.error("Analytics API - Error:", error)
    return NextResponse.json(
      { error: "Failed to fetch analytics", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
