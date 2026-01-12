import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { and, eq, lt, sql } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type * as schema from "@/lib/db/schema";

type DB = NodePgDatabase<typeof schema>;

/**
 * Update overdue tasks automatically
 * Marks tasks as OVERDUE if they are past their due date/time and still PENDING
 * 
 * Matches specification: Updates tasks where due_date < now and status = PENDING
 */
export async function updateOverdueTasks(dbInstance: DB = db) {
  const now = new Date();

  // Find tasks that are overdue
  // A task is overdue if:
  // 1. It has a due_date
  // 2. The due date/time has passed
  // 3. Status is still PENDING

  // Use raw SQL for complex date/time comparison
  // This handles both cases: with and without due_time
  const nowISO = now.toISOString();
  const overdueTasks = await dbInstance
    .update(tasks)
    .set({
      status: "OVERDUE",
      overdue_at: now,
      updated_at: now,
    })
    .where(
      and(
        eq(tasks.status, "PENDING"),
        sql`${tasks.due_date} IS NOT NULL`,
        sql`(
          CASE 
            WHEN ${tasks.due_time} IS NULL 
            THEN ${tasks.due_date} < ${sql.raw(`'${nowISO}'`)}::timestamp
            ELSE (${tasks.due_date}::date + ${tasks.due_time}::time) < ${sql.raw(`'${nowISO}'`)}::timestamp
          END
        )`
      )
    )
    .returning();

  return overdueTasks;
}

/**
 * Check if a task is locked (overdue and locked_after_due is true)
 */
export function isTaskLocked(task: {
  status: string;
  locked_after_due: boolean;
}): boolean {
  return task.status === "OVERDUE" && task.locked_after_due;
}

/**
 * Validate if a task can be updated
 * Throws error if task is locked
 */
export function validateTaskCanBeUpdated(task: {
  status: string;
  locked_after_due: boolean;
}): void {
  if (isTaskLocked(task)) {
    throw new Error(
      "This task is locked because it is overdue. Complete or duplicate it instead."
    );
  }
}
