import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { verifyPasswordResetToken } from "@/lib/auth-utils";
import { handleApiError, ValidationError } from "@/lib/errors";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { passwordResetLimiter } from "@/lib/security/rate-limit";
import { getClientIp } from "@/lib/security/get-ip";
import * as z from "zod";

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

export async function POST(req: Request) {
  try {
    // Rate limiting by IP
    const ip = getClientIp(req);
    const { success } = await passwordResetLimiter.limit(ip);
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
    const body = resetPasswordSchema.parse(json);

    // Verify token
    const userId = await verifyPasswordResetToken(body.token);
    if (!userId) {
      throw new ValidationError("Invalid or expired reset token");
    }

    // Hash new password
    const hashedPassword = await hash(body.password, 10);

    // Update password and clear reset token
    await db
      .update(users)
      .set({
        hashed_password: hashedPassword,
        reset_password_token: null,
        reset_password_expires: null,
        failed_login_attempts: "0", // Reset failed attempts
        locked_until: null,
      })
      .where(eq(users.id, userId));

    return NextResponse.json(
      { message: "Password reset successfully" },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
