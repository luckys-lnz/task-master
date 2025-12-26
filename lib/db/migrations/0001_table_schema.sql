-- Production-ready migration to fix schema issues and add missing indexes
-- This migration ensures all tables match the schema.ts definition and adds performance indexes

-- ============================================
-- 1. Fix users table - Add missing columns
-- ============================================
ALTER TABLE users
ADD COLUMN IF NOT EXISTS reset_password_token TEXT,
ADD COLUMN IF NOT EXISTS reset_password_expires TIMESTAMP,
ADD COLUMN IF NOT EXISTS email_verification_token TEXT,
ADD COLUMN IF NOT EXISTS email_verification_expires TIMESTAMP,
ADD COLUMN IF NOT EXISTS failed_login_attempts TEXT DEFAULT '0',
ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP;

-- ============================================
-- 2. Fix tasks table - Remove duplicate is_completed column
-- ============================================
-- Drop is_completed if it exists (we use 'completed' instead)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tasks' AND column_name = 'is_completed'
    ) THEN
        -- Migrate data from is_completed to completed if needed
        UPDATE tasks 
        SET completed = COALESCE(is_completed, false)
        WHERE completed IS NULL OR (is_completed IS NOT NULL AND completed != is_completed);
        
        ALTER TABLE tasks DROP COLUMN is_completed;
    END IF;
END $$;

-- Ensure completed has NOT NULL constraint
ALTER TABLE tasks
ALTER COLUMN completed SET NOT NULL,
ALTER COLUMN completed SET DEFAULT false;

-- ============================================
-- 3. Fix subtasks table - Remove duplicate is_completed column
-- ============================================
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'subtasks' AND column_name = 'is_completed'
    ) THEN
        -- Migrate data from is_completed to completed if needed
        UPDATE subtasks 
        SET completed = COALESCE(is_completed, false)
        WHERE completed IS NULL OR (is_completed IS NOT NULL AND completed != is_completed);
        
        ALTER TABLE subtasks DROP COLUMN is_completed;
    END IF;
END $$;

-- Ensure completed has NOT NULL constraint
ALTER TABLE subtasks
ALTER COLUMN completed SET NOT NULL,
ALTER COLUMN completed SET DEFAULT false;

-- Ensure created_at and updated_at have NOT NULL constraints
ALTER TABLE subtasks
ALTER COLUMN created_at SET NOT NULL,
ALTER COLUMN created_at SET DEFAULT now(),
ALTER COLUMN updated_at SET NOT NULL,
ALTER COLUMN updated_at SET DEFAULT now();

-- ============================================
-- 4. Fix accounts table - Ensure proper constraints
-- ============================================
-- Add unique constraint on provider + providerAccountId if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'accounts_provider_providerAccountId_unique'
    ) THEN
        ALTER TABLE accounts 
        ADD CONSTRAINT accounts_provider_providerAccountId_unique 
        UNIQUE (provider, "providerAccountId");
    END IF;
END $$;

-- ============================================
-- 5. Fix sessions table - Ensure proper constraints
-- ============================================
-- sessionToken unique constraint already exists, but ensure it's indexed
-- (unique constraint creates index automatically, but we'll add explicit index for expires)

-- ============================================
-- 6. Add Performance Indexes
-- ============================================

-- Tasks table indexes
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_user_completed ON tasks(user_id, completed);
CREATE INDEX IF NOT EXISTS idx_tasks_user_due_date ON tasks(user_id, due_date) WHERE due_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority) WHERE priority IS NOT NULL;

-- Subtasks table indexes
CREATE INDEX IF NOT EXISTS idx_subtasks_task_id ON subtasks(task_id);
CREATE INDEX IF NOT EXISTS idx_subtasks_completed ON subtasks(completed);
CREATE INDEX IF NOT EXISTS idx_subtasks_task_completed ON subtasks(task_id, completed);

-- Accounts table indexes
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_provider ON accounts(provider, "providerAccountId");

-- Sessions table indexes
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires);
CREATE INDEX IF NOT EXISTS idx_sessions_sessionToken ON sessions("sessionToken");

-- Users table indexes (email already has unique constraint/index)
CREATE INDEX IF NOT EXISTS idx_users_email_verification_token ON users(email_verification_token) WHERE email_verification_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_reset_password_token ON users(reset_password_token) WHERE reset_password_token IS NOT NULL;

-- ============================================
-- 7. Add Foreign Key Indexes (if not already created by FK constraints)
-- ============================================
-- Most foreign keys should already have indexes, but ensure they exist

-- ============================================
-- 8. Add Check Constraints for Data Integrity
-- ============================================

-- Ensure priority values are valid
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'tasks_priority_check'
    ) THEN
        ALTER TABLE tasks 
        ADD CONSTRAINT tasks_priority_check 
        CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT'));
    END IF;
END $$;

-- Ensure default_view values are valid
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'users_default_view_check'
    ) THEN
        ALTER TABLE users 
        ADD CONSTRAINT users_default_view_check 
        CHECK (default_view IN ('list', 'grid'));
    END IF;
END $$;

-- Ensure theme values are valid
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'users_theme_check'
    ) THEN
        ALTER TABLE users 
        ADD CONSTRAINT users_theme_check 
        CHECK (theme IN ('light', 'dark', 'system'));
    END IF;
END $$;

-- ============================================
-- 9. Add Comments for Documentation
-- ============================================
COMMENT ON TABLE users IS 'User accounts with authentication and preferences';
COMMENT ON TABLE tasks IS 'User tasks with due dates, priorities, and metadata';
COMMENT ON TABLE subtasks IS 'Sub-tasks belonging to parent tasks';
COMMENT ON TABLE accounts IS 'OAuth account connections (NextAuth)';
COMMENT ON TABLE sessions IS 'User sessions (NextAuth)';

-- Add comment for verification_tokens only if table exists (optional NextAuth table)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'verification_tokens'
    ) THEN
        COMMENT ON TABLE verification_tokens IS 'Email verification tokens (NextAuth, optional - tokens are now stored in users table)';
    END IF;
END $$;

COMMENT ON COLUMN users.failed_login_attempts IS 'Number of failed login attempts (stored as text for simplicity)';
COMMENT ON COLUMN users.locked_until IS 'Account lock expiration timestamp';
COMMENT ON COLUMN tasks.priority IS 'Task priority: LOW, MEDIUM, HIGH, URGENT';
COMMENT ON COLUMN tasks.completed IS 'Task completion status';
COMMENT ON COLUMN subtasks.completed IS 'Subtask completion status';
