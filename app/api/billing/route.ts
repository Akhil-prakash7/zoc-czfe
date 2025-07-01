import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET() {
  try {
    const { db } = await connectToDatabase()

    // Get all completed orders and convert them to bills
    const orders = await db
      .collection("orders")
      .find({ status: { $in: ["completed", "paid"] } })
      .sort({ createdAt: -1 })
      .toArray()

    const bills = orders.map((order) => {
      const subtotal = order.total / 1.08 // Assuming 8% tax
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

    return NextResponse.json(bills)
  } catch (error) {
    console.error("Failed to fetch billing data:", error)
    return NextResponse.json({ error: "Failed to fetch billing data" }, { status: 500 })
  }
}
