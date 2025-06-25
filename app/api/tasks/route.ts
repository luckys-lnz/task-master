import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { tasks, subtasks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import * as z from "zod";

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
  subtasks: z.array(z.object({
    title: z.string(),
    is_completed: z.boolean()
  })).optional(),
});

// GET /api/tasks - Get all tasks for the current user
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userTasks = await db.query.tasks.findMany({
      where: eq(tasks.user_id, session.user.id),
      orderBy: [tasks.position, tasks.created_at],
      with: {
        subtasks: true,
      },
    });

    // Map DB fields to camelCase for frontend
    function mapTaskDbFieldsToCamelCase(taskFromDb: any) {
      return {
        ...taskFromDb,
        dueDate: taskFromDb.due_date,
        dueTime: taskFromDb.due_time,
      };
    }

    const tasksForFrontend = userTasks.map(mapTaskDbFieldsToCamelCase);

    return NextResponse.json(tasksForFrontend);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/tasks - Create a new task
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await req.json();
    // Accept both camelCase and snake_case from frontend
    const body = taskSchema.parse({
      ...json,
      due_date: json.due_date || json.dueDate,
      due_time: json.due_time || json.dueTime,
    });

    // Get the current highest position for ordering
    const lastTask = await db.query.tasks.findFirst({
      where: eq(tasks.user_id, session.user.id),
      orderBy: [tasks.position],
      columns: { position: true }
    });

    const position = lastTask ? String(Number(lastTask.position) + 1) : "0";

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
      completed: false,
    }).returning();

    // Insert subtasks if any
    if (body.subtasks?.length) {
      await db.insert(subtasks).values(
        body.subtasks.map(st => ({
          task_id: newTask.id,
          title: st.title,
          is_completed: st.is_completed,
        }))
      );
    }

    // Fetch and return task with subtasks
    const taskWithSubtasks = await db.query.tasks.findFirst({
      where: eq(tasks.id, newTask.id),
      with: { subtasks: true },
    });

    // Map DB fields to camelCase for frontend
    function mapTaskDbFieldsToCamelCase(taskFromDb: any) {
      return {
        ...taskFromDb,
        dueDate: taskFromDb.due_date,
        dueTime: taskFromDb.due_time,
      };
    }

    return NextResponse.json(mapTaskDbFieldsToCamelCase(taskWithSubtasks), { status: 201 });
  } catch (error) {
    console.error("Error creating task:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
