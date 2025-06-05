import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { tasks, subtasks } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import * as z from "zod";

const taskUpdateSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  description: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  tags: z.array(z.string()).optional(),
  due_date: z.string().optional(),
  is_completed: z.boolean().optional(),
  subtasks: z.array(z.object({
    id: z.string().optional(), // For existing subtasks
    title: z.string(),
    is_completed: z.boolean()
  })).optional(),
});

// GET /api/tasks/[id] - Get a single task
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const taskWithSubtasks = await db.query.tasks.findFirst({
      where: and(
        eq(tasks.id, params.id),
        eq(tasks.user_id, session.user.id)
      ),
      with: {
        subtasks: true
      }
    });

    if (!taskWithSubtasks) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(taskWithSubtasks);
  } catch (error) {
    console.error("Error fetching task:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/tasks/[id] - Update a task
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const json = await req.json();
    const body = taskUpdateSchema.parse(json);

    // First verify the task belongs to the user
    const existingTask = await db.query.tasks.findFirst({
      where: and(
        eq(tasks.id, params.id),
        eq(tasks.user_id, session.user.id)
      )
    });

    if (!existingTask) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }

    // Update the task
    const [updatedTask] = await db
      .update(tasks)
      .set({
        ...body,
        due_date: body.due_date ? new Date(body.due_date) : undefined,
        updated_at: new Date(),
      })
      .where(eq(tasks.id, params.id))
      .returning();

    // Handle subtasks if provided
    if (body.subtasks) {
      // Delete existing subtasks
      await db
        .delete(subtasks)
        .where(eq(subtasks.task_id, params.id));

      // Create new subtasks
      await db.insert(subtasks).values(
        body.subtasks.map(st => ({
          task_id: params.id,
          title: st.title,
          is_completed: st.is_completed
        }))
      );
    }

    // Return updated task with subtasks
    const taskWithSubtasks = await db.query.tasks.findFirst({
      where: eq(tasks.id, params.id),
      with: {
        subtasks: true
      }
    });

    return NextResponse.json(taskWithSubtasks);
  } catch (error) {
    console.error("Error updating task:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors },
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
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // First verify the task belongs to the user
    const existingTask = await db.query.tasks.findFirst({
      where: and(
        eq(tasks.id, params.id),
        eq(tasks.user_id, session.user.id)
      )
    });

    if (!existingTask) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }

    // Delete the task (subtasks will be deleted automatically due to ON DELETE CASCADE)
    await db
      .delete(tasks)
      .where(eq(tasks.id, params.id));

    return NextResponse.json(
      { message: "Task deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting task:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 