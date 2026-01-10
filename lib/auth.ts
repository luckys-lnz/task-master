/**
 * ======================================================================
 * NEXTAUTH V5+ STANDARD CONFIGURATION
 * ======================================================================
 * Supports:
 * - Google OAuth
 * - Email/Password Credentials
 * - JWT sessions
 * - Drizzle Adapter
 */

import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "./db";
import { users, accounts, sessions, verificationTokens } from "./db/schema";
import { compare } from "bcryptjs";
import { env } from "./env";
import { normalizeEmail, checkAccountLockedAndGetUser, incrementFailedLoginAttempts, resetFailedLoginAttempts } from "./auth-utils";
import { sanitizeEmail, validateInputSecurity } from "./security";
import { rateLimit, getClientIdentifier } from "./rate-limit";

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
      credentials: { email: { label: "Email", type: "email" }, password: { label: "Password", type: "password" } },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) return null;

        const sanitizedEmail = sanitizeEmail(credentials.email);
        if (!sanitizedEmail) return null;

        const emailCheck = validateInputSecurity(sanitizedEmail);
        if (!emailCheck.isValid) return null;

        const normalizedEmail = normalizeEmail(sanitizedEmail);

        // Rate limiting
        const clientIp = getClientIdentifier(req) || "unknown";
        const ipRate = rateLimit(`signin:ip:${clientIp}`, 10, 15 * 60 * 1000);
        const emailRate = rateLimit(`signin:email:${normalizedEmail}`, 5, 15 * 60 * 1000);
        if (!ipRate.allowed || !emailRate.allowed) {
          throw new Error("Too many login attempts. Try again later.");
        }

        // Fetch user
        const user = await checkAccountLockedAndGetUser(normalizedEmail);
        if (!user?.hashed_password) return null;

        const isValidPassword = await compare(credentials.password, user.hashed_password);
        if (!isValidPassword) {
          await incrementFailedLoginAttempts(normalizedEmail).catch(() => {});
          return null;
        }

        // Reset failed login attempts
        await resetFailedLoginAttempts(normalizedEmail).catch(() => {});

        return { id: user.id, email: user.email, name: user.name, image: user.image };
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
