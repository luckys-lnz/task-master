-- Add missing columns to users table
ALTER TABLE users
ALTER COLUMN id TYPE UUID USING id::uuid,
ADD COLUMN IF NOT EXISTS "emailVerified" TIMESTAMP,
ADD COLUMN IF NOT EXISTS "hashedPassword" TEXT,
ADD COLUMN IF NOT EXISTS "image" TEXT;

-- Add NextAuth required tables
CREATE TABLE IF NOT EXISTS accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    provider TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    refresh_token TEXT,
    access_token TEXT,
    expires_at TIMESTAMP,
    token_type TEXT,
    scope TEXT,
    id_token TEXT,
    session_state TEXT
);

CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    "sessionToken" TEXT UNIQUE NOT NULL,
    expires TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS verification_tokens (
    identifier TEXT NOT NULL,
    token TEXT NOT NULL,
    expires TIMESTAMP NOT NULL,
    PRIMARY KEY (identifier, token)
);

-- Update tasks foreign key to use UUID
ALTER TABLE tasks
ALTER COLUMN user_id TYPE UUID USING user_id::uuid; 