import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

async function testDatabase() {
  try {
    console.log("Testing database connection...")
    
    // Test connection by querying the users table
    const result = await db.select().from(users).limit(1)
    console.log("✅ Database connection successful")
    console.log("Current users:", result)

    // Test inserting a test user
    const testUser = {
      id: "test-user-123",
      name: "Test User",
      email: "test@example.com",
    }

    console.log("\nTesting user insertion...")
    await db.insert(users).values(testUser)
    console.log("✅ Test user inserted successfully")

    // Test querying the inserted user
    console.log("\nTesting user query...")
    const insertedUser = await db.select().from(users).where(eq(users.id, testUser.id))
    console.log("✅ User query successful")
    console.log("Inserted user:", insertedUser)

    // Clean up: delete the test user
    console.log("\nCleaning up test data...")
    await db.delete(users).where(eq(users.id, testUser.id))
    console.log("✅ Test data cleaned up")

  } catch (error) {
    console.error("❌ Database test failed:", error)
    process.exit(1)
  }
}

testDatabase() 