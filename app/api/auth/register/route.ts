import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import * as z from "zod";
import { handleApiError, ValidationError } from "@/lib/errors";
import { normalizeEmail, generateEmailVerificationToken } from "@/lib/auth-utils";
import { sendVerificationEmail } from "@/lib/email";
import { registrationLimiter } from "@/lib/security/rate-limit";
import { getClientIp } from "@/lib/security/get-ip";
import { sanitizeName, sanitizeEmail, validatePasswordStrength, validateInputSecurity, validateRequestBodySize } from "@/lib/security";

const registerSchema = z.object({
  name: z.string()
    .min(3, "Name must be at least 3 characters")
    .max(100, "Name must be less than 100 characters"),
  email: z.string()
    .email("Invalid email address")
    .max(320, "Email address is too long")
    .transform((val) => val.toLowerCase().trim()),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be less than 128 characters")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, "Password must contain at least one special character"),
});

export async function POST(req: Request) {
  try {
    // Rate limiting by IP (prevents registration spam)
    const ip = getClientIp(req);
    const { success } = await registrationLimiter.limit(ip);
    if (!success) {
      return NextResponse.json(
        {
          error: "Too many requests. Please try again later.",
          code: "RATE_LIMIT_EXCEEDED",
        },
        { status: 429 }
      );
    }

    // Validate request body size (max 10KB)
    const text = await req.text();
    if (!validateRequestBodySize(text, 10 * 1024)) {
      return NextResponse.json(
        { error: "Request body is too large" },
        { status: 413 }
      );
    }

    const json = JSON.parse(text);
    const body = registerSchema.parse(json);

    // Security validation
    const nameSecurity = validateInputSecurity(body.name);
    if (!nameSecurity.isValid) {
      throw new ValidationError(nameSecurity.reason || "Invalid name format");
    }

    const emailSecurity = validateInputSecurity(body.email);
    if (!emailSecurity.isValid) {
      throw new ValidationError(emailSecurity.reason || "Invalid email format");
    }

    // Password strength validation
    const passwordStrength = validatePasswordStrength(body.password);
    if (!passwordStrength.isValid) {
      throw new ValidationError(passwordStrength.issues.join(". ") || "Password does not meet security requirements");
    }

    // Sanitize inputs
    const sanitizedName = sanitizeName(body.name);
    if (sanitizedName.length < 3) {
      throw new ValidationError("Name contains invalid characters");
    }

    const sanitizedEmail = sanitizeEmail(body.email);
    if (!sanitizedEmail) {
      throw new ValidationError("Invalid email address format");
    }

    const normalizedEmail = normalizeEmail(sanitizedEmail);

    // Check if email already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, normalizedEmail),
    });

    if (existingUser) {
      throw new ValidationError("User with this email already exists");
    }

    const hashedPassword = await hash(body.password, 10);

    // Create user in NextAuth database
    const [newUser] = await db.insert(users)
      .values({
        name: sanitizedName,
        email: normalizedEmail,
        hashed_password: hashedPassword,
        emailVerified: null,
        notifications_enabled: true,
        default_view: "list",
        theme: "system",
      })
      .returning();

    // Generate and send verification email
    const token = await generateEmailVerificationToken(normalizedEmail);
    const emailResult = await sendVerificationEmail(normalizedEmail, token);

    if (!emailResult.success) {
      console.error("❌ Failed to send verification email:", emailResult.error);
      console.error("📧 Verification URL (for manual use):", emailResult.verificationUrl);
    } else {
      console.log("✅ Verification email sent successfully to:", normalizedEmail);
    }

    return NextResponse.json(
      { 
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email
        },
        message: emailResult?.success 
          ? "Account created successfully. Please check your email to verify your account."
          : "Account created successfully. However, we couldn't send the verification email. Please use the resend verification feature.",
        // Include verification URL in development or if email service is not configured
        ...((process.env.NODE_ENV === "development" || !emailResult?.success) && emailResult?.verificationUrl && {
          verificationUrl: emailResult.verificationUrl,
        }),
        emailSent: emailResult?.success ?? false
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
} 