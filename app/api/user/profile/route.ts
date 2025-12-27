import { NextResponse } from "next/server";
import { getValidatedSession } from "@/lib/validate-session";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import * as z from "zod";
import { handleApiError } from "@/lib/errors";

const profileSchema = z.object({
  name: z.string().min(3, "Display name must be at least 3 characters").max(100, "Name must be less than 100 characters"),
  avatarUrl: z.preprocess(
    (val) => {
      // Convert empty string, null, or undefined to undefined
      // This handles cases where null is explicitly sent from the client
      if (val === null || val === undefined || val === "") {
        return undefined;
      }
      // Ensure it's a string
      if (typeof val !== 'string') {
        return undefined;
      }
      return val;
    },
    z.string().optional().refine(
      (val) => !val || val.startsWith("data:image/") || val.startsWith("http://") || val.startsWith("https://"),
      { message: "Please enter a valid image URL or data URL" }
    )
  ),
  location: z.string().optional(),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
});

export async function PATCH(req: Request) {
  try {
    const session = await getValidatedSession();

    // Parse request body with better error handling
    let json;
    try {
      const text = await req.text();
      console.log("Received request body text:", text);
      
      if (!text || text.trim().length === 0) {
        console.error("Empty request body");
        return NextResponse.json(
          {
            error: "Request body is required",
            code: "INVALID_REQUEST",
          },
          { status: 400 }
        );
      }
      json = JSON.parse(text);
      console.log("Parsed JSON:", json);
    } catch (parseError) {
      console.error("Failed to parse request body:", parseError);
      return NextResponse.json(
        {
          error: "Invalid request body. Expected valid JSON.",
          code: "INVALID_REQUEST",
        },
        { status: 400 }
      );
    }

    // Validate request body
    let body;
    try {
      // Ensure name exists and is a string
      if (!json.name || typeof json.name !== 'string') {
        return NextResponse.json(
          {
            error: "Name is required and must be a string",
            code: "VALIDATION_ERROR",
            received: { name: json.name, type: typeof json.name },
          },
          { status: 400 }
        );
      }

      // Pre-process avatarUrl to convert null to undefined before validation
      if (json.avatarUrl === null) {
        delete json.avatarUrl;
      }

      body = profileSchema.parse(json);
    } catch (validationError) {
      console.error("Validation error:", validationError);
      if (validationError instanceof z.ZodError) {
        return NextResponse.json(
          {
            error: "Validation failed",
            code: "VALIDATION_ERROR",
            details: validationError.errors.map((err) => ({
              path: err.path.join("."),
              message: err.message,
              code: err.code,
            })),
            received: json,
          },
          { status: 400 }
        );
      }
      throw validationError;
    }

    // Ensure name is trimmed and valid
    const trimmedName = body.name.trim();
    if (trimmedName.length < 3) {
      return NextResponse.json(
        {
          error: "Display name must be at least 3 characters",
          code: "VALIDATION_ERROR",
          received: { name: body.name, trimmedLength: trimmedName.length },
        },
        { status: 400 }
      );
    }

    const updatedUser = await db.update(users)
      .set({
        name: trimmedName,
        avatar_url: body.avatarUrl || null,
        image: body.avatarUrl || null, // Also update image field for NextAuth compatibility
      })
      .where(eq(users.id, session.user.id))
      .returning();

    return NextResponse.json({
      ...updatedUser[0],
      message: "Profile updated successfully"
    });
  } catch (error) {
    console.error("Profile update error:", error);
    return handleApiError(error);
  }
} 