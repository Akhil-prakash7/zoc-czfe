import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET() {
  try {
    console.log("Testing database connection...")

    const { db } = await connectToDatabase()

    // Test basic operations
    const testCollection = db.collection("test")

    // Insert a test document
    const insertResult = await testCollection.insertOne({
      test: true,
      timestamp: new Date(),
    })

    // Read it back
    const testDoc = await testCollection.findOne({ _id: insertResult.insertedId })

    // Clean up
    await testCollection.deleteOne({ _id: insertResult.insertedId })

    return NextResponse.json({
      success: true,
      message: "Database connection successful",
      testDocument: testDoc,
      environment: process.env.NODE_ENV,
      hasMongoUri: !!process.env.MONGODB_URI,
    })
  } catch (error) {
    console.error("Database test failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        environment: process.env.NODE_ENV,
        hasMongoUri: !!process.env.MONGODB_URI,
      },
      { status: 500 },
    )
  }
}
