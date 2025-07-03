import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const status = searchParams.get("status")
    const search = searchParams.get("search")
    const paymentMethod = searchParams.get("paymentMethod")
    const dateFrom = searchParams.get("dateFrom")
    const dateTo = searchParams.get("dateTo")

    const skip = (page - 1) * limit

    const { db } = await connectToDatabase()

    const filter: any = { status: { $in: ["completed", "paid"] } }

    if (status && status !== "all") {
      if (status === "paid") {
        filter.status = "completed"
      } else {
        filter.status = status
      }
    }

    if (search) {
      filter.$or = [
        { orderNumber: { $regex: search, $options: "i" } },
        { customerName: { $regex: search, $options: "i" } },
      ]
    }

    if (paymentMethod && paymentMethod !== "all") {
      filter.paymentMethod = paymentMethod
    }

    if (dateFrom || dateTo) {
      filter.createdAt = {}
      if (dateFrom) {
        filter.createdAt.$gte = new Date(dateFrom)
      }
      if (dateTo) {
        filter.createdAt.$lte = new Date(dateTo)
      }
    }

    // Get total count for pagination
    const total = await db.collection("orders").countDocuments(filter)

    // Get paginated orders and convert them to bills
    const orders = await db.collection("orders").find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray()

    const bills = orders.map((order) => {
      const subtotal = order.total  
      const tax = order.total - subtotal

      return {
        _id: order._id,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        items: order.items,
        subtotal: subtotal,
        tax: tax,
        total: order.total,
        paymentMethod: order.paymentMethod || "Cash",
        status: order.status === "completed" ? "paid" : order.status,
        createdAt: order.createdAt,
      }
    })

    return NextResponse.json({
      bills,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Failed to fetch billing data:", error)
    return NextResponse.json({ error: "Failed to fetch billing data" }, { status: 500 })
  }
}
