import { NextResponse } from "next/server";
import { getValidatedSession } from "@/lib/validate-session";
import { db } from "@/lib/db";
import { tasks, subtasks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import * as z from "zod";
import { handleApiError } from "@/lib/errors";
import { mapTaskToCamelCase, isTaskOverdue } from "@/lib/utils";
import { updateOverdueTasks } from "@/lib/task-utils";

const taskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  tags: z.array(z.string()).optional(),
  due_date: z.string().optional(),
  due_time: z.string().optional(),
  category: z.string().optional(),
  notes: z.string().optional(),
  attachments: z.array(z.string()).optional(),
  locked_after_due: z.boolean().optional().default(true),
  duplicated_from_task_id: z.string().uuid().optional(),
  subtasks: z.array(z.object({
    title: z.string(),
    completed: z.boolean().optional().default(false)
  })).optional(),
});

// GET /api/tasks - Get all tasks for the current user
export async function GET() {
  try {
    const session = await getValidatedSession();

    // First, update any overdue tasks
    await updateOverdueTasks();

    const userTasks = await db.query.tasks.findMany({
      where: eq(tasks.user_id, session.user.id),
      orderBy: [tasks.position, tasks.created_at],
      with: {
        subtasks: true,
      },
    });

    const tasksForFrontend = userTasks.map(mapTaskToCamelCase);

    return NextResponse.json(tasksForFrontend);
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/tasks - Create a new task
export async function POST(req: Request) {
  try {
    const session = await getValidatedSession();

    const json = await req.json();
    // Accept both camelCase and snake_case from frontend
    const body = taskSchema.parse({
      ...json,
      due_date: json.due_date || json.dueDate,
      due_time: json.due_time || json.dueTime,
      duplicated_from_task_id: json.duplicated_from_task_id || json.duplicatedFromTaskId,
    });

    // Get the current highest position for ordering
    const lastTask = await db.query.tasks.findFirst({
      where: eq(tasks.user_id, session.user.id),
      orderBy: [tasks.position],
      columns: { position: true }
    });

    const position = lastTask ? String(Number(lastTask.position) + 1) : "0";

    // Determine initial status - check if task is already overdue
    let initialStatus: "PENDING" | "COMPLETED" | "OVERDUE" = "PENDING";
    let overdueAt: Date | null = null;
    
    if (body.due_date) {
      const taskToCheck = {
        due_date: new Date(body.due_date),
        due_time: body.due_time || null,
        status: "PENDING" as const,
      };
      if (isTaskOverdue(taskToCheck)) {
        initialStatus = "OVERDUE";
        overdueAt = new Date();
      }
    }

    // Insert new task
    const [newTask] = await db.insert(tasks).values({
      user_id: session.user.id,
      title: body.title,
      description: body.description || "",
      priority: body.priority,
      tags: body.tags || [],
      due_date: body.due_date ? new Date(body.due_date) : null,
      due_time: body.due_time || null,
      category: body.category || null,
      notes: body.notes || null,
      attachments: body.attachments || [],
      position,
      status: initialStatus,
      overdue_at: overdueAt,
      locked_after_due: body.locked_after_due ?? true,
      duplicated_from_task_id: body.duplicated_from_task_id || null,
    }).returning();

    // Insert subtasks if any
    if (body.subtasks?.length) {
      await db.insert(subtasks).values(
        body.subtasks.map(st => ({
          task_id: newTask.id,
          title: st.title,
          completed: st.completed || false,
        }))
      );
    }

    // Fetch and return task with subtasks
    const taskWithSubtasks = await db.query.tasks.findFirst({
      where: eq(tasks.id, newTask.id),
      with: { subtasks: true },
    });

    return NextResponse.json(mapTaskToCamelCase(taskWithSubtasks), { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
