import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET() {
  try {
    const { db } = await connectToDatabase()

    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000)

    const statusCounts = await db
      .collection("orders")
      .aggregate([
        {
          $facet: {
            pending: [{ $match: { status: "pending" } }, { $count: "count" }],
            preparing: [{ $match: { status: "preparing" } }, { $count: "count" }],
            ready: [{ $match: { status: "ready" } }, { $count: "count" }],
            completed: [
              {
                $match: {
                  status: "completed",
                  createdAt: { $gte: startOfDay, $lt: endOfDay },
                },
              },
              { $count: "count" },
            ],
          },
        },
      ])
      .toArray()

    const result = statusCounts[0]

    return NextResponse.json({
      pending: result.pending[0]?.count || 0,
      preparing: result.preparing[0]?.count || 0,
      ready: result.ready[0]?.count || 0,
      completed: result.completed[0]?.count || 0,
    })
  } catch (error) {
    console.error("Failed to fetch order status:", error)
    return NextResponse.json({ error: "Failed to fetch order status" }, { status: 500 })
  }
}
