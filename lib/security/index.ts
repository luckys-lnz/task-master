/**
 * Security module exports
 * Centralized exports for cleaner imports
 */

export { getClientIp } from "./get-ip";
export {
  loginIpLimiter,
  loginEmailLimiter,
  registrationLimiter,
  passwordResetLimiter,
  emailVerificationLimiter,
  createIpLimiter,
  createEmailLimiter,
  createCompositeLimiter,
  type RateLimiter,
  type LimitResult,
} from "./rate-limit";

// Re-export existing security utilities
export {
  sanitizeName,
  sanitizeEmail,
  validatePasswordStrength,
  validateInputSecurity,
  validateRequestBodySize,
} from "../security";
