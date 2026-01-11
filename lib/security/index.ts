/**
 * Security module exports
 * Centralized exports for cleaner imports
 * 
 * Note: This is in lib/security/ directory, not lib/security.ts
 * Import from "@/lib/security/get-ip", "@/lib/security/rate-limit", etc.
 * or use the specific paths below
 */

export { getClientIp } from "./get-ip";
export {
  loginLimiter,
  registrationLimiter,
  passwordResetLimiter,
  emailVerificationLimiter,
} from "./rate-limit";
export {
  checkAccountLocked,
  incrementFailedAttempts,
  resetFailedAttempts,
  type UserLoginData,
} from "./login-guards";

// Re-export existing security utilities
export {
  sanitizeName,
  sanitizeEmail,
  validatePasswordStrength,
  validateInputSecurity,
  validateRequestBodySize,
} from "../security";
