/**
 * ======================================================================
 * NEXTAUTH V5+ STANDARD CONFIGURATION
 * ======================================================================
 * 
 * Supports:
 * - Google OAuth
 * - Email/Password Credentials
 * - JWT sessions
 * - Drizzle Adapter
 * - Redis-based rate limiting (Upstash)
 * - Account locking on failed attempts
 * 
 * Architecture:
 * - Rate limiting is handled BEFORE authentication logic
 * - Account locking is checked AFTER rate limiting
 * - Failed attempts are tracked per email (not IP)
 * - Rate limiting is per IP (prevents distributed attacks)
 * 
 * Why this prevents 401 errors for valid users:
 * 1. Rate limiting happens first (by IP) - blocks brute force
 * 2. Account locking is separate (by email) - protects specific accounts
 * 3. Valid credentials always succeed (if not rate limited or locked)
 * 4. Redis ensures consistent state across serverless functions
 */

import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "./db";
import { users, accounts, sessions, verificationTokens } from "./db/schema";
import { compare } from "bcryptjs";
import { env } from "./env";
import { normalizeEmail } from "./auth-utils";
import { sanitizeEmail, validateInputSecurity } from "./security";
import { getClientIp } from "./security/get-ip";
import { loginLimiter } from "./security/rate-limit";
import {
  checkAccountLocked,
  incrementFailedAttempts,
  resetFailedAttempts,
} from "./security/login-guards";

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
// Using type assertion because we're using JWT sessions, so exact table structure is less critical
const adapterSchema = {
  usersTable: users,
  accountsTable: accounts,
  sessionsTable: sessions,
  verificationTokensTable: verificationTokens,
} as any;

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
            authorization: { params: { prompt: "select_account", access_type: "offline", response_type: "code" } },
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
        // Early return if credentials are missing
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Step 1: Extract real client IP (handles Vercel/proxy headers correctly)
        // This is critical - without correct IP extraction, all users appear as same IP
        // and rate limiting blocks everyone
        const ip = getClientIp(req);

        // Step 2: Rate limit by IP address (prevents brute force attacks)
        // This happens BEFORE authentication to block attackers early
        // Uses Redis sliding window: 5 attempts per 10 minutes
        const { success } = await loginLimiter.limit(ip);
        if (!success) {
          // Throw error to return 401 - rate limit exceeded
          throw new Error("Too many login attempts. Please try again later.");
        }

        // Step 3: Sanitize and validate email input
        const sanitizedEmail = sanitizeEmail(credentials.email);
        if (!sanitizedEmail) {
          return null; // Invalid email format
        }

        const emailCheck = validateInputSecurity(sanitizedEmail);
        if (!emailCheck.isValid) {
          return null; // Security validation failed
        }

        const normalizedEmail = normalizeEmail(sanitizedEmail);

        // Step 4: Check if account is locked (by email, not IP)
        // This protects specific accounts from targeted attacks
        const user = await checkAccountLocked(normalizedEmail);
        if (!user) {
          // Account doesn't exist or is locked
          return null;
        }

        // Step 5: Verify password
        if (!user.hashed_password) {
          // User exists but has no password (OAuth-only account)
          return null;
        }

        const isValidPassword = await compare(
          credentials.password,
          user.hashed_password
        );

        if (!isValidPassword) {
          // Invalid password - increment failed attempts
          // This happens AFTER rate limiting, so we only track real attempts
          await incrementFailedAttempts(normalizedEmail);
          return null;
        }

        // Step 6: Successful login - reset failed attempts
        // This clears any previous failed attempts and unlocks account
        await resetFailedAttempts(normalizedEmail);

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
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) session.user.id = token.id as string;
      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (url.startsWith(baseUrl)) return url;
      return `${baseUrl}/dashboard`;
    },
  },

  debug: env.NODE_ENV === "development",
  secret: env.NEXTAUTH_SECRET,
};
