import { NextResponse } from "next/server";
import { hash } from "bcrypt";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import * as z from "zod";
import { handleApiError, ValidationError } from "@/lib/errors";

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
    const json = await req.json();
    
    const body = registerSchema.parse(json);

    // Check if email already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, body.email),
    });

    if (existingUser) {
      throw new ValidationError("User with this email already exists");
    }

    const hashedPassword = await hash(body.password, 10);

    // Create user
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
    return handleApiError(error);
  }
} 