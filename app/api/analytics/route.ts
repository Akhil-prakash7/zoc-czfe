import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const { db } = await connectToDatabase()
    const { searchParams } = new URL(request.url)

    const fromDate = searchParams.get("from")
    const toDate = searchParams.get("to")

    // Default to last 7 days if no dates provided
    const endDate = toDate ? new Date(toDate) : new Date()
    const startDate = fromDate ? new Date(fromDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    // Sales trend data
    const salesTrend = await db
      .collection("orders")
      .aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
            status: { $ne: "cancelled" },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            sales: { $sum: "$total" },
          },
        },
        { $sort: { _id: 1 } },
        {
          $project: {
            date: "$_id",
            sales: 1,
            _id: 0,
          },
        },
      ])
      .toArray()

    // Category breakdown
    const categoryBreakdown = await db
      .collection("orders")
      .aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
            status: { $ne: "cancelled" },
          },
        },
        { $unwind: "$items" },
        {
          $lookup: {
            from: "menuItems",
            localField: "items.menuItemId",
            foreignField: "_id",
            as: "menuItem",
          },
        },
        { $unwind: { path: "$menuItem", preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: { $ifNull: ["$menuItem.category", "Unknown"] },
            value: { $sum: { $multiply: ["$items.quantity", "$items.price"] } },
          },
        },
        {
          $group: {
            _id: null,
            categories: { $push: { name: "$_id", value: "$value" } },
            total: { $sum: "$value" },
          },
        },
        {
          $project: {
            categories: {
              $map: {
                input: "$categories",
                as: "cat",
                in: {
                  name: "$$cat.name",
                  value: "$$cat.value",
                },
              },
            },
            _id: 0,
          },
        },
      ])
      .toArray()

    // Top menu items
    const topItems = await db
      .collection("orders")
      .aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
            status: { $ne: "cancelled" },
          },
        },
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.name",
            orders: { $sum: "$items.quantity" },
          },
        },
        { $sort: { orders: -1 } },
        { $limit: 10 },
        {
          $project: {
            name: "$_id",
            orders: 1,
            _id: 0,
          },
        },
      ])
      .toArray()

    // Hourly orders
    const hourlyOrders = await db
      .collection("orders")
      .aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
            status: { $ne: "cancelled" },
          },
        },
        {
          $group: {
            _id: { $hour: "$createdAt" },
            orders: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        {
          $project: {
            hour: { $concat: [{ $toString: "$_id" }, ":00"] },
            orders: 1,
            _id: 0,
          },
        },
      ])
      .toArray()

    return NextResponse.json({
      salesTrend,
      categoryBreakdown: categoryBreakdown[0]?.categories || [],
      topItems,
      hourlyOrders,
    })
  } catch (error) {
    console.error("Failed to fetch analytics:", error)
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 })
  }
}
