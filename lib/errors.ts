/**
 * Centralized error handling utilities
 * Provides consistent error responses and logging
 */

import { NextResponse } from "next/server";
import { ZodError } from "zod";

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = "AppError";
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public details?: unknown) {
    super(message, 400, "VALIDATION_ERROR");
    this.name = "ValidationError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = "Unauthorized") {
    super(message, 401, "UNAUTHORIZED");
    this.name = "UnauthorizedError";
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = "Resource not found") {
    super(message, 404, "NOT_FOUND");
    this.name = "NotFoundError";
  }
}

/**
 * Handle errors in API routes with consistent formatting
 */
export function handleApiError(error: unknown): NextResponse {
  // Log error for debugging (in production, use proper logging service)
  if (process.env.NODE_ENV === "development") {
    console.error("API Error:", error);
  }

  // Handle known error types
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        ...(error instanceof ValidationError && error.details
          ? { details: error.details }
          : {}),
      },
      { status: error.statusCode }
    );
  }

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: "Validation failed",
        code: "VALIDATION_ERROR",
        details: error.errors,
      },
      { status: 400 }
    );
  }

  // Handle generic errors
  if (error instanceof Error) {
    // Don't expose internal error messages in production
    const message =
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : error.message;

    return NextResponse.json(
      {
        error: message,
        code: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }

  // Handle unknown error types
  return NextResponse.json(
    {
      error: "An unexpected error occurred",
      code: "UNKNOWN_ERROR",
    },
    { status: 500 }
  );
}

/**
 * Validate request body size (prevent DoS attacks)
 */
export function validateRequestSize(
  body: string,
  maxSize: number = 1024 * 1024 // 1MB default
): void {
  const sizeInBytes = new Blob([body]).size;
  if (sizeInBytes > maxSize) {
    throw new ValidationError(
      `Request body too large. Maximum size is ${maxSize / 1024}KB`
    );
  }
}
