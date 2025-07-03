import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const category = searchParams.get("category")
    const search = searchParams.get("search")
    const available = searchParams.get("available")

    const skip = (page - 1) * limit

    const { db } = await connectToDatabase()

    const filter: any = {}

    if (category && category !== "all") {
      filter.category = category
    }

    if (available && available !== "all") {
      filter.available = available === "true"
    }

    if (search) {
      filter.$or = [{ name: { $regex: search, $options: "i" } }, { description: { $regex: search, $options: "i" } }]
    }

    const total = await db.collection("menuItems").countDocuments(filter)

    const menuItems = await db
      .collection("menuItems")
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray()

    return NextResponse.json({
      menuItems,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Failed to fetch menu items:", error)
    return NextResponse.json({ error: "Failed to fetch menu items" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("Creating new menu item...")

    let body
    try {
      body = await request.json()
    } catch (parseError) {
      console.error("Failed to parse request body:", parseError)
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 })
    }

    if (!body.name || !body.price || !body.category) {
      return NextResponse.json(
        { error: "Missing required fields: name, price, and category are required" },
        { status: 400 },
      )
    }

    //  price
    const price = Number(body.price)
    if (isNaN(price) || price <= 0) {
      return NextResponse.json({ error: "Price must be a valid positive number" }, { status: 400 })
    }

    console.log("Connecting to database...")
    const { db } = await connectToDatabase()

    const menuItem = {
      name: String(body.name).trim(),
      description: String(body.description || "").trim(),
      price: price,
      category: String(body.category).trim(),
      available: Boolean(body.available !== false), // Default to true
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    console.log("Inserting menu item:", menuItem)
    const result = await db.collection("menuItems").insertOne(menuItem)

    if (!result.insertedId) {
      throw new Error("Failed to insert menu item")
    }

    const createdItem = {
      _id: result.insertedId,
      ...menuItem,
    }

    console.log("Menu item created successfully:", result.insertedId)
    return NextResponse.json(createdItem, { status: 201 })
  } catch (error) {
    console.error("Failed to create menu item:", error)

    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    const errorDetails = {
      error: "Failed to create menu item",
      details: errorMessage,
      timestamp: new Date().toISOString(),
    }

    if (errorMessage.includes("connect") || errorMessage.includes("timeout")) {
      errorDetails.error = "Database connection failed"
    }

    return NextResponse.json(errorDetails, { status: 500 })
  }
}
