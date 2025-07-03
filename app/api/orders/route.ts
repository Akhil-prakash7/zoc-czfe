import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const status = searchParams.get("status")
    const search = searchParams.get("search")
    const dateFrom = searchParams.get("dateFrom")
    const dateTo = searchParams.get("dateTo")

    const skip = (page - 1) * limit

    const { db } = await connectToDatabase()

    const filter: any = {}

    if (status && status !== "all") {
      filter.status = status
    }

    if (search) {
      filter.$or = [
        { orderNumber: { $regex: search, $options: "i" } },
        { customerName: { $regex: search, $options: "i" } },
        { "items.name": { $regex: search, $options: "i" } },
      ]
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

    const total = await db.collection("orders").countDocuments(filter)

    const orders = await db.collection("orders").find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray()

    return NextResponse.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Failed to fetch orders:", error)
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { db } = await connectToDatabase()
    const body = await request.json()

    const orderCount = await db.collection("orders").countDocuments()
    const orderNumber = `ORD-${String(orderCount + 1).padStart(4, "0")}`

    const order = {
      orderNumber,
      customerName: body.customerName,
      items: body.items,
      total: body.total,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection("orders").insertOne(order)

    return NextResponse.json(
      {
        _id: result.insertedId,
        ...order,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Failed to create order:", error)
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 })
  }
}
