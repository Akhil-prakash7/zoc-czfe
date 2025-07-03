import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { db } = await connectToDatabase()
    const { id } = params

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid menu item ID" }, { status: 400 })
    }

    const menuItem = await db.collection("menuItems").findOne({ _id: new ObjectId(id) })

    if (!menuItem) {
      return NextResponse.json({ error: "Menu item not found" }, { status: 404 })
    }

    return NextResponse.json(menuItem)
  } catch (error) {
    console.error("Failed to fetch menu item:", error)
    return NextResponse.json({ error: "Failed to fetch menu item" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { db } = await connectToDatabase()
    const { id } = params
    const body = await request.json()

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid menu item ID" }, { status: 400 })
    }

    const updateData: any = {
      updatedAt: new Date(),
    }

    //update
    if (body.name !== undefined) updateData.name = body.name
    if (body.description !== undefined) updateData.description = body.description
    if (body.price !== undefined) updateData.price = Number(body.price)
    if (body.category !== undefined) updateData.category = body.category
    if (body.available !== undefined) updateData.available = Boolean(body.available)

    const result = await db.collection("menuItems").updateOne({ _id: new ObjectId(id) }, { $set: updateData })

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Menu item not found" }, { status: 404 })
    }

    const updatedMenuItem = await db.collection("menuItems").findOne({ _id: new ObjectId(id) })

    return NextResponse.json(updatedMenuItem)
  } catch (error) {
    console.error("Failed to update menu item:", error)
    return NextResponse.json({ error: "Failed to update menu item" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { db } = await connectToDatabase()
    const { id } = params

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid menu item ID" }, { status: 400 })
    }

    const result = await db.collection("menuItems").deleteOne({ _id: new ObjectId(id) })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Menu item not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Menu item deleted successfully" })
  } catch (error) {
    console.error("Failed to delete menu item:", error)
    return NextResponse.json({ error: "Failed to delete menu item" }, { status: 500 })
  }
}
