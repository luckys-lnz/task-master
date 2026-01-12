-- ============================================
-- Migration: Upgrade Task Status System
-- ============================================
-- This migration:
-- 1. Removes the boolean 'completed' column
-- 2. Adds status enum (PENDING, COMPLETED, OVERDUE)
-- 3. Adds completed_at and overdue_at timestamps
-- 4. Adds locked_after_due boolean flag
-- 5. Migrates existing data
-- ============================================

-- Step 1: Add new columns first (before dropping old ones)
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS status text DEFAULT 'PENDING' NOT NULL,
ADD COLUMN IF NOT EXISTS completed_at timestamp,
ADD COLUMN IF NOT EXISTS overdue_at timestamp,
ADD COLUMN IF NOT EXISTS locked_after_due boolean DEFAULT true NOT NULL;

-- Step 2: Migrate existing data
-- Set status to COMPLETED for tasks that were completed
-- Set completed_at timestamp (use updated_at as approximation if available)
UPDATE tasks
SET 
  status = CASE 
    WHEN completed = true THEN 'COMPLETED'
    WHEN completed = false AND due_date IS NOT NULL AND (
      (due_time IS NULL AND due_date < NOW())
      OR
      (due_time IS NOT NULL AND (due_date::date + due_time::time) < NOW())
    ) THEN 'OVERDUE'
    ELSE 'PENDING'
  END,
  completed_at = CASE 
    WHEN completed = true THEN COALESCE(updated_at, created_at)
    ELSE NULL
  END,
  overdue_at = CASE
    WHEN completed = false AND due_date IS NOT NULL AND (
      (due_time IS NULL AND due_date < NOW())
      OR
      (due_time IS NOT NULL AND (due_date::date + due_time::time) < NOW())
    ) THEN NOW()
    ELSE NULL
  END;

-- Step 3: Add check constraint for status values
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'tasks_status_check'
    ) THEN
        ALTER TABLE tasks 
        ADD CONSTRAINT tasks_status_check 
        CHECK (status IN ('PENDING', 'COMPLETED', 'OVERDUE'));
    END IF;
END $$;

-- Step 4: Drop the old completed column
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tasks' AND column_name = 'completed'
    ) THEN
        ALTER TABLE tasks DROP COLUMN completed;
    END IF;
END $$;

-- Step 5: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_user_status ON tasks(user_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_overdue_at ON tasks(overdue_at) WHERE overdue_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_completed_at ON tasks(completed_at) WHERE completed_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_due_status ON tasks(due_date, status) WHERE due_date IS NOT NULL;

-- Step 6: Add comments for documentation
COMMENT ON COLUMN tasks.status IS 'Task status: PENDING, COMPLETED, or OVERDUE';
COMMENT ON COLUMN tasks.completed_at IS 'Timestamp when task was marked as completed';
COMMENT ON COLUMN tasks.overdue_at IS 'Timestamp when task was marked as overdue';
COMMENT ON COLUMN tasks.locked_after_due IS 'If true, prevents editing when task is overdue';
