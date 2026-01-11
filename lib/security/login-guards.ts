/**
 * ======================================================================
 * LOGIN SECURITY GUARDS
 * ======================================================================
 * 
 * Account locking and failed login attempt management.
 * 
 * Why separate from authorize():
 * - Keeps authorize() function clean and focused
 * - Reusable across different authentication flows
 * - Easier to test and maintain
 * - Clear separation of concerns
 */

import { db } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";

/**
 * User data returned by checkAccountLocked
 */
export interface UserLoginData {
  id: string;
  email: string | null;
  name: string | null;
  image: string | null;
  hashed_password: string | null;
  emailVerified: Date | null;
  locked_until: Date | null;
  failed_login_attempts: string | null;
}

/**
 * Check if account is locked and retrieve user data
 * 
 * This function:
 * 1. Fetches user by email
 * 2. Checks if account is currently locked
 * 3. Automatically clears expired locks
 * 4. Returns user data if account is accessible
 * 
 * @param email - Normalized email address
 * @returns User data if account is not locked, null if locked or not found
 */
export async function checkAccountLocked(
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

    if (!user) {
      return null;
    }

    const now = new Date();

    // Check if account is currently locked
    if (user.locked_until && user.locked_until > now) {
      return null; // Account is locked
    }

    // Auto-clear expired lock (non-blocking)
    if (user.locked_until && user.locked_until <= now) {
      try {
        await db
          .update(users)
          .set({
            failed_login_attempts: "0",
            locked_until: null,
          })
          .where(eq(users.email, email));
      } catch (updateError) {
        // Log but don't throw - user can still login
        console.warn("Failed to clear expired lock:", updateError);
      }
    }

    return user;
  } catch (error) {
    // Log error but don't expose details
    console.error("Database error in checkAccountLocked:", error);
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
 * 
 * @param email - Normalized email address
 */
export async function incrementFailedAttempts(
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

    if (!user) {
      return; // User doesn't exist, nothing to update
    }

    const currentAttempts = parseInt(user.failed_login_attempts || "0", 10);
    const newAttempts = currentAttempts + 1;
    const maxAttempts = 5;
    const lockDurationMs = 30 * 60 * 1000; // 30 minutes

    // Lock account if max attempts reached
    const lockedUntil =
      newAttempts >= maxAttempts
        ? new Date(Date.now() + lockDurationMs)
        : null;

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
 * Clears:
 * - Failed login attempts counter
 * - Account lock status
 * 
 * @param email - Normalized email address
 */
export async function resetFailedAttempts(email: string): Promise<void> {
  try {
    await db
      .update(users)
      .set({
        failed_login_attempts: "0",
        locked_until: null,
      })
      .where(eq(users.email, email));
  } catch (error) {
    // Log error but don't throw - login was successful
    console.error("Failed to reset login attempts:", error);
  }
}
