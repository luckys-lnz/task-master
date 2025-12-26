import { NextResponse } from "next/server";
import { getValidatedSession } from "@/lib/validate-session";
import { db } from "@/lib/db";
import { users, tasks, subtasks } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import { handleApiError } from "@/lib/errors";
import { z } from "zod";

const deleteAccountSchema = z.object({
  confirmation: z.literal("DELETE"),
});

export async function DELETE(req: Request) {
  try {
    const session = await getValidatedSession();
    const userId = session.user.id;

    const json = await req.json();
    const body = deleteAccountSchema.parse(json);

    if (body.confirmation !== "DELETE") {
      return NextResponse.json(
        { error: "Invalid confirmation. Type 'DELETE' to confirm." },
        { status: 400 }
      );
    }

    // Get all user's task IDs
    const userTasks = await db
      .select({ id: tasks.id })
      .from(tasks)
      .where(eq(tasks.user_id, userId));

    const taskIds = userTasks.map((t) => t.id);

    // Delete subtasks first
    if (taskIds.length > 0) {
      await db.delete(subtasks).where(inArray(subtasks.task_id, taskIds));
    }

    // Delete tasks
    if (taskIds.length > 0) {
      await db.delete(tasks).where(eq(tasks.user_id, userId));
    }

    // Delete user account
    await db.delete(users).where(eq(users.id, userId));

    return NextResponse.json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
