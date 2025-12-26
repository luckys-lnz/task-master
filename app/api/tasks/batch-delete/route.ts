import { NextResponse } from "next/server";
import { getValidatedSession } from "@/lib/validate-session";
import { db } from "@/lib/db";
import { tasks, subtasks } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { z } from "zod";
import { handleApiError } from "@/lib/errors";

const batchDeleteSchema = z.object({
  taskIds: z.array(z.string()).min(1, "At least one task ID is required"),
});

// DELETE /api/tasks/batch-delete - Delete multiple tasks at once
export async function DELETE(req: Request) {
  try {
    const session = await getValidatedSession();
    const userId = session.user.id;

    const body = await req.json();
    const { taskIds } = batchDeleteSchema.parse(body);

    // Verify all tasks belong to the user
    const userTasks = await db
      .select({ id: tasks.id })
      .from(tasks)
      .where(and(eq(tasks.user_id, userId), inArray(tasks.id, taskIds)));

    const validTaskIds = userTasks.map((t) => t.id);

    if (validTaskIds.length === 0) {
      return NextResponse.json(
        { error: "No valid tasks found to delete" },
        { status: 404 }
      );
    }

    // Delete subtasks first (if not using ON DELETE CASCADE)
    await db.delete(subtasks).where(inArray(subtasks.task_id, validTaskIds));

    // Batch delete tasks
    await db.delete(tasks).where(and(eq(tasks.user_id, userId), inArray(tasks.id, validTaskIds)));

    return NextResponse.json({ 
      success: true, 
      deletedCount: validTaskIds.length 
    });
  } catch (error) {
    return handleApiError(error);
  }
}
