# Authentication System Testing Checklist

## 🧪 Local Development Testing

### Prerequisites
- [ ] Upstash Redis configured (or use fail-open mode)
- [ ] Database connection working
- [ ] Environment variables set in `.env.local`

### 1. IP Extraction Testing

**Test Cases:**
- [ ] Login with `x-forwarded-for` header → IP extracted correctly
- [ ] Login with `x-real-ip` header → IP extracted correctly
- [ ] Login with `req.ip` property → IP extracted correctly
- [ ] Login with no headers → Falls back to `0.0.0.0`
- [ ] Login with invalid IP → Falls back to `0.0.0.0`
- [ ] Login with comma-separated IPs → First IP extracted

**How to Test:**
```bash
# Use curl with custom headers
curl -X POST http://localhost:3000/api/auth/signin \
  -H "x-forwarded-for: 1.2.3.4" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test"}'
```

### 2. Rate Limiting Testing

**Test Cases:**
- [ ] Make 5 login attempts → 6th attempt blocked
- [ ] Wait 10 minutes → Rate limit resets
- [ ] Different IPs → Separate rate limits
- [ ] Same email, different IPs → Both limiters checked
- [ ] Redis unavailable in dev → Fail-open (allows requests)
- [ ] Redis unavailable in prod → Fail-closed (blocks requests)

**How to Test:**
```bash
# Rapid requests to trigger rate limit
for i in {1..6}; do
  curl -X POST http://localhost:3000/api/auth/signin \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}'
  echo "Attempt $i"
done
```

### 3. Account Locking Testing

**Test Cases:**
- [ ] 5 wrong passwords → Account locked
- [ ] Locked account → Login returns `null` (no user existence leakage)
- [ ] Lock expires → Account still locked (no auto-unlock)
- [ ] Correct password on locked account → Account unlocked
- [ ] Correct password → Failed attempts reset to 0
- [ ] Failed attempts stored as integer (check DB)

**How to Test:**
```bash
# Lock account
for i in {1..5}; do
  curl -X POST http://localhost:3000/api/auth/signin \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}'
done

# Try to login (should fail - account locked)
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"correct"}'

# Should still be locked (no auto-unlock)
# Only correct password unlocks
```

### 4. Login Flow Testing

**Test Cases:**
- [ ] Correct password + rate limited → **Login succeeds** ✅
- [ ] Wrong password + rate limited → **Login blocked** ❌
- [ ] Correct password + not rate limited → Login succeeds ✅
- [ ] Wrong password + not rate limited → Login fails (can retry) ✅
- [ ] Non-existent email → Returns `null` (no user existence leakage)
- [ ] Locked account → Returns `null` (no user existence leakage)

**How to Test:**
```bash
# Trigger rate limit first
for i in {1..5}; do
  curl -X POST http://localhost:3000/api/auth/signin \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}'
done

# Now try correct password (should work even if rate limited)
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"correct"}'
```

### 5. Google OAuth Testing

**Test Cases:**
- [ ] Google OAuth login works
- [ ] OAuth users not affected by rate limiting
- [ ] OAuth users can still use credentials if password set

### 6. Edge Cases

**Test Cases:**
- [ ] Empty email → Returns `null`
- [ ] Empty password → Returns `null`
- [ ] Invalid email format → Returns `null`
- [ ] SQL injection in email → Blocked by validation
- [ ] XSS in email → Sanitized
- [ ] Very long email → Truncated/validated
- [ ] Database timeout → Returns `null` (graceful degradation)

## 🚀 Production Testing

### Pre-Deployment Checklist

- [ ] Upstash Redis configured in Vercel
- [ ] `UPSTASH_REDIS_REST_URL` set in environment variables
- [ ] `UPSTASH_REDIS_REST_TOKEN` set in environment variables
- [ ] `RATE_LIMIT_SALT` set (optional but recommended)
- [ ] Database connection working
- [ ] Build succeeds without errors

### Production Test Cases

- [ ] Rate limiting works across multiple function instances
- [ ] IP extraction works with Vercel proxy headers
- [ ] Redis unavailable → All requests blocked (fail-closed)
- [ ] Rate limits persist across cold starts
- [ ] Account locks persist across deployments
- [ ] No user existence leakage in error messages
- [ ] Correct passwords always work

### Monitoring

- [ ] Check Upstash Redis dashboard for rate limit keys
- [ ] Monitor failed login attempts in database
- [ ] Check Vercel logs for rate limit errors
- [ ] Monitor account lock status

## 🐛 Common Issues to Test

1. **Rate Limit Not Working**
   - Check Redis connection
   - Verify environment variables
   - Check IP extraction

2. **Account Locked Forever**
   - Verify `resetFailedLoginAttempts()` is called on success
   - Check database for lock expiration
   - Verify no auto-unlock logic

3. **All Users Blocked**
   - Check IP extraction (might be returning same IP)
   - Verify Redis is working
   - Check fail-closed logic

4. **Correct Passwords Blocked**
   - Verify login flow allows correct passwords
   - Check rate limiter logic
   - Verify account lock logic

## 📝 Test Results Template

```
Date: __________
Tester: __________
Environment: [ ] Local [ ] Production

IP Extraction: [ ] Pass [ ] Fail
Rate Limiting: [ ] Pass [ ] Fail
Account Locking: [ ] Pass [ ] Fail
Login Flow: [ ] Pass [ ] Fail
Edge Cases: [ ] Pass [ ] Fail

Notes:
_________________________________
_________________________________
```
