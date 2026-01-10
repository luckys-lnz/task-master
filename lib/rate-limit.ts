/**
 * Simple in-memory rate limiting utility
 * For production, consider using Redis or a dedicated rate limiting service
 */

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

/**
 * Simple rate limiter
 * @param identifier - Unique identifier (e.g., IP address, user ID, email)
 * @param maxRequests - Maximum number of requests allowed
 * @param windowMs - Time window in milliseconds
 * @returns true if request is allowed, false if rate limited
 */
export function rateLimit(
  identifier: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const key = identifier;

  // Clean up expired entries periodically (every 1000 calls)
  if (Math.random() < 0.001) {
    for (const k in store) {
      if (store[k].resetTime < now) {
        delete store[k];
      }
    }
  }

  const entry = store[key];

  if (!entry || entry.resetTime < now) {
    // Create new entry or reset expired entry
    store[key] = {
      count: 1,
      resetTime: now + windowMs,
    };
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetAt: now + windowMs,
    };
  }

  if (entry.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetTime,
    };
  }

  entry.count++;
  return {
    allowed: true,
    remaining: maxRequests - entry.count,
    resetAt: entry.resetTime,
  };
}

/**
 * Get client identifier from request
 * Handles both Node.js requests (NextAuth internal) and Fetch requests (browser)
 */
export function getClientIdentifier(req: any): string {
  try {
    // Case 1: Node.js request object (NextAuth internal calls)
    // NextAuth passes a Node.js request-like object with headers as object
    if (req && typeof req === "object" && req.headers) {
      // Check if it's a Node.js headers object (not a Headers instance)
      if (typeof req.headers === "object" && !req.headers.get) {
        // Node.js request - headers are a plain object
        const forwarded = req.headers["x-forwarded-for"] || req.headers["X-Forwarded-For"];
        const realIp = req.headers["x-real-ip"] || req.headers["X-Real-Ip"];
        const socketIp = req.socket?.remoteAddress;
        
        if (forwarded) {
          return typeof forwarded === "string" ? forwarded.split(",")[0].trim() : String(forwarded).split(",")[0].trim();
        }
        if (realIp) {
          return typeof realIp === "string" ? realIp : String(realIp);
        }
        if (socketIp) {
          return socketIp;
        }
      }
    }

    // Case 2: Fetch Request object (browser/client-side)
    // Headers is a Headers instance with .get() method
    if (req?.headers?.get) {
      const forwarded = req.headers.get("x-forwarded-for");
      const realIp = req.headers.get("x-real-ip");
      
      if (forwarded) {
        return forwarded.split(",")[0].trim();
      }
      if (realIp) {
        return realIp;
      }
    }
  } catch (error) {
    console.error("Error extracting client IP:", error);
  }

  // Fallback to unknown if we can't determine IP
  // This prevents rate limiting from breaking authentication
  return "unknown";
}
