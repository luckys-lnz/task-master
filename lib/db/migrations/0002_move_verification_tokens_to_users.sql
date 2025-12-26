-- Migration: Move email verification tokens from verification_tokens table to users table
-- This simplifies the schema by storing verification tokens in the users table
-- (similar to how password reset tokens are stored)

-- Add new columns to users table for email verification tokens
ALTER TABLE users
ADD COLUMN IF NOT EXISTS email_verification_token TEXT,
ADD COLUMN IF NOT EXISTS email_verification_expires TIMESTAMP;

-- Optional: Drop the verification_tokens table if it exists and is empty
-- Uncomment the following line if you want to remove the table:
-- DROP TABLE IF EXISTS verification_tokens;
