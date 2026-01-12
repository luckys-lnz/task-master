import { NextResponse } from "next/server";
import { updateOverdueTasks } from "@/lib/task-utils";
import { headers } from "next/headers";

/**
 * Cron endpoint to update overdue tasks
 * 
 * Configure in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/update-overdue",
 *     "schedule": "*/5 * * * *"
 *   }]
 * }
 * 
 * Or use external cron service to call this endpoint
 */
export async function GET(req: Request) {
  try {
    // Optional: Add authentication for cron endpoint
    const headersList = headers();
    const authHeader = headersList.get("authorization");
    
    // Verify cron secret if set
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
      if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const updatedTasks = await updateOverdueTasks();

    return NextResponse.json({
      success: true,
      updatedCount: updatedTasks.length,
      updatedTasks: updatedTasks.map(t => ({ id: t.id, title: t.title })),
    });
  } catch (error) {
    console.error("Error updating overdue tasks:", error);
    return NextResponse.json(
      { error: "Failed to update overdue tasks" },
      { status: 500 }
    );
  }
}
