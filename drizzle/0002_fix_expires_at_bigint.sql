-- Migration to change expires_at from timestamp to integer
-- NextAuth passes Unix timestamps (numbers) but Drizzle timestamp expects Date objects
-- DrizzleAdapter expects integer type for expires_at (PgInteger)

-- Convert existing timestamp values to Unix timestamps (integer)
-- If expires_at is NULL, keep it NULL
-- If expires_at has a value, convert it to Unix timestamp
ALTER TABLE accounts 
ALTER COLUMN expires_at TYPE integer 
USING CASE 
  WHEN expires_at IS NULL THEN NULL
  ELSE EXTRACT(EPOCH FROM expires_at)::integer
END;

