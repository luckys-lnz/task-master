import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import * as z from "zod";
import { handleApiError, ValidationError } from "@/lib/errors";
import { normalizeEmail, generateEmailVerificationToken } from "@/lib/auth-utils";
import { sendVerificationEmail } from "@/lib/email";
import { rateLimit, getClientIdentifier } from "@/lib/rate-limit";

const registerSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

export async function POST(req: Request) {
  try {
    // Rate limiting
    const clientId = getClientIdentifier(req);
    const limit = rateLimit(clientId, 5, 15 * 60 * 1000); // 5 registrations per 15 minutes
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
    const body = registerSchema.parse(json);

    const normalizedEmail = normalizeEmail(body.email);

    // Check if email already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, normalizedEmail),
    });

    if (existingUser) {
      throw new ValidationError("User with this email already exists");
    }

    const hashedPassword = await hash(body.password, 10);

    // Create user
    const [newUser] = await db.insert(users)
      .values({
        name: body.name,
        email: normalizedEmail,
        hashed_password: hashedPassword,
        email_verified: null,
        notifications_enabled: true,
        default_view: "list",
        theme: "system",
      })
      .returning();

    // Generate and send verification email
    try {
      const token = await generateEmailVerificationToken(normalizedEmail);
      await sendVerificationEmail(normalizedEmail, token);
    } catch (error) {
      // Log error but don't fail registration
      console.error("Failed to send verification email:", error);
    }

    return NextResponse.json(
      { 
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email
        },
        message: "Account created successfully. Please check your email to verify your account."
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
} 