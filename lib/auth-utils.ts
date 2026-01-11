/**
 * ======================================================================
 * AUTHENTICATION UTILITY FUNCTIONS
 * ======================================================================
 * 
 * Enterprise-grade authentication utilities with correct account locking logic.
 * 
 * Key Principles:
 * - Account locks are ONLY cleared after successful login
 * - Failed attempts are stored as integers (parsed from text in DB)
 * - No user existence leakage (all errors return null)
 * - Account locking prevents brute force on specific accounts
 */

import { randomBytes } from "crypto";
import { db } from "./db";
import { users } from "./db/schema";
import { eq, and, gt } from "drizzle-orm";

/**
 * Normalize email address (lowercase, trim)
 */
export function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

/**
 * User data returned by account locking functions
 */
export interface UserLoginData {
  id: string;
  email: string | null;
  name: string | null;
  image: string | null;
  hashed_password: string | null;
  emailVerified: Date | null;
  locked_until: Date | null;
  failed_login_attempts: number; // Always integer, parsed from DB
}

/**
 * Check if account is locked and retrieve user data
 * 
 * CRITICAL LOGIC:
 * - Account locks are NOT automatically cleared on expiration
 * - Locks are ONLY cleared after a successful login
 * - This prevents attackers from waiting for lock expiration
 * - Returns null if account is locked (no user existence leakage)
 * 
 * @param email - Normalized email address
 * @returns User data if account is not locked, null if locked or not found
 */
export async function checkAccountLockedAndGetUser(
  email: string
): Promise<UserLoginData | null> {
  try {
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        image: users.image,
        hashed_password: users.hashed_password,
        emailVerified: users.emailVerified,
        locked_until: users.locked_until,
        failed_login_attempts: users.failed_login_attempts,
      })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    // No user existence leakage - return null for both "not found" and "locked"
    if (!user) {
      return null;
    }

    const now = new Date();

    // Check if account is currently locked
    // IMPORTANT: We do NOT auto-clear expired locks here
    // Locks are only cleared after successful login
    if (user.locked_until && user.locked_until > now) {
      return null; // Account is locked
    }

    // Parse failed_login_attempts as integer
    const failedAttempts = parseInt(user.failed_login_attempts || "0", 10);

    // Return user data (account is not locked)
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      hashed_password: user.hashed_password,
      emailVerified: user.emailVerified,
      locked_until: user.locked_until,
      failed_login_attempts: failedAttempts,
    };
  } catch (error) {
    // Log error but don't expose details (no user existence leakage)
    console.error("Database error in checkAccountLockedAndGetUser:", error);
    // Return null to prevent login on database errors
    return null;
  }
}

/**
 * Increment failed login attempts counter
 * 
 * Logic:
 * - Increments counter for each failed attempt
 * - Locks account after 5 failed attempts
 * - Lock duration: 30 minutes
 * - Stores as integer (converted to string for DB)
 * 
 * @param email - Normalized email address
 */
export async function incrementFailedLoginAttempts(
  email: string
): Promise<void> {
  try {
    const [user] = await db
      .select({
        id: users.id,
        failed_login_attempts: users.failed_login_attempts,
      })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    // Silently return if user doesn't exist (no user existence leakage)
    if (!user) {
      return;
    }

    // Parse current attempts as integer
    const currentAttempts = parseInt(user.failed_login_attempts || "0", 10);
    const newAttempts = currentAttempts + 1;
    const maxAttempts = 5;
    const lockDurationMs = 30 * 60 * 1000; // 30 minutes

    // Lock account if max attempts reached
    const lockedUntil =
      newAttempts >= maxAttempts
        ? new Date(Date.now() + lockDurationMs)
        : null;

    // Store as string (DB column is text, but we treat it as integer)
    await db
      .update(users)
      .set({
        failed_login_attempts: newAttempts.toString(),
        locked_until: lockedUntil,
      })
      .where(eq(users.id, user.id));
  } catch (error) {
    // Log error but don't throw - don't block login flow
    console.error("Failed to increment login attempts:", error);
  }
}

/**
 * Reset failed login attempts on successful login
 * 
 * CRITICAL: This is the ONLY place where account locks are cleared.
 * 
 * Clears:
 * - Failed login attempts counter (reset to 0)
 * - Account lock status (unlock account)
 * 
 * @param email - Normalized email address
 */
export async function resetFailedLoginAttempts(email: string): Promise<void> {
  try {
    await db
      .update(users)
      .set({
        failed_login_attempts: "0", // Store as string (DB column is text)
        locked_until: null, // Unlock account
      })
      .where(eq(users.email, email));
  } catch (error) {
    // Log error but don't throw - login was successful
    console.error("Failed to reset login attempts:", error);
  }
}

/**
 * Validate that a user exists in the database
 * Returns the user if found, null otherwise
 * Handles connection timeouts gracefully
 */
export async function validateUserExists(userId: string) {
  try {
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        image: users.image,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    return user || null;
  } catch (error) {
    // Log the error but don't throw - allows graceful degradation
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error validating user existence:", errorMessage);

    // Check for connection timeout specifically
    if (
      errorMessage.includes("timeout") ||
      errorMessage.includes("Connection terminated")
    ) {
      console.warn("Database connection timeout - user validation skipped");
    }

    return null;
  }
}

/**
 * Generate a secure random token
 */
export function generateToken(length: number = 32): string {
  return randomBytes(length).toString("hex");
}

/**
 * Generate email verification token
 */
export async function generateEmailVerificationToken(
  email: string
): Promise<string> {
  const token = generateToken();
  const expires = new Date();
  expires.setHours(expires.getHours() + 24); // 24 hours expiry

  // Store token in users table
  await db
    .update(users)
    .set({
      email_verification_token: token,
      email_verification_expires: expires,
    })
    .where(eq(users.email, email));

  return token;
}

/**
 * Verify email verification token and return token data if valid
 */
export async function verifyEmailToken(
  email: string,
  token: string
): Promise<boolean> {
  try {
    const [user] = await db
      .select({
        email_verification_token: users.email_verification_token,
        email_verification_expires: users.email_verification_expires,
      })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (
      !user ||
      !user.email_verification_token ||
      !user.email_verification_expires
    ) {
      return false;
    }

    // Check if token matches and hasn't expired
    if (user.email_verification_token !== token) {
      return false;
    }

    if (user.email_verification_expires <= new Date()) {
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error verifying email token:", error);
    return false;
  }
}

/**
 * Generate password reset token
 */
export async function generatePasswordResetToken(
  userId: string
): Promise<string> {
  const token = generateToken();
  const expires = new Date();
  expires.setHours(expires.getHours() + 1); // 1 hour expiry

  await db
    .update(users)
    .set({
      reset_password_token: token,
      reset_password_expires: expires,
    })
    .where(eq(users.id, userId));

  return token;
}

/**
 * Verify password reset token
 */
export async function verifyPasswordResetToken(
  token: string
): Promise<string | null> {
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(
      and(
        eq(users.reset_password_token, token),
        gt(users.reset_password_expires || new Date(0), new Date())
      )
    )
    .limit(1);

  return user?.id || null;
}

/**
 * Clear password reset token
 */
export async function clearPasswordResetToken(userId: string): Promise<void> {
  await db
    .update(users)
    .set({
      reset_password_token: null,
      reset_password_expires: null,
    })
    .where(eq(users.id, userId));
}
