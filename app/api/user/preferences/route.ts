import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { handleApiError, UnauthorizedError } from "@/lib/errors";

const preferencesSchema = z.object({
  notificationsEnabled: z.boolean(),
  defaultView: z.enum(["list", "grid"]),
  theme: z.enum(["light", "dark", "system"]),
});

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      throw new UnauthorizedError();
    }

    const body = await req.json();
    const validatedData = preferencesSchema.parse(body);

    // Update user preferences
    await db
      .update(users)
      .set({
        notifications_enabled: validatedData.notificationsEnabled,
        default_view: validatedData.defaultView,
        theme: validatedData.theme,
      })
      .where(eq(users.id, session.user.id));

    return NextResponse.json(
      { message: "Preferences updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error);
  }
} 