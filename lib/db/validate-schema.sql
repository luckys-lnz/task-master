-- Schema Validation Script
-- Run this to verify your database schema matches the expected production schema

-- ============================================
-- 1. Check Users Table
-- ============================================
SELECT 
    'users' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- Expected columns:
-- id (uuid, NOT NULL, PRIMARY KEY)
-- name (text, nullable)
-- email (text, NOT NULL, UNIQUE)
-- email_verified (timestamp, nullable)
-- image (text, nullable)
-- hashed_password (text, nullable)
-- avatar_url (text, nullable)
-- notifications_enabled (boolean, default true)
-- default_view (text, default 'list')
-- theme (text, default 'light')
-- reset_password_token (text, nullable)
-- reset_password_expires (timestamp, nullable)
-- email_verification_token (text, nullable)
-- email_verification_expires (timestamp, nullable)
-- failed_login_attempts (text, default '0')
-- locked_until (timestamp, nullable)
-- created_at (timestamp, NOT NULL, default now())

-- ============================================
-- 2. Check Tasks Table
-- ============================================
SELECT 
    'tasks' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'tasks'
ORDER BY ordinal_position;

-- Expected columns:
-- id (uuid, NOT NULL, PRIMARY KEY)
-- user_id (uuid, NOT NULL, FK to users.id)
-- title (text, NOT NULL)
-- description (text, nullable)
-- notes (text, nullable)
-- due_date (timestamp, nullable)
-- due_time (text, nullable)
-- priority (text, NOT NULL, default 'LOW')
-- category (text, nullable)
-- tags (text[], nullable)
-- position (text, nullable)
-- completed (boolean, NOT NULL, default false)
-- attachments (text[], nullable)
-- created_at (timestamp, NOT NULL, default now())
-- updated_at (timestamp, NOT NULL, default now())

-- ============================================
-- 3. Check Subtasks Table
-- ============================================
SELECT 
    'subtasks' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'subtasks'
ORDER BY ordinal_position;

-- Expected columns:
-- id (uuid, NOT NULL, PRIMARY KEY)
-- title (text, NOT NULL)
-- completed (boolean, NOT NULL, default false)
-- task_id (uuid, NOT NULL, FK to tasks.id)
-- created_at (timestamp, NOT NULL, default now())
-- updated_at (timestamp, NOT NULL, default now())

-- ============================================
-- 4. Check for Duplicate Columns
-- ============================================
SELECT 
    table_name,
    column_name,
    COUNT(*) as count
FROM information_schema.columns
WHERE table_name IN ('tasks', 'subtasks')
    AND column_name IN ('is_completed', 'completed')
GROUP BY table_name, column_name
HAVING COUNT(*) > 0;

-- Should return only 'completed' columns, not 'is_completed'

-- ============================================
-- 5. Check Indexes
-- ============================================
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
    AND tablename IN ('users', 'tasks', 'subtasks', 'accounts', 'sessions')
ORDER BY tablename, indexname;

-- Expected indexes:
-- tasks: idx_tasks_user_id, idx_tasks_completed, idx_tasks_due_date, idx_tasks_user_completed, idx_tasks_user_due_date, idx_tasks_priority
-- subtasks: idx_subtasks_task_id, idx_subtasks_completed, idx_subtasks_task_completed
-- accounts: idx_accounts_user_id, idx_accounts_provider
-- sessions: idx_sessions_user_id, idx_sessions_expires, idx_sessions_sessionToken
-- users: idx_users_email_verification_token, idx_users_reset_password_token

-- ============================================
-- 6. Check Foreign Key Constraints
-- ============================================
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
    ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
    AND tc.table_name IN ('tasks', 'subtasks', 'accounts', 'sessions')
ORDER BY tc.table_name, kcu.column_name;

-- Expected foreign keys:
-- tasks.user_id -> users.id (CASCADE)
-- subtasks.task_id -> tasks.id (CASCADE)
-- accounts.user_id -> users.id (CASCADE)
-- sessions.user_id -> users.id (CASCADE)

-- ============================================
-- 7. Check Check Constraints
-- ============================================
SELECT
    conname as constraint_name,
    conrelid::regclass as table_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE contype = 'c'
    AND conrelid::regclass::text IN ('users', 'tasks')
ORDER BY conrelid::regclass::text, conname;

-- Expected check constraints:
-- tasks_priority_check: priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')
-- users_default_view_check: default_view IN ('list', 'grid')
-- users_theme_check: theme IN ('light', 'dark', 'system')

-- ============================================
-- 8. Check Unique Constraints
-- ============================================
SELECT
    tc.table_name,
    tc.constraint_name,
    kcu.column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.constraint_type = 'UNIQUE'
    AND tc.table_schema = 'public'
    AND tc.table_name IN ('users', 'sessions', 'accounts')
ORDER BY tc.table_name, tc.constraint_name;

-- Expected unique constraints:
-- users.email (unique)
-- sessions.sessionToken (unique)
-- accounts (provider, providerAccountId) (unique)
