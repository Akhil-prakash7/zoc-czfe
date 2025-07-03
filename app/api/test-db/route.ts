import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET() {
  try {
    console.log("Testing database connection...")

    const { db } = await connectToDatabase()

    const collections = await db.listCollections().toArray()
    const stats = await db.stats()

    return NextResponse.json({
      success: true,
      message: "Database connection successful",
      environment: process.env.NODE_ENV,
      collections: collections.map((c) => c.name),
      dbStats: {
        collections: stats.collections,
        objects: stats.objects,
        dataSize: stats.dataSize,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Database connection test failed:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Database connection failed",
        details: error instanceof Error ? error.message : "Unknown error",
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
