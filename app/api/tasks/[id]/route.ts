import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { tasks, subtasks } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const updateTaskSchema = z.object({
  title: z.string(),
  description: z.string(),
  category: z.string(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  tags: z.array(z.string()),
  dueTime: z.string(),
  notes: z.string(),
  subtasks: z.array(z.object({
    id: z.string(),
    title: z.string(),
    completed: z.boolean(),
    task_id: z.string().optional() // Made task_id optional since we'll set it server-side
  })),
  completed: z.boolean().optional(),
  dueDate: z.string().optional()
}).partial();

// PATCH /api/tasks/[id] - Update a task
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    console.log("Received update data:", body);

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

    const validatedData = updateTaskSchema.parse(body);
    console.log("Validated data:", validatedData);

    await db
      .update(tasks)
      .set({
        ...validatedData,
        updated_at: new Date()
      })
      .where(and(eq(tasks.id, params.id), eq(tasks.user_id, userId)))
      .returning();

    // Handle subtasks update if present
    if (validatedData.subtasks) {
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
    return NextResponse.json(updatedTask);
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
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
    console.error("Task delete error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}