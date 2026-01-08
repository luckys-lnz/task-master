-- ============================================
-- Complete Database Schema for Task Master
-- Compatible with NextAuth DrizzleAdapter
-- Run this on Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. Users Table
-- ============================================
CREATE TABLE IF NOT EXISTS "users" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "name" text,
    "email" text NOT NULL,
    "email_verified" timestamp,
    "image" text,
    "hashed_password" text,
    "avatar_url" text,
    "notifications_enabled" boolean DEFAULT true,
    "default_view" text DEFAULT 'list',
    "theme" text DEFAULT 'light',
    "reset_password_token" text,
    "reset_password_expires" timestamp,
    "email_verification_token" text,
    "email_verification_expires" timestamp,
    "failed_login_attempts" text DEFAULT '0',
    "locked_until" timestamp,
    "created_at" timestamp DEFAULT now() NOT NULL,
    CONSTRAINT "users_email_unique" UNIQUE("email")
);

-- ============================================
-- 2. Tasks Table
-- ============================================
CREATE TABLE IF NOT EXISTS "tasks" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "user_id" uuid NOT NULL,
    "title" text NOT NULL,
    "description" text,
    "notes" text,
    "due_date" timestamp,
    "due_time" text,
    "priority" text DEFAULT 'LOW' NOT NULL,
    "category" text,
    "tags" text[],
    "position" text,
    "completed" boolean DEFAULT false NOT NULL,
    "attachments" text[],
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);

-- ============================================
-- 3. Subtasks Table
-- ============================================
CREATE TABLE IF NOT EXISTS "subtasks" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "title" text NOT NULL,
    "completed" boolean DEFAULT false NOT NULL,
    "task_id" uuid NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);

-- ============================================
-- 4. Accounts Table (NextAuth OAuth)
-- ============================================
CREATE TABLE IF NOT EXISTS "accounts" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "user_id" uuid NOT NULL,
    "type" text NOT NULL,
    "provider" text NOT NULL,
    "providerAccountId" text NOT NULL,
    "refresh_token" text,
    "access_token" text,
    "expires_at" timestamp,
    "token_type" text,
    "scope" text,
    "id_token" text,
    "session_state" text,
    CONSTRAINT "accounts_provider_providerAccountId_unique" UNIQUE("provider", "providerAccountId")
);

-- ============================================
-- 5. Sessions Table (NextAuth)
-- ============================================
CREATE TABLE IF NOT EXISTS "sessions" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "user_id" uuid NOT NULL,
    "sessionToken" text NOT NULL,
    "expires" timestamp NOT NULL,
    CONSTRAINT "sessions_sessionToken_unique" UNIQUE("sessionToken")
);

-- ============================================
-- 6. Verification Tokens Table (NextAuth)
-- ============================================
CREATE TABLE IF NOT EXISTS "verification_tokens" (
    "identifier" text NOT NULL,
    "token" text NOT NULL,
    "expires" timestamp NOT NULL,
    PRIMARY KEY ("identifier", "token")
);

-- ============================================
-- 7. Foreign Key Constraints
-- ============================================
DO $$ 
BEGIN
    -- Tasks -> Users
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'tasks_user_id_users_id_fk'
    ) THEN
        ALTER TABLE "tasks" 
        ADD CONSTRAINT "tasks_user_id_users_id_fk" 
        FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
    END IF;

    -- Subtasks -> Tasks
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'subtasks_task_id_tasks_id_fk'
    ) THEN
        ALTER TABLE "subtasks" 
        ADD CONSTRAINT "subtasks_task_id_tasks_id_fk" 
        FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE;
    END IF;

    -- Accounts -> Users
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'accounts_user_id_users_id_fk'
    ) THEN
        ALTER TABLE "accounts" 
        ADD CONSTRAINT "accounts_user_id_users_id_fk" 
        FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
    END IF;

    -- Sessions -> Users
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'sessions_user_id_users_id_fk'
    ) THEN
        ALTER TABLE "sessions" 
        ADD CONSTRAINT "sessions_user_id_users_id_fk" 
        FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
    END IF;
END $$;

-- ============================================
-- 8. Performance Indexes
-- ============================================

