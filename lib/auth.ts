/**
 * ============================================================================
 * NEXT-AUTH V5+ PRODUCTION CONFIGURATION
 * ============================================================================
 * 
 * SETUP INSTRUCTIONS:
 * 
 * 1. ENVIRONMENT VARIABLES (.env.local):
 *    NEXTAUTH_URL=http://localhost:3000
 *    NEXTAUTH_SECRET=<generate-with: openssl rand -base64 32>
 *    GOOGLE_CLIENT_ID=<your-google-client-id>
 *    GOOGLE_CLIENT_SECRET=<your-google-client-secret>
 *    DATABASE_URL=<your-database-connection-string>
 * 
 * 2. GOOGLE CLOUD CONSOLE SETUP:
 *    - Go to: https://console.cloud.google.com/apis/credentials
 *    - Create OAuth 2.0 Client ID
 *    - Authorized JavaScript origins:
 *      http://localhost:3000
 *    - Authorized redirect URIs:
 *      http://localhost:3000/api/auth/callback/google
 * 
 * 3. VERIFY DATABASE SCHEMA:
 *    Ensure these tables exist with correct structure:
 *    - users (with email, emailVerified, name, image, hashed_password)
 *    - accounts (with userId, provider, providerAccountId, etc.)
 *    - sessions (with userId, sessionToken, expires) - optional for JWT
 *    - verification_tokens (with identifier, token, expires)
 * 
 * 4. TEST GOOGLE SIGN-IN:
 *    - Visit: http://localhost:3000/auth/signin
 *    - Click "Sign in with Google"
 *    - Should redirect to: http://localhost:3000/api/auth/callback/google
 *    - Then redirect to dashboard on success
 * 
 * ============================================================================
 */

import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "./db";
import { users, accounts, sessions, verificationTokens } from "./db/schema";
import { compare } from "bcryptjs";
import { env } from "./env";
import { 
  normalizeEmail, 
  checkAccountLockedAndGetUser,
  incrementFailedLoginAttempts,
  resetFailedLoginAttempts
} from "./auth-utils";
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
const adapterSchema = {
  usersTable: users,
  accountsTable: accounts,
  sessionsTable: sessions,
  verificationTokensTable: verificationTokens,
} as any;

export const authOptions: NextAuthOptions = {
  adapter: DrizzleAdapter(db, adapterSchema),
  
  // Use JWT sessions for middleware compatibility
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // Update session every 24 hours
  },

  pages: {
    signIn: "/auth/signin",
    signOut: "/auth/signout",
    error: "/auth/error",
  },

  providers: [
    // Google OAuth Provider
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

    // Credentials provider (email/password)
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const sanitizedEmail = sanitizeEmail(credentials.email);
          if (!sanitizedEmail) {
            return null;
          }

          const emailSecurity = validateInputSecurity(sanitizedEmail);
          if (!emailSecurity.isValid) {
            return null;
          }

          // IP-based rate limiting (prevents DoS attacks)
          const clientIp = getClientIdentifier(req as unknown as Request);
          const ipRateLimit = rateLimit(`signin:ip:${clientIp}`, 10, 15 * 60 * 1000);
          if (!ipRateLimit.allowed) {
            const error = new Error("Too many login attempts from this IP. Please try again later.");
            Object.assign(error, { code: "RATE_LIMIT_EXCEEDED" });
            throw error;
          }

          // Additional email-based rate limiting
          const emailRateLimit = rateLimit(`signin:email:${sanitizedEmail}`, 5, 15 * 60 * 1000);
          if (!emailRateLimit.allowed) {
            const error = new Error("Too many login attempts for this email. Please try again later.");
            Object.assign(error, { code: "RATE_LIMIT_EXCEEDED" });
            throw error;
          }

          // Validate password length
          if (credentials.password.length > 128 || credentials.password.length < 1) {
            return null;
          }

          const normalizedEmail = normalizeEmail(sanitizedEmail);
          const user = await checkAccountLockedAndGetUser(normalizedEmail);

          if (!user || !user.hashed_password) {
            await incrementFailedLoginAttempts(normalizedEmail);
            return null;
          }

          const isCorrectPassword = await compare(credentials.password, user.hashed_password);

          if (!isCorrectPassword) {
            await incrementFailedLoginAttempts(normalizedEmail);
            return null;
          }

          await resetFailedLoginAttempts(normalizedEmail);

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
          };
        } catch (error) {
          console.error("Error during authentication:", error);
          if (error instanceof Error && "code" in error && error.code === "ACCOUNT_LOCKED") {
            throw error;
          }
          return null;
        }
      },
    }),
  ],

  callbacks: {
    // JWT callback - store user ID in token
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },

    // Session callback - add user ID to session
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },

    // Redirect callback - simplified (NextAuth handles URL validation)
    async redirect({ url, baseUrl }) {
      // If url is relative, make it absolute
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }
      
      // If url is on the same origin, allow it
      if (url.startsWith(baseUrl)) {
        return url;
      }

      // Default to dashboard
      return `${baseUrl}/dashboard`;
    },
  },

  debug: env.NODE_ENV === "development",
  secret: env.NEXTAUTH_SECRET,
};
