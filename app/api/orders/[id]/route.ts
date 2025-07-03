import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { db } = await connectToDatabase()
    const { id } = params

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 })
    }

    const order = await db.collection("orders").findOne({ _id: new ObjectId(id) })

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    return NextResponse.json(order)
  } catch (error) {
    console.error("Failed to fetch order:", error)
    return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { db } = await connectToDatabase()
    const { id } = params
    const body = await request.json()

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 })
    }

    const updateData: any = {
      updatedAt: new Date(),
    }

    if (body.status !== undefined) updateData.status = body.status
    if (body.customerName !== undefined) updateData.customerName = body.customerName
    if (body.items !== undefined) updateData.items = body.items
    if (body.total !== undefined) updateData.total = Number(body.total)
    if (body.paymentMethod !== undefined) updateData.paymentMethod = body.paymentMethod

    const result = await db.collection("orders").updateOne({ _id: new ObjectId(id) }, { $set: updateData })

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    const updatedOrder = await db.collection("orders").findOne({ _id: new ObjectId(id) })

    return NextResponse.json(updatedOrder)
  } catch (error) {
    console.error("Failed to update order:", error)
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { db } = await connectToDatabase()
    const { id } = params

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 })
    }

    const result = await db.collection("orders").deleteOne({ _id: new ObjectId(id) })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Order deleted successfully" })
  } catch (error) {
    console.error("Failed to delete order:", error)
    return NextResponse.json({ error: "Failed to delete order" }, { status: 500 })
  }
}
