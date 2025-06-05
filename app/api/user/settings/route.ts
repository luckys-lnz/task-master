import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import * as z from "zod";

const userSettingsSchema = z.object({
  name: z.string().optional(),
  avatar_url: z.string().url().optional(),
  notifications_enabled: z.boolean().optional(),
  default_view: z.enum(["list", "grid"]).optional(),
  theme: z.enum(["light", "dark", "system"]).optional(),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userSettings = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
      columns: {
        name: true,
        avatar_url: true,
        notifications_enabled: true,
        default_view: true,
        theme: true,
      }
    });

    return NextResponse.json(userSettings);
  } catch (error) {
    console.error("Error fetching user settings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const json = await req.json();
    const body = userSettingsSchema.parse(json);

    const updatedUser = await db
      .update(users)
      .set({
        ...body,
        // Don't allow updating email through this endpoint
        email: undefined,
      })
      .where(eq(users.id, session.user.id))
      .returning();

    return NextResponse.json(updatedUser[0]);
  } catch (error) {
    console.error("Error updating user settings:", error);
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