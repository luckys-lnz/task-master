# Documentation

Setup guides, architecture notes, and troubleshooting for Task Master. Start with the [root README](../README.md) for a project overview and quick start; use these for deeper detail on a specific subsystem.

| Doc | Covers |
|---|---|
| [DATABASE.md](DATABASE.md) | Schema, indexes, constraints, and production database checklist |
| [AUTHENTICATION_REWRITE_SUMMARY.md](AUTHENTICATION_REWRITE_SUMMARY.md) | Auth flow (NextAuth, credentials + Google OAuth), security fields, account locking |
| [RESEND_SETUP.md](RESEND_SETUP.md) | Transactional email (verification, password reset, invites) via Resend |
| [SERVICE_WORKER_SETUP.md](SERVICE_WORKER_SETUP.md) | Service worker registration and web push notification delivery |
| [NOTIFICATION_FIXES.md](NOTIFICATION_FIXES.md) | Notification system design: dedup, overdue detection, snooze, recurrence |
| [SUPABASE_STORAGE_SETUP.md](SUPABASE_STORAGE_SETUP.md) | Avatar upload storage bucket configuration on Supabase |
| [TROUBLESHOOTING_GUIDE.md](TROUBLESHOOTING_GUIDE.md) | Common setup and runtime issues, with fixes |
