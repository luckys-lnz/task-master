/**
 * Production-ready rate limiting with Upstash Redis
 * Uses sliding window algorithm for distributed rate limiting
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Extract real client IP from request
 * Handles Vercel and NextAuth Request objects correctly
 */
export function getClientIp(req: Request | any): string {
  // Handle Fetch Request object (standard web Request)
  if (req && typeof req === "object" && req.headers) {
    // Check if it's a Headers instance (Fetch API)
    if (req.headers instanceof Headers || typeof req.headers.get === "function") {
      return (
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        req.headers.get("x-real-ip") ??
        req.headers.get("cf-connecting-ip") ??
        "0.0.0.0"
      );
    }
    
    // Handle Node.js request object (NextAuth internal calls)
    // Headers are a plain object
    if (typeof req.headers === "object") {
      const forwarded = req.headers["x-forwarded-for"] || req.headers["X-Forwarded-For"];
      const realIp = req.headers["x-real-ip"] || req.headers["X-Real-Ip"];
      const cfIp = req.headers["cf-connecting-ip"] || req.headers["CF-Connecting-IP"];
      
      if (forwarded) {
        const ip = typeof forwarded === "string" ? forwarded : String(forwarded);
        return ip.split(",")[0]?.trim() ?? "0.0.0.0";
      }
      if (realIp) {
        return typeof realIp === "string" ? realIp : String(realIp);
      }
      if (cfIp) {
        return typeof cfIp === "string" ? cfIp : String(cfIp);
      }
    }
  }

  // Fallback
  return "0.0.0.0";
}

/**
 * Initialize Redis client
 * Uses environment variables: UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
 */
let redis: Redis | null = null;
let redisInitialized = false;

function getRedis(): Redis | null {
  if (redisInitialized) {
    return redis;
  }

  redisInitialized = true;

  // Check if Upstash environment variables are set
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.warn(
      "⚠️  Upstash Redis not configured. Rate limiting will not work.\n" +
      "   Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN environment variables.\n" +
      "   Get them from: https://console.upstash.com/"
    );
    return null;
  }

  try {
    redis = new Redis({
      url,
      token,
    });
    return redis;
  } catch (error) {
    console.error("Failed to initialize Upstash Redis:", error);
    return null;
  }
}

/**
 * Login rate limiter
 * 5 attempts per 10 minutes using sliding window
 */
export const loginLimiter = (() => {
  const redisClient = getRedis();
  
  if (!redisClient) {
    // Return a no-op limiter if Redis is not available
    return {
      limit: async () => ({
        success: true,
        limit: 5,
        remaining: 5,
        reset: Date.now() + 600000,
      }),
    };
  }

  return new Ratelimit({
    redis: redisClient,
    limiter: Ratelimit.slidingWindow(5, "10 m"),
    analytics: true,
  });
})();

/**
 * Registration rate limiter
 * 5 attempts per 15 minutes using sliding window
 */
export const registrationLimiter = (() => {
  const redisClient = getRedis();
  
  if (!redisClient) {
    return {
      limit: async () => ({
        success: true,
        limit: 5,
        remaining: 5,
        reset: Date.now() + 900000,
      }),
    };
  }

  return new Ratelimit({
    redis: redisClient,
    limiter: Ratelimit.slidingWindow(5, "15 m"),
    analytics: true,
  });
})();

/**
 * Password reset rate limiter
 * 3 attempts per hour using sliding window
 */
export const passwordResetLimiter = (() => {
  const redisClient = getRedis();
  
  if (!redisClient) {
    return {
      limit: async () => ({
        success: true,
        limit: 3,
        remaining: 3,
        reset: Date.now() + 3600000,
      }),
    };
  }

  return new Ratelimit({
    redis: redisClient,
    limiter: Ratelimit.slidingWindow(3, "1 h"),
    analytics: true,
  });
})();

/**
 * Email verification rate limiter
 * 5 attempts per 15 minutes using sliding window
 */
export const emailVerificationLimiter = (() => {
  const redisClient = getRedis();
  
  if (!redisClient) {
    return {
      limit: async () => ({
        success: true,
        limit: 5,
        remaining: 5,
        reset: Date.now() + 900000,
      }),
    };
  }

  return new Ratelimit({
    redis: redisClient,
    limiter: Ratelimit.slidingWindow(5, "15 m"),
    analytics: true,
  });
})();

/**
 * Legacy function for backward compatibility
 * @deprecated Use specific limiters (loginLimiter, registrationLimiter, etc.)
 */
export function rateLimit(
  _identifier: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetAt: number } {
  console.warn(
    "rateLimit() is deprecated. Use specific limiters (loginLimiter, registrationLimiter, etc.) instead."
  );
  
  // Return allowed for backward compatibility
  return {
    allowed: true,
    remaining: maxRequests - 1,
    resetAt: Date.now() + windowMs,
  };
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use getClientIp() instead
 */
export function getClientIdentifier(req: any): string {
  console.warn("getClientIdentifier() is deprecated. Use getClientIp() instead.");
  return getClientIp(req);
}
