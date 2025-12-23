/**
 * Authentication utility functions
 * Provides common authentication-related helpers
 */

import { randomBytes } from "crypto";
import { db } from "./db";
import { users, verificationTokens } from "./db/schema";
import { eq, and, gt } from "drizzle-orm";

/**
 * Normalize email address (lowercase, trim)
 */
export function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
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

  // Delete any existing tokens for this email
  await db
    .delete(verificationTokens)
    .where(eq(verificationTokens.identifier, email));

  // Insert new token
  await db.insert(verificationTokens).values({
    identifier: email,
    token,
    expires,
  });

  return token;
}

/**
 * Verify email verification token
 */
export async function verifyEmailToken(
  email: string,
  token: string
): Promise<boolean> {
  const [verificationToken] = await db
    .select()
    .from(verificationTokens)
    .where(
      and(
        eq(verificationTokens.identifier, email),
        eq(verificationTokens.token, token),
        gt(verificationTokens.expires, new Date())
      )
    )
    .limit(1);

  return !!verificationToken;
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

/**
 * Check if account is locked
 */
export async function checkAccountLocked(
  email: string
): Promise<boolean> {
  const [user] = await db
    .select({ locked_until: users.locked_until })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user) {
    return false;
  }

  // Check if account is locked
  if (user.locked_until && user.locked_until > new Date()) {
    return true;
  }

  // Clear lock if expired
  if (user.locked_until && user.locked_until <= new Date()) {
    await db
      .update(users)
      .set({
        failed_login_attempts: "0",
        locked_until: null,
      })
      .where(eq(users.email, email));
  }

  return false;
}

/**
 * Increment failed login attempts
 */
export async function incrementFailedLoginAttempts(
  email: string
): Promise<void> {
  const [user] = await db
    .select({ id: users.id, failed_login_attempts: users.failed_login_attempts })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user) {
    return;
  }

  const attempts = parseInt(user.failed_login_attempts || "0") + 1;
  const maxAttempts = 5;
  const lockDuration = 30 * 60 * 1000; // 30 minutes

  let lockedUntil: Date | null = null;
  if (attempts >= maxAttempts) {
    lockedUntil = new Date(Date.now() + lockDuration);
  }

  await db
    .update(users)
    .set({
      failed_login_attempts: attempts.toString(),
      locked_until: lockedUntil,
    })
    .where(eq(users.id, user.id));
}

/**
 * Reset failed login attempts (on successful login)
 */
export async function resetFailedLoginAttempts(email: string): Promise<void> {
  await db
    .update(users)
    .set({
      failed_login_attempts: "0",
      locked_until: null,
    })
    .where(eq(users.email, email));
}
