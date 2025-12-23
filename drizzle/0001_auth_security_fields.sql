-- Add security fields to users table for password reset and account locking
ALTER TABLE users
ADD COLUMN IF NOT EXISTS reset_password_token TEXT,
ADD COLUMN IF NOT EXISTS reset_password_expires TIMESTAMP,
ADD COLUMN IF NOT EXISTS failed_login_attempts TEXT DEFAULT '0',
ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP;
