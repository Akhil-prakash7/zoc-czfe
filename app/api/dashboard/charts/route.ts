import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { subDays, subYears } from "date-fns"

export async function GET(request: Request) {
  try {
    const { db } = await connectToDatabase()
    const { searchParams } = new URL(request.url)

    const range = searchParams.get("range")
    const fromDate = searchParams.get("from")
    const toDate = searchParams.get("to")

    let startDate: Date
    let endDate: Date = new Date()

    if (fromDate && toDate) {
      startDate = new Date(fromDate)
      endDate = new Date(toDate)
    } else {
      switch (range) {
        case "1d":
          startDate = subDays(endDate, 1)
          break
        case "7d":
          startDate = subDays(endDate, 7)
          break
        case "30d":
          startDate = subDays(endDate, 30)
          break
        case "90d":
          startDate = subDays(endDate, 90)
          break
        case "1y":
          startDate = subYears(endDate, 1)
          break
        default:
          startDate = subDays(endDate, 7)
      }
    }

    //  sales 
    const salesData = await db
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
            day: {
              $let: {
                vars: {
                  date: { $dateFromString: { dateString: "$_id" } },
                },
                in: {
                  $switch: {
                    branches: [
                      { case: { $eq: [{ $dayOfWeek: "$$date" }, 1] }, then: "Sun" },
                      { case: { $eq: [{ $dayOfWeek: "$$date" }, 2] }, then: "Mon" },
                      { case: { $eq: [{ $dayOfWeek: "$$date" }, 3] }, then: "Tue" },
                      { case: { $eq: [{ $dayOfWeek: "$$date" }, 4] }, then: "Wed" },
                      { case: { $eq: [{ $dayOfWeek: "$$date" }, 5] }, then: "Thu" },
                      { case: { $eq: [{ $dayOfWeek: "$$date" }, 6] }, then: "Fri" },
                      { case: { $eq: [{ $dayOfWeek: "$$date" }, 7] }, then: "Sat" },
                    ],
                    default: "Unknown",
                  },
                },
              },
            },
            sales: 1,
            _id: 0,
          },
        },
      ])
      .toArray()

    //  category 
    const categoryData = await db
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
                  value: {
                    $round: [{ $multiply: [{ $divide: ["$$cat.value", "$total"] }, 100] }, 1],
                  },
                },
              },
            },
            _id: 0,
          },
        },
      ])
      .toArray()

    return NextResponse.json({
      sales: salesData,
      categories: categoryData[0]?.categories || [],
    })
  } catch (error) {
    console.error("Failed to fetch chart data:", error)
    return NextResponse.json({ error: "Failed to fetch chart data" }, { status: 500 })
  }
}
