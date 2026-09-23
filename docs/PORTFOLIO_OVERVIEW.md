# Portfolio Overview

## Task Master

**Product and description**

Task Master is a multi-user productivity SaaS for planning, prioritizing, completing, and reviewing tasks, with built-in focus tools and behavioral interventions for repeated deferral.

**Target users and industry**

Individuals, freelancers, knowledge workers, and small teams in productivity software, collaboration, and personal task management. The code supports both single-user workflows and task-level collaboration.

**Main business problem solved**

It addresses the gap between recording work and actually completing it. The product combines structured task management with due-date state transitions, focus sessions, reminders, analytics, and a procrastination intervention that helps users clarify, break down, reschedule, deprioritize, or remove repeatedly deferred work.

**Current status**

Actively maintained at the codebase level. Recent repository commits in July 2026 address avatar uploads, recurring-task concurrency, and deferral tracking. A live production URL, operating metrics, and current customer availability are not verifiable from the source repository; confirm whether the service is currently live, paused, or in private operation before a transaction.

**Technology stack**

- Next.js 14 App Router, React 18, and TypeScript
- PostgreSQL with Drizzle ORM and SQL migrations
- Supabase JavaScript client, Realtime, and optional Storage integration
- NextAuth credentials authentication with optional Google OAuth
- Tailwind CSS, Radix UI, Framer Motion, Lucide, and React Hook Form
- Zod validation and bcrypt password hashing
- Resend transactional email
- Web Push with VAPID and a service worker
- Upstash Redis rate limiting
- Node.js production runtime with Next.js standalone output

**Key features**

- Task creation and editing with descriptions, notes, categories, tags, priorities, due dates, start/end times, and attachments
- Pending, completed, and overdue task lifecycle with optional lock-after-due behavior
- Recurring tasks with daily, weekday, weekly, and monthly intervals
- Subtasks with assignment, ordering, completion tracking, and completion attribution
- List and Kanban views, drag-and-drop ordering, archiving, and task duplication
- Procrastination Shield using deferral count and reason capture
- Pomodoro-style Focus mode
- Task and account productivity statistics
- Task-level collaborators, role/status tracking, email invitations, and invite acceptance
- Public read-only task sharing through tokenized links
- Live task synchronization through Supabase Realtime
- Due, overdue, and start-time web push notifications with mute and snooze controls
- Transactional email for verification, password reset, and invitations
- Email/password and optional Google sign-in, email verification, password reset, account lockout, and sensitive-route rate limiting
- Scheduled API route for overdue-task processing
- User profile, avatar, notification, theme, and default-view settings

**Deployment environment and infrastructure**

The application is designed to run as a Node.js/Next.js deployment using `output: standalone`. Its production URL logic explicitly supports Vercel through `VERCEL_URL`, while the application also requires a PostgreSQL connection and can use Supabase for database, Realtime, and Storage capabilities. External services include Resend, Upstash Redis, Google OAuth, and VAPID push delivery. The repository contains no Dockerfile, Kubernetes manifest, CI workflow, or infrastructure-as-code configuration, so the exact current hosting topology is not confirmed.

**Rights and ownership**

The repository includes an MIT license, but source inspection cannot establish that the seller owns all copyright, trademarks, visual assets, generated assets, domain names, or third-party service accounts. Confirm contributor assignments, asset provenance, trademark/domain ownership, dependency obligations, and any contractors or open-source notices during diligence. The buyer should receive only transferable accounts and assets for which the seller has the right to grant ownership or access.

**Revenue, users, and traction**

No revenue, subscriber, user-count, retention, payment, billing, analytics, or marketplace data is present in the inspected application source/configuration. Treat commercial traction as unverified and request supporting operating records from the seller.

**Included in a potential sale**

- Application source code and commit history
- Next.js UI, API routes, authentication, task-management, collaboration, sharing, notification, focus, and statistics modules
- PostgreSQL/Drizzle schema and migration history
- Public assets, service worker, and application configuration templates
- Deployment/build configuration and documented environment-variable requirements
- Transferable domains, repositories, deployment projects, database projects, storage buckets, email accounts, Redis resources, OAuth applications, and push credentials only where ownership and transfer are legally permitted
- Reasonable handover documentation, deployment walkthrough, and defect clarification

Secrets, production data, customer personal data, and third-party accounts should be transferred only through a documented process that satisfies privacy, security, and provider terms.

**Preferred transaction**

Seller preference is not stated in the codebase. The most practical structure for this product would be a full acquisition of the software and transferable assets, plus a defined transition-support period covering deployment, database migrations, integrations, and operational handover. A license-only transaction would leave the seller with continuing ownership and support obligations and should be treated as an alternative rather than the default.

**Buyer diligence priorities**

Validate production status and uptime, active users and revenue, database/data ownership, third-party account transferability, security and privacy compliance, backup and recovery procedures, notification deliverability, and the legal status of all contributors and assets before assigning transaction value.