-- Tasks indexes
CREATE INDEX IF NOT EXISTS "idx_tasks_user_id" ON "tasks"("user_id");
CREATE INDEX IF NOT EXISTS "idx_tasks_completed" ON "tasks"("completed");
CREATE INDEX IF NOT EXISTS "idx_tasks_due_date" ON "tasks"("due_date") WHERE "due_date" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_tasks_user_completed" ON "tasks"("user_id", "completed");
CREATE INDEX IF NOT EXISTS "idx_tasks_user_due_date" ON "tasks"("user_id", "due_date") WHERE "due_date" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_tasks_priority" ON "tasks"("priority") WHERE "priority" IS NOT NULL;

-- Subtasks indexes
CREATE INDEX IF NOT EXISTS "idx_subtasks_task_id" ON "subtasks"("task_id");
CREATE INDEX IF NOT EXISTS "idx_subtasks_completed" ON "subtasks"("completed");
CREATE INDEX IF NOT EXISTS "idx_subtasks_task_completed" ON "subtasks"("task_id", "completed");

-- Accounts indexes (for OAuth lookups)
CREATE INDEX IF NOT EXISTS "idx_accounts_user_id" ON "accounts"("user_id");
CREATE INDEX IF NOT EXISTS "idx_accounts_provider" ON "accounts"("provider", "providerAccountId");

-- Sessions indexes
CREATE INDEX IF NOT EXISTS "idx_sessions_user_id" ON "sessions"("user_id");
CREATE INDEX IF NOT EXISTS "idx_sessions_expires" ON "sessions"("expires");
CREATE INDEX IF NOT EXISTS "idx_sessions_sessionToken" ON "sessions"("sessionToken");

-- Users indexes
CREATE INDEX IF NOT EXISTS "idx_users_email_verification_token" ON "users"("email_verification_token") WHERE "email_verification_token" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_users_reset_password_token" ON "users"("reset_password_token") WHERE "reset_password_token" IS NOT NULL;

-- ============================================
-- 9. Check Constraints for Data Integrity
-- ============================================

-- Task priority constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'tasks_priority_check'
    ) THEN
        ALTER TABLE "tasks" 
        ADD CONSTRAINT "tasks_priority_check" 
        CHECK ("priority" IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT'));
    END IF;
END $$;

-- User default_view constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'users_default_view_check'
    ) THEN
        ALTER TABLE "users" 
        ADD CONSTRAINT "users_default_view_check" 
        CHECK ("default_view" IN ('list', 'grid'));
    END IF;
END $$;

-- User theme constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'users_theme_check'
    ) THEN
        ALTER TABLE "users" 
        ADD CONSTRAINT "users_theme_check" 
        CHECK ("theme" IN ('light', 'dark', 'system'));
    END IF;
END $$;

-- ============================================
-- 10. Table Comments for Documentation
-- ============================================
COMMENT ON TABLE "users" IS 'User accounts with authentication and preferences';
COMMENT ON TABLE "tasks" IS 'User tasks with due dates, priorities, and metadata';
COMMENT ON TABLE "subtasks" IS 'Sub-tasks belonging to parent tasks';
COMMENT ON TABLE "accounts" IS 'OAuth account connections (NextAuth)';
COMMENT ON TABLE "sessions" IS 'User sessions (NextAuth)';
COMMENT ON TABLE "verification_tokens" IS 'Email verification tokens (NextAuth)';

COMMENT ON COLUMN "users"."failed_login_attempts" IS 'Number of failed login attempts (stored as text)';
COMMENT ON COLUMN "users"."locked_until" IS 'Account lock expiration timestamp';
COMMENT ON COLUMN "tasks"."priority" IS 'Task priority: LOW, MEDIUM, HIGH, URGENT';
COMMENT ON COLUMN "tasks"."completed" IS 'Task completion status';
COMMENT ON COLUMN "subtasks"."completed" IS 'Subtask completion status';

-- ============================================
-- Schema Creation Complete
-- ============================================
-- This schema is compatible with:
-- - NextAuth DrizzleAdapter (accounts, sessions, verification_tokens)
-- - Your custom schema.ts definitions
-- - Supabase PostgreSQL
-- 
-- Note: The schema.ts uses camelCase property names (userId, emailVerified)
-- but maps them to snake_case database columns (user_id, email_verified)
-- ============================================

