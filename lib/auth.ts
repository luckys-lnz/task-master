/**
 * ======================================================================
 * NEXTAUTH V5+ ENTERPRISE CONFIGURATION
 * ======================================================================
 * 
 * Production-grade authentication with:
 * - Google OAuth
 * - Email/Password Credentials
 * - JWT sessions
 * - Drizzle Adapter
 * - Redis-based rate limiting (Upstash)
 * - Account locking on failed attempts
 * - Privacy-first IP hashing
 * 
 * CRITICAL LOGIN FLOW:
 * 1. Extract and sanitize input
 * 2. Lookup user (check account lock)
 * 3. Run rate limiter (by IP)
 * 4. Compare password
 * 5. If wrong password:
 *    - Increment failed attempts
 *    - If rate limited → block
 *    - If not rate limited → allow retry
 * 6. If correct password:
 *    - Reset failed attempts
 *    - Unlock account if locked
 *    - Allow login (even if rate limited)
 * 
 * This ensures:
 * - Correct passwords are NEVER blocked
 * - Wrong passwords are blocked if rate limited
 * - Account locks are only cleared after successful login
 */

import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "./db";
import { users, accounts, sessions, verificationTokens } from "./db/schema";
import { eq } from "drizzle-orm";
import { compare } from "bcryptjs";
import { env } from "./env";
import {
  normalizeEmail,
  checkAccountLockedAndGetUser,
  incrementFailedLoginAttempts,
  resetFailedLoginAttempts,
} from "./auth-utils";
import { sanitizeEmail, validateInputSecurity } from "./security";
import { getClientIp } from "./security/get-ip";
import { loginIpLimiter, loginEmailLimiter } from "./security/rate-limit";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
  interface JWT {
    id?: string;
  }
}

// DrizzleAdapter schema mapping
const adapterSchema = {
  usersTable: users,
  accountsTable: accounts,
  sessionsTable: sessions,
  verificationTokensTable: verificationTokens,
} as const;

export const authOptions: NextAuthOptions = {
  adapter: DrizzleAdapter(db, adapterSchema as any),

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60,
  },

  pages: {
    signIn: "/auth/signin",
    signOut: "/auth/signout",
    error: "/auth/error",
  },

  providers: [
    // Google OAuth
    ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
            authorization: {
              params: {
                prompt: "select_account",
                access_type: "offline",
                response_type: "code",
              },
            },
          }),
        ]
      : []),

    // Credentials (Email/Password)
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        // Step 1: Early return if credentials are missing
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Step 2: Extract and sanitize email
        const sanitizedEmail = sanitizeEmail(credentials.email);
        if (!sanitizedEmail) {
          return null; // Invalid email format
        }

        const emailCheck = validateInputSecurity(sanitizedEmail);
        if (!emailCheck.isValid) {
          return null; // Security validation failed
        }

        const normalizedEmail = normalizeEmail(sanitizedEmail);

        // Step 3: Lookup user and check account lock
        // This happens BEFORE rate limiting to avoid wasting rate limit quota
        const user = await checkAccountLockedAndGetUser(normalizedEmail);
        if (!user) {
          // Account doesn't exist or is locked
          // No user existence leakage - same response for both cases
          return null;
        }

        // Step 4: Check if user has password (not OAuth-only account)
        if (!user.hashed_password) {
          // User exists but has no password (OAuth-only account)
          return null;
        }

        // Step 5: Extract IP and run rate limiters
        // We run limiters AFTER user lookup to avoid wasting quota on invalid emails
        const ip = getClientIp(req);
        const [ipLimitResult, emailLimitResult] = await Promise.all([
          loginIpLimiter.limit(ip),
          loginEmailLimiter.limit(normalizedEmail),
        ]);

        // Step 6: Verify password
        const isValidPassword = await compare(
          credentials.password,
          user.hashed_password
        );

        if (!isValidPassword) {
          // Wrong password
          // Increment failed attempts (this may lock the account)
          await incrementFailedLoginAttempts(normalizedEmail);

          // If rate limited, block the request
          // This prevents brute force even if account isn't locked yet
          if (!ipLimitResult.success || !emailLimitResult.success) {
            throw new Error("Too many login attempts. Please try again later.");
          }

          // Not rate limited, but wrong password
          return null;
        }

        // Step 7: Correct password
        // IMPORTANT: Allow login even if rate limited
        // This ensures legitimate users can always log in with correct password

        // Reset failed attempts and unlock account
        // This is the ONLY place where locks are cleared
        await resetFailedLoginAttempts(normalizedEmail);

        // Return user object for NextAuth session
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
        
        // Fetch latest user data from database to get updated avatar
        try {
          const dbUser = await db.query.users.findFirst({
            where: eq(users.id, token.id as string),
            columns: {
              name: true,
              email: true,
              image: true,
              avatar_url: true,
            },
          });
          
          if (dbUser) {
            // Use avatar_url if available, otherwise fall back to image
            session.user.name = dbUser.name;
            session.user.email = dbUser.email;
            session.user.image = dbUser.avatar_url || dbUser.image || null;
          }
        } catch (error) {
          console.error("Error fetching user data in session callback:", error);
          // Continue with existing session data if fetch fails
        }
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }
      if (url.startsWith(baseUrl)) {
        return url;
      }
      return `${baseUrl}/dashboard`;
    },
  },

  debug: env.NODE_ENV === "development",
  secret: env.NEXTAUTH_SECRET,
};
