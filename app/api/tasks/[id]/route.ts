import { NextResponse } from "next/server";
import { getValidatedSession } from "@/lib/validate-session";
import { db } from "@/lib/db";
import { tasks, subtasks } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { mapTaskToCamelCase, isTaskOverdue } from "@/lib/utils";
import { handleApiError } from "@/lib/errors";
import { validateTaskCanBeUpdated, isTaskLocked } from "@/lib/task-utils";

const updateTaskSchema = z.object({
  title: z.string(),
  description: z.string(),
  category: z.string(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  status: z.enum(["PENDING", "COMPLETED", "OVERDUE"]).optional(),
  tags: z.array(z.string()),
  dueTime: z.string(),
  notes: z.string(),
  locked_after_due: z.boolean().optional(),
  subtasks: z.array(z.object({
    id: z.string(),
    title: z.string(),
    completed: z.boolean(),
    task_id: z.string().optional() // Made task_id optional since we'll set it server-side
  })),
  dueDate: z.string().optional()
}).partial();

// PATCH /api/tasks/[id] - Update a task
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getValidatedSession();
    const userId = session.user.id;

    const body = await req.json();

    // Add task_id to subtasks before validation
    if (body.subtasks) {
      interface SubtaskInput {
        id: string;
        title: string;
        completed: boolean;
        task_id?: string;
      }

      body.subtasks = (body.subtasks as SubtaskInput[]).map((subtask: SubtaskInput) => ({
        ...subtask,
        task_id: params.id
      }));
    }

    // Get current task to check lock status
    const currentTask = await db.query.tasks.findFirst({
      where: and(eq(tasks.id, params.id), eq(tasks.user_id, userId))
    });

    if (!currentTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Check if task is locked (overdue and locked_after_due is true)
    // Allow status change to COMPLETED even if locked
    const isCompleting = body.status === "COMPLETED" && currentTask.status !== "COMPLETED";
    const isLocked = isTaskLocked(currentTask);
    
    // If locked and not completing, block ALL edits except status change to COMPLETED
    if (isLocked && !isCompleting) {
      // Check if trying to edit any fields other than status
      const hasEdits = 
        body.title !== undefined ||
        body.description !== undefined ||
        body.category !== undefined ||
        body.priority !== undefined ||
        body.tags !== undefined ||
        body.dueDate !== undefined ||
        body.dueTime !== undefined ||
        body.notes !== undefined ||
        body.subtasks !== undefined ||
        body.locked_after_due !== undefined;
      
      if (hasEdits) {
        return NextResponse.json(
          { 
            error: "This task is locked because it is overdue. Complete or duplicate it instead.",
            code: "TASK_LOCKED"
          },
          { status: 403 }
        );
      }
    }

    const validatedData = updateTaskSchema.parse(body);

    // Prepare update data
    const now = new Date();
    const updateData: any = {
      ...validatedData,
      updated_at: now,
    };

    // Handle status transitions according to specification
    if (validatedData.status !== undefined) {
      const newStatus = validatedData.status;
      const oldStatus = currentTask.status;

      // PENDING → COMPLETED: set completed_at, clear overdue_at
      if (oldStatus === "PENDING" && newStatus === "COMPLETED") {
        updateData.completed_at = now;
        updateData.overdue_at = null;
      }
      // OVERDUE → COMPLETED: set completed_at, clear overdue_at
      else if (oldStatus === "OVERDUE" && newStatus === "COMPLETED") {
        updateData.completed_at = now;
        updateData.overdue_at = null;
      }
      // COMPLETED → PENDING: clear completed_at, clear overdue_at if any
      else if (oldStatus === "COMPLETED" && newStatus === "PENDING") {
        updateData.completed_at = null;
        updateData.overdue_at = null;
      }
      // OVERDUE → PENDING: clear overdue_at (when due_date extended)
      else if (oldStatus === "OVERDUE" && newStatus === "PENDING") {
        updateData.overdue_at = null;
      }
      // PENDING → OVERDUE: set overdue_at (should be automatic, but handle manual case)
      else if (oldStatus === "PENDING" && newStatus === "OVERDUE") {
        updateData.overdue_at = now;
      }
    }

    // Auto-update status based on due date if dueDate or dueTime changed
    // Only allow this if task is not locked (locked tasks can't edit due dates)
    if (!isLocked && (validatedData.dueDate !== undefined || validatedData.dueTime !== undefined)) {
      const taskToCheck = {
        due_date: validatedData.dueDate ? new Date(validatedData.dueDate) : currentTask.due_date,
        due_time: validatedData.dueTime !== undefined ? validatedData.dueTime : currentTask.due_time,
        status: validatedData.status || currentTask.status,
      };

      // Only auto-update if status wasn't explicitly set to COMPLETED
      if (updateData.status !== "COMPLETED") {
        if (isTaskOverdue(taskToCheck)) {
          updateData.status = "OVERDUE";
          updateData.overdue_at = now;
        } else if (taskToCheck.due_date) {
          // If not overdue and has due date, set to PENDING
          updateData.status = "PENDING";
          updateData.overdue_at = null;
        }
      }
    }
    
    // Block editing other fields when locked (except status change to COMPLETED)
    if (isLocked && !isCompleting) {
      // Remove all fields except status from updateData
      const allowedFields = ['status', 'updated_at'];
      Object.keys(updateData).forEach(key => {
        if (!allowedFields.includes(key)) {
          delete updateData[key];
        }
      });
    }

    await db
      .update(tasks)
      .set(updateData)
      .where(and(eq(tasks.id, params.id), eq(tasks.user_id, userId)))
      .returning();

    // Handle subtasks update if present
    if (validatedData.subtasks !== undefined) {
      // Check if parent task is locked (only if not completing)
      if (isTaskLocked(currentTask) && !isCompleting) {
        return NextResponse.json(
          { 
            error: "Cannot update subtasks of an overdue locked task.",
            code: "SUBTASK_LOCKED"
          },
          { status: 403 }
        );
      }

      // Remove old subtasks for this task
      await db.delete(subtasks).where(eq(subtasks.task_id, params.id));
      // Insert new subtasks
      if (validatedData.subtasks.length > 0) {
        await db.insert(subtasks).values(validatedData.subtasks.map(st => ({
          ...st,
          task_id: params.id
        })));
      }
    }

    const updatedTask = await db.query.tasks.findFirst({
      where: eq(tasks.id, params.id),
      with: { subtasks: true }
    });

    return NextResponse.json(mapTaskToCamelCase(updatedTask));
  } catch (error) {
    console.error("Task update error:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/tasks/[id] - Delete a task
export async function DELETE(
  _: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getValidatedSession();
    const userId = session.user.id;

    // Optionally, delete subtasks first if not using ON DELETE CASCADE
    await db.delete(subtasks).where(eq(subtasks.task_id, params.id));

    // Delete the task
    const deleted = await db
      .delete(tasks)
      .where(and(eq(tasks.id, params.id), eq(tasks.user_id, userId)))
      .returning();

    if (!deleted.length) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}