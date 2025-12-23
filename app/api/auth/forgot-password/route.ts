import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { generatePasswordResetToken, normalizeEmail } from "@/lib/auth-utils";
import { sendPasswordResetEmail } from "@/lib/email";
import { handleApiError, ValidationError } from "@/lib/errors";
import { rateLimit, getClientIdentifier } from "@/lib/rate-limit";
import * as z from "zod";

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export async function POST(req: Request) {
  try {
    // Rate limiting
    const clientId = getClientIdentifier(req);
    const limit = rateLimit(clientId, 3, 15 * 60 * 1000); // 3 requests per 15 minutes
    if (!limit.allowed) {
      return NextResponse.json(
        {
          error: "Too many requests. Please try again later.",
          code: "RATE_LIMIT_EXCEEDED",
        },
        { status: 429 }
      );
    }

    const json = await req.json();
    const body = forgotPasswordSchema.parse(json);

    const normalizedEmail = normalizeEmail(body.email);

    // Find user
    const [user] = await db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    // Don't reveal if email exists (security best practice)
    if (!user) {
      // Still return success to prevent email enumeration
      return NextResponse.json(
        { message: "If that email exists, we've sent a password reset link." },
        { status: 200 }
      );
    }

    // Generate reset token
    const token = await generatePasswordResetToken(user.id);

    // Send reset email
    try {
      await sendPasswordResetEmail(user.email!, token);
    } catch (error) {
      // Log error but don't expose it
      console.error("Failed to send password reset email:", error);
      throw new ValidationError("Failed to send password reset email. Please try again later.");
    }

    return NextResponse.json(
      { message: "If that email exists, we've sent a password reset link." },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
