import { NextResponse } from "next/server";
import { hash } from "bcrypt";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import * as z from "zod";

const registerSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(7, "Password must be at least 7 characters"),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    console.log("Received registration data:", { ...json, password: '[REDACTED]' });
    
    const body = registerSchema.parse(json);
    console.log("Validation passed");

    // Check if email already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, body.email),
    });

    if (existingUser) {
      console.log("User already exists with email:", body.email);
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    console.log("No existing user found, proceeding with registration");
    const hashedPassword = await hash(body.password, 10);

    // Create user
    console.log("Attempting to create user in database");
    const [newUser] = await db.insert(users)
      .values({
        name: body.name,
        email: body.email,
        hashed_password: hashedPassword,
        email_verified: null,
        notifications_enabled: true,
        default_view: "list",
        theme: "system",
      })
      .returning();

    return NextResponse.json(
      { 
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    // Log the full error details
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 