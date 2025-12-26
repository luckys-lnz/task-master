import { NextResponse } from "next/server";
import { getValidatedSession } from "@/lib/validate-session";
import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import * as z from "zod";
import { handleApiError } from "@/lib/errors";

const reorderSchema = z.object({
  items: z.array(z.object({
    id: z.string(),
    position: z.number()
  }))
});

export async function POST(req: Request) {
  try {
    const session = await getValidatedSession();
    const userId = session.user.id;

    const json = await req.json();
    const { items } = reorderSchema.parse(json);

    // Update each task's position (only for user's own tasks)
    await Promise.all(
      items.map(({ id, position }) =>
        db
          .update(tasks)
          .set({ position: position.toString() })
          .where(and(eq(tasks.id, id), eq(tasks.user_id, userId)))
      )
    );

    return NextResponse.json(
      { message: "Tasks reordered successfully" },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error);
  }
} 