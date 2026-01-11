# Security Module Architecture

## Overview

This module provides production-ready security utilities for authentication, rate limiting, and account protection. It's designed specifically for Vercel serverless environments.

## Module Structure

```
lib/security/
├── get-ip.ts          # Client IP extraction (Vercel-compatible)
├── rate-limit.ts      # Upstash Redis rate limiting
├── login-guards.ts    # Account locking and failed attempt tracking
└── index.ts           # Centralized exports
```

## Why This Architecture?

### Problem 1: In-Memory Rate Limiting Fails on Vercel

**Issue:**
- Vercel serverless functions run in isolation
- Each invocation has its own memory space
- Cold starts reset in-memory state
- Multiple function instances can't share state

**Solution:**
- Use Upstash Redis for distributed rate limiting
- All function instances share the same Redis state
- Sliding window algorithm prevents burst attacks
- Works consistently across cold starts

### Problem 2: Incorrect IP Extraction

**Issue:**
- `req.connection.remoteAddress` doesn't exist in serverless
- All users appear as the same IP (proxy IP)
- Rate limiting blocks everyone or no one

**Solution:**
- Extract real IP from Vercel headers:
  - `x-forwarded-for` (first IP in chain)
  - `x-real-ip` (direct proxy header)
  - `cf-connecting-ip` (Cloudflare)
- Handle both Fetch API and Node.js request objects
- Fallback to `0.0.0.0` to prevent breaking

### Problem 3: Rate Limiting Blocks Valid Users

**Issue:**
- Rate limiting logic mixed with authentication
- Hard to debug and maintain
- Can block valid credentials

**Solution:**
- Separate rate limiting from authentication
- Rate limit by IP (prevents distributed attacks)
- Account locking by email (protects specific accounts)
- Clear separation of concerns

## Usage

### IP Extraction

```typescript
import { getClientIp } from "@/lib/security/get-ip";

const ip = getClientIp(req); // Works with NextAuth and Fetch API
```

### Rate Limiting

```typescript
import { loginLimiter } from "@/lib/security/rate-limit";

const { success } = await loginLimiter.limit(ip);
if (!success) {
  throw new Error("Too many attempts");
}
```

### Account Locking

```typescript
import {
  checkAccountLocked,
  incrementFailedAttempts,
  resetFailedAttempts,
} from "@/lib/security/login-guards";

// Check if account is locked
const user = await checkAccountLocked(email);
if (!user) {
  return null; // Account locked or doesn't exist
}

// On failed login
await incrementFailedAttempts(email);

// On successful login
await resetFailedAttempts(email);
```

## Configuration

### Environment Variables

```env
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token
```

Get these from: https://console.upstash.com/

### Rate Limit Settings

- **Login**: 5 attempts per 10 minutes (sliding window)
- **Registration**: 5 attempts per 15 minutes
- **Password Reset**: 3 attempts per hour
- **Email Verification**: 5 attempts per 15 minutes

## How It Prevents 401 Errors

1. **Rate limiting happens first** (by IP)
   - Blocks brute force attacks early
   - Doesn't affect valid users with correct IP extraction

2. **Account locking is separate** (by email)
   - Protects specific accounts from targeted attacks
   - Auto-clears expired locks

3. **Valid credentials always succeed**
   - If not rate limited (IP check passes)
   - If account not locked (email check passes)
   - If password is correct

4. **Redis ensures consistency**
   - Same state across all function instances
   - No race conditions
   - Predictable behavior

## Testing

The module gracefully handles missing Redis:
- Logs warning in development
- Returns no-op limiter (allows all requests)
- Application continues to function

This allows development without Redis setup, but production should always use Redis.
