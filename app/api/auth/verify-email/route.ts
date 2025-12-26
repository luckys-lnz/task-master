import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { verifyEmailToken, normalizeEmail } from "@/lib/auth-utils";
import { handleApiError, ValidationError } from "@/lib/errors";
import * as z from "zod";

const verifySchema = z.object({
  email: z.string().email("Invalid email address"),
  token: z.string().min(1, "Token is required"),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const body = verifySchema.parse(json);

    const normalizedEmail = normalizeEmail(body.email);

    // Verify token
    const isValid = await verifyEmailToken(normalizedEmail, body.token);
    if (!isValid) {
      throw new ValidationError("Invalid or expired verification token");
    }

    // Get user before updating
    const [user] = await db
      .select({ id: users.id, email: users.email, name: users.name })
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    if (!user) {
      throw new ValidationError("User not found");
    }

    // Update user email_verified and clear the verification token
    await db
      .update(users)
      .set({
        email_verified: new Date(),
        email_verification_token: null,
        email_verification_expires: null,
      })
      .where(eq(users.email, normalizedEmail));

    return NextResponse.json(
      { 
        message: "Email verified successfully",
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        }
      },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
