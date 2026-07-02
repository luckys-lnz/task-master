<div align="center">

<img src="public/logo.png" alt="Task Master" width="72" />

# Task Master

A task manager that treats procrastination as a design problem, not a discipline problem.

Built with Next.js, PostgreSQL, and Supabase Realtime.

</div>

---

## Why this exists

Most to-do apps assume the hard part is *recording* tasks. In practice the hard part is *doing* them — a task sits untouched for days, gets pushed back, and eventually just becomes a source of guilt. Task Master's design starts from that observation instead of from a CRUD checklist:

- **Deferring is data, not failure.** Every task tracks a `defer_count`. Push the same task back enough times and the **Procrastination Shield** interrupts with a real question — *too big? unclear? wrong time? not actually important?* — and routes you to the fix (break it into subtasks, clarify the definition of done, reschedule, deprioritize, or just delete it) instead of another nag.
- **Overdue is a state, not a color.** Tasks move through an explicit `PENDING → COMPLETED / OVERDUE` lifecycle server-side (not just a red label computed at render time), so overdue detection is consistent across devices, notifications, and collaborators. Overdue tasks lock by default to stop silent backdating.
- **Focus is a first-class mode.** A built-in Pomodoro timer (`/dashboard/focus`) is a separate mental mode from the planning/list view, not a widget bolted onto the sidebar.
- **State changes reach you where you are.** Task updates sync live via Supabase Realtime, and reminders arrive as web push and email — not just a badge you have to remember to check.
- **Collaboration doesn't require both people to be logged in already.** Tasks can be shared read-only via a link, or another person can be invited by email to a specific task with no pre-existing account.

## Features

**Task management**
- Priorities (`LOW`/`MEDIUM`/`HIGH`/`URGENT`), tags, categories, notes, and file attachments
- Subtasks with per-item assignment and completion tracking
- Drag-and-drop reordering and recurring tasks (daily/weekly/custom interval)
- Archiving instead of deletion for completed clutter

**Behavioral tools**
- Procrastination Shield triggered by repeated deferrals
- Pomodoro-based Focus mode
- Task-level and account-level analytics on `/dashboard/stats`

**Collaboration & sharing**
- Per-task collaborator invites (email-based, works for non-users) with roles
- Public read-only share links (`share_token`) for any task
- Live sync across sessions/devices via Supabase Realtime — no polling

**Notifications**
- Web push (VAPID) for due/overdue/start-time alerts, with snooze and mute per task
- Transactional email via Resend (verification, password reset, invites)
- Scheduled overdue sweep via a cron-triggered API route

**Auth & security**
- NextAuth: email/password and Google OAuth
- Email verification, password reset, account lockout after repeated failed logins
- Rate limiting on sensitive routes (Upstash Redis)

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router), React 18, TypeScript |
| Styling | Tailwind CSS, Radix UI primitives, Framer Motion |
| Database | PostgreSQL (Supabase), Drizzle ORM |
| Realtime | Supabase Realtime (Postgres change subscriptions) |
| Auth | NextAuth (credentials + Google OAuth), Drizzle adapter |
| Email | Resend |
| Push notifications | Web Push API (VAPID), service worker |
| Rate limiting | Upstash Redis |
| Forms/validation | React Hook Form, Zod |

## Project structure

```
app/                  Next.js App Router pages and API routes
  api/                REST endpoints (tasks, auth, notifications, sharing, invites, cron)
  dashboard/          Main app: tasks, focus mode, stats
  auth/               Sign in/up, password reset, email verification
  share/[token]/      Public read-only task view
  invite/[token]/     Collaborator invite acceptance
components/           UI components, grouped by feature (tasks, focus, collaboration, notifications, stats, procrastination, ui)
hooks/                Client hooks (task queries, pomodoro timer, media queries)
lib/
  db/                 Drizzle schema, migration runner, connection
  services/           Email, push notifications, service worker registration
  auth.ts             NextAuth configuration
  task-prevention.ts  Overdue/warning logic shared by UI and notifications
drizzle/              SQL migrations (source of truth for schema changes)
docs/                 Deep-dive docs — see docs/README.md
```

## Getting started

### Prerequisites
- Node.js 18+
- A PostgreSQL database (this project is built against [Supabase](https://supabase.com), but any Postgres works for local dev)

### 1. Clone and install

```bash
git clone https://github.com/LivinginPixel/task-master.git
cd task-master
npm install
```

### 2. Configure environment variables

Create a `.env` file in the project root:

```env
# --- Required ---
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=          # openssl rand -base64 32

# --- Google OAuth (optional) ---
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# --- Email via Resend (optional — needed for verification/reset/invite emails) ---
RESEND_API_KEY=
EMAIL_FROM=
RESEND_FROM=

# --- Web push notifications (optional) ---
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=            # e.g. mailto:you@example.com

# --- Supabase client + storage (optional — needed for avatar upload, Realtime) ---
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# --- Rate limiting via Upstash Redis (optional) ---
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
RATE_LIMIT_SALT=

# --- Cron auth for the overdue sweep endpoint (optional) ---
CRON_SECRET=
```

See [docs/RESEND_SETUP.md](docs/RESEND_SETUP.md), [docs/SERVICE_WORKER_SETUP.md](docs/SERVICE_WORKER_SETUP.md), and [docs/SUPABASE_STORAGE_SETUP.md](docs/SUPABASE_STORAGE_SETUP.md) for how to obtain each of the optional keys.

### 3. Set up the database

```bash
npm run db:generate   # generate migrations from lib/db/schema.ts, if you've changed it
npm run db:migrate     # apply migrations in drizzle/ to DATABASE_URL
```

### 4. Run it

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Available scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Production build |
| `npm run start` | Run migrations, then start the production server (used on deploy) |
| `npm run lint` | Run ESLint |
| `npm run db:generate` | Generate a new Drizzle migration from schema changes |
| `npm run db:migrate` | Apply pending migrations |
| `npm run db:studio` | Open Drizzle Studio to browse the database |

## Documentation

Deeper, subsystem-specific docs live in [`docs/`](docs/README.md): database schema and indexes, the auth rewrite, email setup, push notification/service worker setup, the notification dedup design, Supabase storage config, and a troubleshooting guide.

## Contributing

Contributions are welcome. Please feel free to open a Pull Request. For anything non-trivial, open an [Idea discussion](https://github.com/LivinginPixel/task-master/discussions/categories/ideas) first so the direction can be agreed on before you invest the time.

## Community

Have a question, an idea, or want to show off what you built? Head over to [GitHub Discussions](https://github.com/LivinginPixel/task-master/discussions):

- **Ideas** — propose new features or improvements
- **Q&A** — ask for help using or setting up the app
- **Show and tell** — share what you have built or customized
- **General** — anything else

## License

MIT — see [LICENSE](LICENSE).
