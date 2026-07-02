# Rate Limiting Troubleshooting Guide

## 🔍 Common Issues and Solutions

### Issue 1: Rate Limiting Not Working

**Symptoms:**
- Users can make unlimited login attempts
- No rate limit errors in logs
- Redis keys not appearing in Upstash dashboard

**Diagnosis:**
1. Check if Redis is configured:
   ```bash
   echo $UPSTASH_REDIS_REST_URL
   echo $UPSTASH_REDIS_REST_TOKEN
   ```

2. Check environment:
   - Development: Fail-open (allows all requests)
   - Production: Fail-closed (blocks if Redis unavailable)

3. Check Redis connection:
   ```typescript
   // Add to your code temporarily
   const redis = new Redis({
     url: process.env.UPSTASH_REDIS_REST_URL,
     token: process.env.UPSTASH_REDIS_REST_TOKEN,
   });
   await redis.ping(); // Should return "PONG"
   ```

**Solutions:**
- ✅ Set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` in Vercel
- ✅ Verify Redis credentials in Upstash dashboard
- ✅ Check network connectivity to Upstash
- ✅ Verify environment variables are set in production

---

### Issue 2: All Users Getting Blocked

**Symptoms:**
- All login attempts blocked
- Rate limit errors for legitimate users
- Same IP appearing for all users

**Diagnosis:**
1. Check IP extraction:
   ```typescript
   // Add logging temporarily
   const ip = getClientIp(req);
   console.log("Extracted IP:", ip);
   ```

2. Check if IP is being hashed correctly:
   ```typescript
   // IP should be hashed before storage
   const hashed = hashIdentifier(ip);
   console.log("Hashed IP:", hashed);
   ```

3. Check Vercel headers:
   - `x-forwarded-for` should contain real client IP
   - First IP in comma-separated list is the client

**Solutions:**
- ✅ Verify `x-forwarded-for` header is present
- ✅ Check IP extraction logic handles Vercel correctly
- ✅ Verify `req.ip` fallback works
- ✅ Check if proxy is stripping headers

---

### Issue 3: Correct Passwords Being Blocked

**Symptoms:**
- Valid credentials return 401
- Rate limit error even with correct password
- Users cannot login with correct credentials

**Diagnosis:**
1. Check login flow in `lib/auth.ts`:
   ```typescript
   // Correct password should bypass rate limit
   if (isValidPassword) {
     // Should always allow, even if rate limited
     await resetFailedLoginAttempts(normalizedEmail);
     return user;
   }
   ```

2. Check if rate limiter is blocking before password check:
   - Rate limiter should run AFTER user lookup
   - Correct passwords should bypass rate limit

**Solutions:**
- ✅ Verify login flow allows correct passwords
- ✅ Check rate limiter is not blocking before password validation
- ✅ Ensure `resetFailedLoginAttempts()` is called on success
- ✅ Check account lock status (might be locked)

---

### Issue 4: Account Locked Forever

**Symptoms:**
- Account remains locked after lock expiration
- Users cannot login even after waiting
- `locked_until` timestamp passed but account still locked

**Diagnosis:**
1. Check account lock logic:
   ```typescript
   // Locks should ONLY be cleared after successful login
   // NOT automatically on expiration
   ```

2. Check database:
   ```sql
   SELECT email, locked_until, failed_login_attempts 
   FROM users 
   WHERE email = 'user@example.com';
   ```

3. Verify `resetFailedLoginAttempts()` is called:
   - Should be called in `authorize()` after successful login
   - Should clear both `failed_login_attempts` and `locked_until`

**Solutions:**
- ✅ Login with correct password (unlocks account)
- ✅ Verify `resetFailedLoginAttempts()` is called
- ✅ Check database for lock status
- ✅ Manually reset in database if needed:
  ```sql
  UPDATE users 
  SET failed_login_attempts = '0', locked_until = NULL 
  WHERE email = 'user@example.com';
  ```

---

### Issue 5: Rate Limits Not Persisting

**Symptoms:**
- Rate limits reset on every request
- Cold starts reset counters
- Multiple function instances have different limits

**Diagnosis:**
1. Check Redis connection:
   - Each function instance should use same Redis
   - Keys should persist across cold starts

2. Check key naming:
   ```typescript
   // Keys should be consistent
   const key = hashIdentifier(ip);
   // Should be same for same IP across instances
   ```

**Solutions:**
- ✅ Verify Redis is shared across all function instances
- ✅ Check Upstash dashboard for rate limit keys
- ✅ Verify key hashing is consistent
- ✅ Check Redis connection pooling

---

### Issue 6: User Existence Leakage

**Symptoms:**
- Different error messages for existing vs non-existing users
- Attackers can enumerate valid emails
- Error messages reveal account status

**Diagnosis:**
1. Check all return paths in `authorize()`:
   ```typescript
   // All should return null
   if (!user) return null; // Not found
   if (user.locked_until) return null; // Locked
   if (!isValidPassword) return null; // Wrong password
   ```

2. Check error messages:
   - Should be generic
   - Should not reveal user existence

**Solutions:**
- ✅ All errors return `null` (no user existence leakage)
- ✅ Generic error messages
- ✅ Same response time for all cases
- ✅ No timing attacks

---

### Issue 7: Redis Connection Errors

**Symptoms:**
- "Failed to initialize Upstash Redis" errors
- Rate limiting not working
- Production blocking all requests

**Diagnosis:**
1. Check environment variables:
   ```bash
   # Should be set in Vercel
   UPSTASH_REDIS_REST_URL
   UPSTASH_REDIS_REST_TOKEN
   ```

2. Check Redis credentials:
   - URL format: `https://xxx.upstash.io`
   - Token should be valid

3. Check network:
   - Vercel should be able to reach Upstash
   - No firewall blocking

**Solutions:**
- ✅ Verify credentials in Upstash dashboard
- ✅ Check Vercel environment variables
- ✅ Test Redis connection manually
- ✅ Check Upstash status page
- ✅ Verify network connectivity

---

## 🔧 Debugging Tools

### 1. Enable Debug Logging

Add to `lib/auth.ts`:
```typescript
if (env.NODE_ENV === "development") {
  console.log("IP:", ip);
  console.log("Rate limit result:", ipLimitResult);
  console.log("User:", user?.email);
  console.log("Password valid:", isValidPassword);
}
```

### 2. Check Redis Keys

In Upstash dashboard:
- Look for keys starting with `@upstash/ratelimit/`
- Check key expiration times
- Verify hashed IPs (not raw IPs)

### 3. Database Queries

```sql
-- Check account lock status
SELECT email, locked_until, failed_login_attempts 
FROM users 
WHERE email = 'user@example.com';

-- Check all locked accounts
SELECT email, locked_until 
FROM users 
WHERE locked_until > NOW();

-- Reset account lock (emergency only)
UPDATE users 
SET failed_login_attempts = '0', locked_until = NULL 
WHERE email = 'user@example.com';
```

### 4. Vercel Logs

```bash
# Check function logs
vercel logs

# Filter for rate limit errors
vercel logs | grep "rate limit"
```

---

## 📞 Support Contacts

- **Upstash Support**: https://upstash.com/docs
- **Vercel Support**: https://vercel.com/support
- **NextAuth Docs**: https://next-auth.js.org

---

## ✅ Verification Checklist

After fixing an issue, verify:

- [ ] Rate limiting works correctly
- [ ] IP extraction is accurate
- [ ] Account locks work as expected
- [ ] Correct passwords always work
- [ ] No user existence leakage
- [ ] Redis connection is stable
- [ ] Production fail-closed works
- [ ] Development fail-open works
