import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import * as z from "zod";
import { handleApiError, UnauthorizedError } from "@/lib/errors";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  avatarUrl: z.string().url("Please enter a valid URL").optional(),
  location: z.string().optional(),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
});

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      throw new UnauthorizedError();
    }

    const json = await req.json();
    const body = profileSchema.parse(json);

    const updatedUser = await db.update(users)
      .set({
        name: body.name,
        avatar_url: body.avatarUrl,
        // updated_at: new Date(),
      })
      .where(eq(users.id, session.user.id))
      .returning();

    return NextResponse.json(updatedUser[0]);
  } catch (error) {
    return handleApiError(error);
  }
} 