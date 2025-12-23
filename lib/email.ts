/**
 * Email service utilities
 * In production, integrate with a service like SendGrid, Resend, or AWS SES
 */

import { env } from "./env";

/**
 * Send email verification email
 * TODO: Integrate with actual email service in production
 */
export async function sendVerificationEmail(
  email: string,
  token: string
): Promise<void> {
  const verificationUrl = `${env.NEXTAUTH_URL}/auth/verify-email?token=${token}&email=${encodeURIComponent(email)}`;

  // In development, log the email
  if (env.NODE_ENV === "development") {
    console.log("📧 Verification Email:");
    console.log(`To: ${email}`);
    console.log(`Link: ${verificationUrl}`);
    console.log("---");
    return;
  }

  // In production, send actual email
  // Example with a service like Resend:
  // await resend.emails.send({
  //   from: 'noreply@yourdomain.com',
  //   to: email,
  //   subject: 'Verify your email address',
  //   html: `Click <a href="${verificationUrl}">here</a> to verify your email.`
  // });

  throw new Error("Email service not configured. Please set up an email service in production.");
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  token: string
): Promise<void> {
  const resetUrl = `${env.NEXTAUTH_URL}/auth/reset-password?token=${token}`;

  // In development, log the email
  if (env.NODE_ENV === "development") {
    console.log("📧 Password Reset Email:");
    console.log(`To: ${email}`);
    console.log(`Link: ${resetUrl}`);
    console.log("---");
    return;
  }

  // In production, send actual email
  // Example with a service like Resend:
  // await resend.emails.send({
  //   from: 'noreply@yourdomain.com',
  //   to: email,
  //   subject: 'Reset your password',
  //   html: `Click <a href="${resetUrl}">here</a> to reset your password.`
  // });

  throw new Error("Email service not configured. Please set up an email service in production.");
}
