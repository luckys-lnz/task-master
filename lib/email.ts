/**
 * Email service utilities
 * Supports development (console logging) and production (email service)
 */

import { env } from "./env";

export interface EmailResult {
  success: boolean;
  verificationUrl?: string;
  error?: string;
}

/**
 * Send email verification email
 * In development: logs to console and returns URL
 * In production: requires email service configuration
 */
export async function sendVerificationEmail(
  email: string,
  token: string
): Promise<EmailResult> {
  const verificationUrl = `${env.NEXTAUTH_URL}/auth/verify-email?token=${token}&email=${encodeURIComponent(email)}`;

  // In development, log the email
  if (env.NODE_ENV === "development") {
    console.log("\n📧 ========================================");
    console.log("📧 VERIFICATION EMAIL (Development Mode)");
    console.log("📧 ========================================");
    console.log(`📧 To: ${email}`);
    console.log(`📧 Verification Link: ${verificationUrl}`);
    console.log("📧 ========================================\n");
    
    return {
      success: true,
      verificationUrl,
    };
  }

  // Check for email service configuration
  const emailService = process.env.EMAIL_SERVICE || "console";
  
  if (emailService === "console" || !process.env.RESEND_API_KEY) {
    // Fallback to console even in production if no service configured
    console.warn("⚠️  Email service not configured. Logging to console:");
    console.log(`📧 Verification Email to ${email}: ${verificationUrl}`);
    return {
      success: true,
      verificationUrl,
    };
  }

  // Use Resend if API key is configured
  if (process.env.RESEND_API_KEY) {
    try {
      const { Resend } = await import("resend");
      const resend = new Resend(process.env.RESEND_API_KEY);
      
      const emailFrom = process.env.EMAIL_FROM || process.env.RESEND_FROM || "onboarding@resend.dev";
      
      const result = await resend.emails.send({
        from: emailFrom,
        to: email,
        subject: "Verify your email address",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Verify your email address</h2>
            <p>Thank you for signing up! Please click the link below to verify your email address:</p>
            <p style="margin: 20px 0;">
              <a href="${verificationUrl}" style="background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email</a>
            </p>
            <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
            <p style="color: #666; font-size: 12px; word-break: break-all;">${verificationUrl}</p>
            <p style="color: #999; font-size: 12px; margin-top: 30px;">This link will expire in 24 hours.</p>
          </div>
        `,
      });

      if (result.error) {
        throw new Error(result.error.message || "Failed to send email");
      }

      return { success: true };
    } catch (error) {
      console.error("Failed to send email via Resend:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to send email",
        verificationUrl, // Return URL as fallback
      };
    }
  }

  // Default: return URL for manual use
  return {
    success: true,
    verificationUrl,
  };
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  token: string
): Promise<EmailResult> {
  const resetUrl = `${env.NEXTAUTH_URL}/auth/reset-password?token=${token}`;

  // In development, log the email
  if (env.NODE_ENV === "development") {
    console.log("\n📧 ========================================");
    console.log("📧 PASSWORD RESET EMAIL (Development Mode)");
    console.log("📧 ========================================");
    console.log(`📧 To: ${email}`);
    console.log(`📧 Reset Link: ${resetUrl}`);
    console.log("📧 ========================================\n");
    
    return {
      success: true,
      verificationUrl: resetUrl,
    };
  }

  // Check for email service configuration
  if (process.env.RESEND_API_KEY) {
    try {
      const { Resend } = await import("resend");
      const resend = new Resend(process.env.RESEND_API_KEY);
      
      const emailFrom = process.env.EMAIL_FROM || process.env.RESEND_FROM || "onboarding@resend.dev";
      
      const result = await resend.emails.send({
        from: emailFrom,
        to: email,
        subject: "Reset your password",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Reset your password</h2>
            <p>You requested to reset your password. Click the link below to create a new password:</p>
            <p style="margin: 20px 0;">
              <a href="${resetUrl}" style="background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
            </p>
            <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
            <p style="color: #666; font-size: 12px; word-break: break-all;">${resetUrl}</p>
            <p style="color: #999; font-size: 12px; margin-top: 30px;">This link will expire in 1 hour.</p>
            <p style="color: #999; font-size: 12px;">If you didn't request this, please ignore this email.</p>
          </div>
        `,
      });

      if (result.error) {
        throw new Error(result.error.message || "Failed to send email");
      }

      return { success: true };
    } catch (error) {
      console.error("Failed to send email via Resend:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to send email",
        verificationUrl: resetUrl,
      };
    }
  }

  // Fallback: log to console
  console.warn("⚠️  Email service not configured. Logging to console:");
  console.log(`📧 Password Reset Email to ${email}: ${resetUrl}`);
  return {
    success: true,
    verificationUrl: resetUrl,
  };
}
