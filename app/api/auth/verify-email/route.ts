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

    // Update user email_verified
    await db
      .update(users)
      .set({
        email_verified: new Date(),
      })
      .where(eq(users.email, normalizedEmail));

    return NextResponse.json(
      { message: "Email verified successfully" },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
