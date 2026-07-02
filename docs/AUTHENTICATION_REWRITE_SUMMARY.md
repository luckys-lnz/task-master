# Authentication System Rewrite - Summary

## 🎯 Major Changes

### 1. **Enterprise Rate Limiting** (`lib/security/rate-limit.ts`)

**Before:**
- In-memory rate limiting (didn't work on Vercel)
- No IP hashing (privacy concern)
- Fail-open in all environments

**After:**
- ✅ Upstash Redis with sliding window algorithm
- ✅ **Hashed IPs** for privacy (SHA-256 with salt)
- ✅ **Fail-closed in production** (blocks if Redis unavailable)
- ✅ **Fail-open in development** (with warnings)
- ✅ Reusable limiter factories: `createIpLimiter()`, `createEmailLimiter()`, `createCompositeLimiter()`
- ✅ Per-IP and per-email limiters for login
- ✅ Standardized `LimitResult` interface

**Key Functions:**
- `createIpLimiter(limit, window, prefix)` - IP-based rate limiting
- `createEmailLimiter(limit, window, prefix)` - Email-based rate limiting
- `createCompositeLimiter(ipLimiter, emailLimiter)` - Combined limiter

### 2. **Fixed Account Locking Logic** (`lib/auth-utils.ts`)

**Before:**
- Auto-cleared expired locks during failed attempts
- Stored failed attempts as strings
- Could unlock account without successful login

**After:**
- ✅ **Locks ONLY cleared after successful login** (in `resetFailedLoginAttempts()`)
- ✅ **No auto-unlock on expiration** during failed attempts
- ✅ Failed attempts stored as **integers** (parsed from DB text column)
- ✅ No user existence leakage (all errors return `null`)

**Key Functions:**
- `checkAccountLockedAndGetUser(email)` - Returns user if not locked, `null` if locked/not found
- `incrementFailedLoginAttempts(email)` - Increments counter, locks after 5 attempts
- `resetFailedLoginAttempts(email)` - **ONLY** place where locks are cleared

### 3. **Correct Login Flow** (`lib/auth.ts`)

**Before:**
- Rate limiting blocked all requests (including correct passwords)
- Rate limiting happened before user lookup
- Simple flow that could block legitimate users

**After:**
- ✅ **Correct passwords NEVER blocked** (even if rate limited)
- ✅ **Wrong passwords blocked if rate limited**
- ✅ User lookup happens BEFORE rate limiting (avoids wasting quota)
- ✅ Both IP and email limiters checked
- ✅ Account locks cleared only after successful login

**Flow:**
1. Extract & sanitize input
2. Lookup user (check account lock)
3. Run rate limiters (IP + email)
4. Compare password
5. If wrong: increment attempts, block if rate limited
6. If correct: reset attempts, unlock account, allow login

### 4. **Enhanced IP Extraction** (`lib/security/get-ip.ts`)

**Before:**
- Basic header extraction
- No IP validation
- Missing `req.ip` fallback

**After:**
- ✅ Validates IP format (IPv4 and IPv6)
- ✅ Checks `req.ip` as fallback
- ✅ Properly parses comma-separated `x-forwarded-for`
- ✅ Handles both Fetch API and Node.js request objects

### 5. **Privacy & Security Improvements**

- ✅ **IP hashing** - Never store raw IPs in Redis
- ✅ **No user existence leakage** - All errors return `null`
- ✅ **Fail-closed in production** - Security-first approach
- ✅ **Integer counters** - Failed attempts stored as numbers

## 📊 Configuration

### Environment Variables Required

```env
# Required in production
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token

# Optional (for IP hashing salt)
RATE_LIMIT_SALT=your-random-salt-string
```

### Rate Limit Settings

- **Login (IP)**: 5 attempts per 10 minutes
- **Login (Email)**: 5 attempts per 10 minutes
- **Registration**: 5 attempts per 15 minutes
- **Password Reset**: 3 attempts per hour
- **Email Verification**: 5 attempts per 15 minutes

### Account Locking Settings

- **Max Failed Attempts**: 5
- **Lock Duration**: 30 minutes
- **Unlock**: Only after successful login

## 🔄 Migration Notes

1. **Database Schema**: `failed_login_attempts` is still `text` column, but code treats it as integer
2. **Redis Required**: Production deployments MUST have Upstash Redis configured
3. **IP Hashing**: All IPs are hashed before storage (privacy-first)
4. **Backward Compatibility**: Old rate limit functions removed, use new factories

## ⚠️ Breaking Changes

- `loginLimiter` renamed to `loginIpLimiter` and `loginEmailLimiter`
- Rate limiting now fails-closed in production (blocks if Redis unavailable)
- Account locks no longer auto-clear on expiration
- All rate limiters now hash identifiers

## ✅ Benefits

1. **Security**: Fail-closed in production, hashed IPs, no user leakage
2. **Reliability**: Redis-based, works across serverless functions
3. **User Experience**: Correct passwords never blocked
4. **Privacy**: IPs are hashed, no raw storage
5. **Maintainability**: Clean modular structure, reusable factories
