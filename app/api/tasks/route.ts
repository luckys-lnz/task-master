import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { subtasks, tasks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import * as z from "zod";

const tasksSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("LOW"),
  tags: z.array(z.string()).optional(),
  due_date: z.string().optional(),
  subtasks: z.array(z.object({
    title: z.string(),
    is_completed: z.boolean()
  })).optional(),
});

// GET /api/taskss - Get all taskss for the current user
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const usertaskss = await db.query.tasks.findMany({
      where: eq(tasks.user_id, session.user.id),
      orderBy: [tasks.position, tasks.created_at],
      with: {
        subtasks: true
      }
    });

    return NextResponse.json(usertaskss);
  } catch (error) {
    console.error("Error fetching taskss:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/taskss - Create a new tasks
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const json = await req.json();
    const body = tasksSchema.parse(json);

    // Get the highest position for ordering
    const lasttasks = await db.query.tasks.findFirst({
      where: eq(tasks.user_id, session.user.id),
      orderBy: [tasks.position],
      columns: {
        position: true
      }
    });

    const position = lasttasks ? String(Number(lasttasks.position) + 1) : "0";

    console.log("Attempting to create task. User ID from session:", session.user.id);
    console.log("Full session object:", JSON.stringify(session, null, 2)); // For more context
    // Create the tasks
    const [newtasks] = await db.insert(tasks).values({
      user_id: session.user.id,
      title: body.title,
      description: body.description || "",
      priority: body.priority,
      tags: body.tags || [],
      due_date: body.due_date ? new Date(body.due_date) : null,
      position,
      is_completed: false,
    }).returning();

    // Create subtasks if any
    if (body.subtasks?.length) {
      await db.insert(subtasks).values(
        body.subtasks.map(st => ({
          task_id: newtasks.id,
          title: st.title,
          is_completed: st.is_completed
        }))
      );
    }

    // Return tasks with subtaskss
    const tasksWithSubtasks = await db.query.tasks.findFirst({
      where: eq(tasks.id, newtasks.id),
      with: {
        subtasks: true
      }
    });

    return NextResponse.json(tasksWithSubtasks, { status: 201 });
  } catch (error) {
    console.error("Error creating tasks:", error);
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