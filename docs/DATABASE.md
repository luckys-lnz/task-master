# Production Database Setup Guide

This guide ensures your database is production-ready with proper schema, indexes, and constraints.

## Quick Start

1. **Run the production migration:**
   ```bash
   psql $DATABASE_URL -f lib/db/migrations/0003_production_ready.sql
   ```

2. **Validate the schema:**
   ```bash
   psql $DATABASE_URL -f lib/db/validate-schema.sql
   ```

## What the Migration Does

### 1. Schema Fixes
- ✅ Adds missing security columns to `users` table:
  - `reset_password_token`, `reset_password_expires`
  - `email_verification_token`, `email_verification_expires`
  - `failed_login_attempts`, `locked_until`

- ✅ Removes duplicate `is_completed` columns from `tasks` and `subtasks` tables
- ✅ Ensures proper NOT NULL constraints on all required columns

### 2. Performance Indexes
- **Tasks table:**
  - `idx_tasks_user_id` - Fast user task queries
  - `idx_tasks_completed` - Filter completed/incomplete tasks
  - `idx_tasks_due_date` - Date-based queries (partial index)
  - `idx_tasks_user_completed` - Composite index for common queries
  - `idx_tasks_user_due_date` - User tasks by due date
  - `idx_tasks_priority` - Priority filtering

- **Subtasks table:**
  - `idx_subtasks_task_id` - Fast subtask lookups
  - `idx_subtasks_completed` - Filter completed subtasks
  - `idx_subtasks_task_completed` - Composite index

- **Accounts table:**
  - `idx_accounts_user_id` - OAuth account lookups
  - `idx_accounts_provider` - Provider-based queries

- **Sessions table:**
  - `idx_sessions_user_id` - User session lookups
  - `idx_sessions_expires` - Cleanup expired sessions
  - `idx_sessions_sessionToken` - Fast session validation

- **Users table:**
  - `idx_users_email_verification_token` - Email verification lookups
  - `idx_users_reset_password_token` - Password reset lookups

### 3. Data Integrity
- ✅ Check constraints for `priority` (LOW, MEDIUM, HIGH, URGENT)
- ✅ Check constraints for `default_view` (list, grid)
- ✅ Check constraints for `theme` (light, dark, system)
- ✅ Unique constraint on `accounts(provider, providerAccountId)`

### 4. Foreign Keys
All foreign keys are properly configured with CASCADE delete:
- `tasks.user_id` → `users.id` (CASCADE)
- `subtasks.task_id` → `tasks.id` (CASCADE)
- `accounts.user_id` → `users.id` (CASCADE)
- `sessions.user_id` → `users.id` (CASCADE)

## Schema Validation

After running the migration, validate your schema:

```bash
psql $DATABASE_URL -f lib/db/validate-schema.sql
```

This will show:
- All table columns and their types
- All indexes
- All foreign key constraints
- All check constraints
- All unique constraints

## Production Checklist

- [ ] Run migration `0003_production_ready.sql`
- [ ] Validate schema with `validate-schema.sql`
- [ ] Verify no duplicate `is_completed` columns exist
- [ ] Check all indexes are created
- [ ] Verify foreign key constraints
- [ ] Test cascade deletes (delete user → tasks/subtasks deleted)
- [ ] Monitor query performance
- [ ] Set up database backups

## Common Issues

### Issue: Duplicate `is_completed` column
**Solution:** The migration automatically migrates data from `is_completed` to `completed` and removes the duplicate.

### Issue: Missing indexes
**Solution:** All required indexes are created by the migration. If missing, re-run the migration.

### Issue: Foreign key errors
**Solution:** Ensure all foreign key relationships are properly set up. The migration includes all necessary constraints.

## Performance Tips

1. **Monitor slow queries:**
   ```sql
   SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;
   ```

2. **Analyze table statistics:**
   ```sql
   ANALYZE users, tasks, subtasks, accounts, sessions;
   ```

3. **Check index usage:**
   ```sql
   SELECT schemaname, tablename, indexname, idx_scan 
   FROM pg_stat_user_indexes 
   WHERE schemaname = 'public' 
   ORDER BY idx_scan;
   ```

## Backup Before Migration

⚠️ **Always backup your database before running migrations in production!**

```bash
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
```

## Rollback

If you need to rollback, you can restore from backup:
```bash
psql $DATABASE_URL < backup_YYYYMMDD_HHMMSS.sql
```

## Support

For issues or questions, check:
- Schema definition: `lib/db/schema.ts`
- Migration files: `lib/db/migrations/`
- Validation script: `lib/db/validate-schema.sql`
