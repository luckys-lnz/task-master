import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import * as z from "zod";

const reorderSchema = z.object({
  items: z.array(z.object({
    id: z.string(),
    position: z.number()
  }))
});

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
    const { items } = reorderSchema.parse(json);

    // Update each task's position
    await Promise.all(
      items.map(({ id, position }) =>
        db
          .update(tasks)
          .set({ position: position.toString() })
          .where(eq(tasks.id, id))
      )
    );

    return NextResponse.json(
      { message: "Tasks reordered successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error reordering tasks:", error);
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