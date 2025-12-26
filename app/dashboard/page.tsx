import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardClient } from "./page-cli";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { validateUserExists } from "@/lib/auth-utils";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  // Validate user still exists in database
  const user = await validateUserExists(session.user.id);
  if (!user) {
    redirect("/auth/signin");
  }

  // Test database connection
  let dbConnected = false;
  try {
    // Simple query to test connection
    await db.execute(sql`SELECT 1`);
    dbConnected = true;
  } catch (error) {
    console.error("Database connection check failed:", error);
    dbConnected = false;
  }

  return (
    <DashboardClient 
      userName={session.user?.name || "User"} 
      dbConnected={dbConnected}
    />
  );
}