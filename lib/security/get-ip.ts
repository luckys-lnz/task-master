/**
 * ======================================================================
 * CLIENT IP EXTRACTION UTILITY
 * ======================================================================
 * 
 * Enterprise-grade IP extraction for Vercel serverless environments.
 * 
 * Why this exists:
 * - Vercel serverless functions don't have req.connection.remoteAddress
 * - NextAuth passes different request object types (Fetch API vs Node.js)
 * - Production environments use proxy headers (x-forwarded-for, x-real-ip)
 * - Without correct IP extraction, all users appear as the same IP
 * 
 * Security considerations:
 * - Never logs or exposes raw IPs
 * - Handles IPv4 and IPv6
 * - Validates IP format before returning
 */

/**
 * Validate IP address format (IPv4 or IPv6)
 */
function isValidIp(ip: string): boolean {
  if (!ip || typeof ip !== "string") {
    return false;
  }

  // IPv4 regex
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  // IPv6 regex (simplified - covers most cases)
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$|^::$/;

  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}

/**
 * Extract real client IP from request
 * 
 * Priority order:
 * 1. x-forwarded-for (first IP in comma-separated chain) - Vercel/proxy standard
 * 2. x-real-ip - Direct proxy header
 * 3. req.ip - Direct IP property (if available)
 * 4. cf-connecting-ip - Cloudflare header
 * 5. 0.0.0.0 - Fallback (prevents rate limiting from breaking)
 * 
 * Handles both:
 * - Fetch API Request objects (standard web Request with Headers instance)
 * - Node.js request objects (NextAuth internal calls with plain object headers)
 * 
 * @param req - Request object (Fetch API Request or NextAuth internal request)
 * @returns Client IP address string (validated)
 */
export function getClientIp(req: Request | any): string {
  if (!req || typeof req !== "object") {
    return "0.0.0.0";
  }

  let ip: string | null = null;

  // Case 1: Fetch API Request object (standard web Request)
  // Headers is a Headers instance with .get() method
  if (req.headers instanceof Headers || typeof req.headers.get === "function") {
    // x-forwarded-for can contain multiple IPs: "client, proxy1, proxy2"
    // We want the first one (original client)
    const forwarded = req.headers.get("x-forwarded-for");
    if (forwarded) {
      const firstIp = forwarded.split(",")[0]?.trim();
      if (firstIp && isValidIp(firstIp)) {
        ip = firstIp;
      }
    }

    if (!ip) {
      const realIp = req.headers.get("x-real-ip");
      if (realIp && isValidIp(realIp.trim())) {
        ip = realIp.trim();
      }
    }

    if (!ip) {
      const cfIp = req.headers.get("cf-connecting-ip");
      if (cfIp && isValidIp(cfIp.trim())) {
        ip = cfIp.trim();
      }
    }
  }
  // Case 2: Node.js request object (NextAuth internal calls)
  // Headers are a plain object with case-insensitive keys
  else if (typeof req.headers === "object" && req.headers !== null) {
    // Check x-forwarded-for (multiple case variations)
    const forwarded =
      req.headers["x-forwarded-for"] ||
      req.headers["X-Forwarded-For"] ||
      req.headers["X-FORWARDED-FOR"];

    if (forwarded) {
      const ipString = typeof forwarded === "string" ? forwarded : String(forwarded);
      const firstIp = ipString.split(",")[0]?.trim();
      if (firstIp && isValidIp(firstIp)) {
        ip = firstIp;
      }
    }

    if (!ip) {
      const realIp =
        req.headers["x-real-ip"] ||
        req.headers["X-Real-Ip"] ||
        req.headers["X-Real-IP"];

      if (realIp) {
        const ipString = typeof realIp === "string" ? realIp : String(realIp);
        if (isValidIp(ipString.trim())) {
          ip = ipString.trim();
        }
      }
    }

    if (!ip) {
      const cfIp =
        req.headers["cf-connecting-ip"] || req.headers["CF-Connecting-IP"];

      if (cfIp) {
        const ipString = typeof cfIp === "string" ? cfIp : String(cfIp);
        if (isValidIp(ipString.trim())) {
          ip = ipString.trim();
        }
      }
    }
  }

  // Case 3: Direct req.ip property (if available)
  if (!ip && req.ip && typeof req.ip === "string" && isValidIp(req.ip)) {
    ip = req.ip;
  }

  // Return validated IP or fallback
  return ip && isValidIp(ip) ? ip : "0.0.0.0";
}
