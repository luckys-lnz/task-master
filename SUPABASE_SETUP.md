# Supabase Setup Guide

This project is now configured to use Supabase as the database.

## Getting Your Supabase Connection String

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project (or create a new one)
3. Navigate to **Project Settings** > **Database**
4. Scroll down to **Connection string**
5. Select **URI** tab
6. Copy the connection string (it will look like):
   ```
   postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
   ```
   Or for direct connection:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@[PROJECT-REF].supabase.co:5432/postgres
   ```

## Setting Up Environment Variables

Add the connection string to your `.env` file:

```env
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@[PROJECT-REF].supabase.co:5432/postgres
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-here
```

## Database Schema

The database schema has already been applied to your Supabase project. The following tables have been created:

- `users` - User accounts with authentication fields
- `tasks` - Task items
- `subtasks` - Subtasks for tasks
- `accounts` - OAuth account connections (NextAuth)
- `sessions` - User sessions (NextAuth)
- `verification_tokens` - Email verification tokens (NextAuth)

## Security Features

The following security features are included in the schema:

- Password reset tokens (`reset_password_token`, `reset_password_expires`)
- Account locking (`failed_login_attempts`, `locked_until`)
- Email verification (`email_verified`)

## Testing the Connection

Once you've set your `DATABASE_URL`, start the development server:

```bash
npm run dev
```

You should see:
```
✅ Database connection successful
```

If you see connection errors, verify:
1. Your connection string is correct
2. Your Supabase project is active
3. Your database password is correct

## Security: Row Level Security (RLS)

✅ **RLS is enabled** on all tables with appropriate policies for NextAuth.

Since this app uses NextAuth for authentication (not Supabase Auth), the RLS policies allow the service role to manage all tables. Authorization is handled at the application level through:

1. **NextAuth session validation** - Ensures users are authenticated
2. **API route authorization** - Checks that users can only access their own data
3. **Database-level checks** - Application code verifies `user_id` matches the session user

This provides defense in depth:
- **Application layer**: NextAuth + API route checks
- **Database layer**: RLS enabled (service role access for NextAuth)

**Current RLS Setup:**
- All tables have RLS enabled
- Service role has full access (required for NextAuth)
- Application code enforces user-specific data access

**For enhanced security** (optional):
- Use a restricted database user instead of service role for application connections
- Implement function-based RLS policies that verify user ownership
- Consider migrating to Supabase Auth for native RLS support with `auth.uid()`

## Additional Supabase Features

You can also use Supabase's built-in features:

- **Row Level Security (RLS)**: Enable RLS policies in Supabase dashboard
- **Realtime**: Subscribe to database changes
- **Storage**: Use Supabase Storage for file uploads
- **Edge Functions**: Deploy serverless functions

## Migration Management

Migrations are managed through Supabase's migration system. To apply new migrations:

1. Create migration files in the `drizzle/` folder
2. Use the Supabase MCP tools or Supabase CLI to apply migrations
3. Or use `npm run db:migrate` if using Drizzle migrations
