/**
 * ======================================================================
 * UPSTASH REDIS RATE LIMITING
 * ======================================================================
 * 
 * Why Redis is required on Vercel:
 * 
 * 1. Serverless Isolation
 *    - Each function invocation runs in isolation
 *    - No shared memory between requests
 *    - In-memory rate limiting doesn't work across function instances
 * 
 * 2. Cold Starts
 *    - Functions can be cold-started, resetting in-memory state
 *    - Rate limit counters are lost on cold start
 *    - Attackers can bypass limits by triggering cold starts
 * 
 * 3. Distributed Enforcement
 *    - Multiple function instances handle requests simultaneously
 *    - In-memory state is per-instance, not global
 *    - Redis provides shared state across all instances
 * 
 * 4. Sliding Window Algorithm
 *    - More accurate than fixed window (prevents burst attacks)
 *    - Upstash provides battle-tested implementation
 *    - Handles edge cases (clock skew, concurrent requests)
 * 
 * This module configures Upstash Redis rate limiters with sliding window.
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Initialize Redis client singleton
 * Uses environment variables: UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
 * 
 * Gracefully handles missing configuration:
 * - Logs warning in development
 * - Returns null (rate limiting disabled)
 * - Prevents application crashes
 */
let redis: Redis | null = null;
let redisInitialized = false;

function getRedis(): Redis | null {
  if (redisInitialized) {
    return redis;
  }

  redisInitialized = true;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "⚠️  Upstash Redis not configured. Rate limiting is disabled.\n" +
        "   Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN environment variables.\n" +
        "   Get them from: https://console.upstash.com/"
      );
    }
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
 * No-op rate limiter for when Redis is unavailable
 * Allows application to continue functioning without rate limiting
 */
const noOpLimiter = {
  limit: async (_identifier: string) => ({
    success: true,
    limit: 5,
    remaining: 5,
    reset: Date.now() + 600000,
  }),
};

/**
 * Login rate limiter
 * 
 * Configuration:
 * - 5 attempts per 10 minutes
 * - Sliding window algorithm
 * - Per IP address
 * 
 * Why 5/10m:
 * - Allows legitimate users to retry after typos
 * - Blocks brute force attacks effectively
 * - Short enough window to prevent abuse
 * - Long enough to not frustrate users
 */
export const loginLimiter = (() => {
  const redisClient = getRedis();
  
  if (!redisClient) {
    return noOpLimiter;
  }

  return new Ratelimit({
    redis: redisClient,
    limiter: Ratelimit.slidingWindow(5, "10 m"),
    analytics: true,
    prefix: "@upstash/ratelimit/login",
  });
})();

/**
 * Registration rate limiter
 * 5 attempts per 15 minutes
 */
export const registrationLimiter = (() => {
  const redisClient = getRedis();
  
  if (!redisClient) {
    return noOpLimiter;
  }

  return new Ratelimit({
    redis: redisClient,
    limiter: Ratelimit.slidingWindow(5, "15 m"),
    analytics: true,
    prefix: "@upstash/ratelimit/registration",
  });
})();

/**
 * Password reset rate limiter
 * 3 attempts per hour
 */
export const passwordResetLimiter = (() => {
  const redisClient = getRedis();
  
  if (!redisClient) {
    return noOpLimiter;
  }

  return new Ratelimit({
    redis: redisClient,
    limiter: Ratelimit.slidingWindow(3, "1 h"),
    analytics: true,
    prefix: "@upstash/ratelimit/password-reset",
  });
})();

/**
 * Email verification rate limiter
 * 5 attempts per 15 minutes
 */
export const emailVerificationLimiter = (() => {
  const redisClient = getRedis();
  
  if (!redisClient) {
    return noOpLimiter;
  }

  return new Ratelimit({
    redis: redisClient,
    limiter: Ratelimit.slidingWindow(5, "15 m"),
    analytics: true,
    prefix: "@upstash/ratelimit/email-verification",
  });
})();
