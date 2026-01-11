/**
 * ======================================================================
 * CLIENT IP EXTRACTION UTILITY
 * ======================================================================
 * 
 * Why this exists:
 * - Vercel serverless functions don't have req.connection.remoteAddress
 * - NextAuth passes different request object types (Fetch API vs Node.js)
 * - Production environments use proxy headers (x-forwarded-for, x-real-ip)
 * - Without correct IP extraction, all users appear as the same IP
 * 
 * This module safely extracts the real client IP from various request formats.
 */

/**
 * Extract real client IP from request
 * 
 * Priority order:
 * 1. x-forwarded-for (first IP in chain) - Vercel/proxy standard
 * 2. x-real-ip - Direct proxy header
 * 3. cf-connecting-ip - Cloudflare header
 * 4. 0.0.0.0 - Fallback (prevents rate limiting from breaking)
 * 
 * Handles both:
 * - Fetch API Request objects (standard web Request with Headers instance)
 * - Node.js request objects (NextAuth internal calls with plain object headers)
 * 
 * @param req - Request object (Fetch API Request or NextAuth internal request)
 * @returns Client IP address string
 */
export function getClientIp(req: Request | any): string {
  if (!req || typeof req !== "object" || !req.headers) {
    return "0.0.0.0";
  }

  // Case 1: Fetch API Request object (standard web Request)
  // Headers is a Headers instance with .get() method
  if (req.headers instanceof Headers || typeof req.headers.get === "function") {
    const forwarded = req.headers.get("x-forwarded-for");
    const realIp = req.headers.get("x-real-ip");
    const cfIp = req.headers.get("cf-connecting-ip");

    // x-forwarded-for can contain multiple IPs (client, proxy1, proxy2)
    // We want the first one (original client)
    if (forwarded) {
      const firstIp = forwarded.split(",")[0]?.trim();
      if (firstIp) return firstIp;
    }

    if (realIp) return realIp.trim();
    if (cfIp) return cfIp.trim();

    return "0.0.0.0";
  }

  // Case 2: Node.js request object (NextAuth internal calls)
  // Headers are a plain object with case-insensitive keys
  if (typeof req.headers === "object") {
    const forwarded = 
      req.headers["x-forwarded-for"] || 
      req.headers["X-Forwarded-For"] ||
      req.headers["x-forwarded-for"];

    const realIp = 
      req.headers["x-real-ip"] || 
      req.headers["X-Real-Ip"] ||
      req.headers["X-Real-IP"];

    const cfIp = 
      req.headers["cf-connecting-ip"] || 
      req.headers["CF-Connecting-IP"];

    // Extract first IP from x-forwarded-for chain
    if (forwarded) {
      const ipString = typeof forwarded === "string" ? forwarded : String(forwarded);
      const firstIp = ipString.split(",")[0]?.trim();
      if (firstIp) return firstIp;
    }

    if (realIp) {
      return typeof realIp === "string" ? realIp.trim() : String(realIp).trim();
    }

    if (cfIp) {
      return typeof cfIp === "string" ? cfIp.trim() : String(cfIp).trim();
    }
  }

  // Fallback - prevents rate limiting from breaking authentication
  return "0.0.0.0";
}
