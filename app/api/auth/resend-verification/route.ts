import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { generateEmailVerificationToken, normalizeEmail } from "@/lib/auth-utils";
import { sendVerificationEmail } from "@/lib/email";
import { handleApiError, ValidationError } from "@/lib/errors";
import { emailVerificationLimiter } from "@/lib/security/rate-limit";
import { getClientIp } from "@/lib/security/get-ip";
import * as z from "zod";

const resendSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export async function POST(req: Request) {
  try {
    // Rate limiting by IP
    const ip = getClientIp(req);
    const { success } = await emailVerificationLimiter.limit(ip);
    if (!success) {
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
      .select({ id: users.id, email: users.email, emailVerified: users.emailVerified })
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    if (!user) {
      throw new ValidationError("User not found");
    }

    if (user.emailVerified) {
      throw new ValidationError("Email is already verified");
    }

    // Generate new verification token
    const token = await generateEmailVerificationToken(normalizedEmail);

    // Send verification email
    let emailResult;
    try {
      emailResult = await sendVerificationEmail(user.email!, token);
      if (!emailResult.success && emailResult.error) {
      }
    } catch (error) {
      emailResult = { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }

    return NextResponse.json(
      { 
        message: "Verification email sent",
        // Include verification URL in development for easy testing
        ...(process.env.NODE_ENV === "development" && emailResult?.verificationUrl && {
          verificationUrl: emailResult.verificationUrl,
        })
      },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
