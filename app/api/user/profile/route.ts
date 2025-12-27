import { NextResponse } from "next/server";
import { getValidatedSession } from "@/lib/validate-session";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import * as z from "zod";
import { handleApiError } from "@/lib/errors";

const profileSchema = z.object({
  name: z.string().min(3, "Display name must be at least 3 characters").max(100, "Name must be less than 100 characters"),
  avatarUrl: z.preprocess(
    (val) => {
      // Convert empty string, null, or undefined to undefined
      if (!val || val === "" || val === null) return undefined;
      return val;
    },
    z.string().optional().refine(
      (val) => !val || val.startsWith("data:image/") || val.startsWith("http://") || val.startsWith("https://"),
      { message: "Please enter a valid image URL or data URL" }
    )
  ),
  location: z.string().optional(),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
});

export async function PATCH(req: Request) {
  try {
    const session = await getValidatedSession();

    const json = await req.json();
    const body = profileSchema.parse(json);

    const updatedUser = await db.update(users)
      .set({
        name: body.name,
        avatar_url: body.avatarUrl || null,
        image: body.avatarUrl || null, // Also update image field for NextAuth compatibility
      })
      .where(eq(users.id, session.user.id))
      .returning();

    return NextResponse.json({
      ...updatedUser[0],
      message: "Profile updated successfully"
    });
  } catch (error) {
    return handleApiError(error);
  }
} 