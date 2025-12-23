import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { generateEmailVerificationToken, normalizeEmail } from "@/lib/auth-utils";
import { sendVerificationEmail } from "@/lib/email";
import { handleApiError, ValidationError } from "@/lib/errors";
import { rateLimit, getClientIdentifier } from "@/lib/rate-limit";
import * as z from "zod";

const resendSchema = z.object({
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
    const body = resendSchema.parse(json);

    const normalizedEmail = normalizeEmail(body.email);

    // Find user
    const [user] = await db
      .select({ id: users.id, email: users.email, email_verified: users.email_verified })
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    if (!user) {
      throw new ValidationError("User not found");
    }

    if (user.email_verified) {
      throw new ValidationError("Email is already verified");
    }

    // Generate new verification token
    const token = await generateEmailVerificationToken(normalizedEmail);

    // Send verification email
    try {
      await sendVerificationEmail(user.email!, token);
    } catch (error) {
      console.error("Failed to send verification email:", error);
      throw new ValidationError("Failed to send verification email. Please try again later.");
    }

    return NextResponse.json(
      { message: "Verification email sent" },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
