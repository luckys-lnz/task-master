import { NextAuthOptions } from "next-auth";
import NextAuth from "next-auth/next";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "./db";
import { compare } from "bcryptjs";
import { users } from "./db/schema";
import { eq } from "drizzle-orm";
import { env } from "./env";
import { normalizeEmail } from "./auth-utils";
import { sanitizeEmail, validateInputSecurity } from "./security";
import { rateLimit } from "./rate-limit";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

export const authOptions: NextAuthOptions = {
  adapter: DrizzleAdapter(db),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // Update session every 24 hours
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: env.NODE_ENV === "production",
      },
    },
  },
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
  },
  providers: [
    ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
            authorization: {
              params: {
                prompt: "select_account",
                access_type: "offline",
                response_type: "code"
              }
            }
          })
        ]
      : []),
    // Email verification provider - allows auto-login after email verification
    CredentialsProvider({
      id: "email-verification",
      name: "Email Verification",
      credentials: {
        email: { label: "Email", type: "email" },
        token: { label: "Verification Token", type: "text" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.token) {
          return null;
        }

        try {
          const { normalizeEmail, verifyEmailToken } = await import("./auth-utils");
          const normalizedEmail = normalizeEmail(credentials.email);

          // Verify the email token (this checks if token exists and is valid)
          const isValid = await verifyEmailToken(normalizedEmail, credentials.token);
          if (!isValid) {
            return null;
          }

          // Get the user
          const [user] = await db
            .select()
            .from(users)
            .where(eq(users.email, normalizedEmail))
            .limit(1);

          if (!user) {
            return null;
          }

          // Update email_verified and clear the token (since we're using it to sign in)
          await db
            .update(users)
            .set({
              email_verified: new Date(),
              email_verification_token: null,
              email_verification_expires: null,
            })
            .where(eq(users.email, normalizedEmail));

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image
          };
        } catch (error) {
          console.error("Error in email verification authorize:", error);
          return null;
        }
      }
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Validate and sanitize inputs
          const sanitizedEmail = sanitizeEmail(credentials.email);
          if (!sanitizedEmail) {
            return null;
          }

          const emailSecurity = validateInputSecurity(sanitizedEmail);
          if (!emailSecurity.isValid) {
            return null;
          }

          // Rate limiting per email (5 attempts per 15 minutes)
          const emailRateLimit = rateLimit(`signin:${sanitizedEmail}`, 5, 15 * 60 * 1000);
          if (!emailRateLimit.allowed) {
            const error = new Error("Too many login attempts. Please try again later.");
            (error as any).code = "RATE_LIMIT_EXCEEDED";
            throw error;
          }

          // Validate password length
          if (credentials.password.length > 128 || credentials.password.length < 1) {
            return null;
          }

          const { normalizeEmail, checkAccountLockedAndGetUser, incrementFailedLoginAttempts, resetFailedLoginAttempts } = await import("./auth-utils");
          const normalizedEmail = normalizeEmail(sanitizedEmail);

          // Single query to check lock and get user data (optimized)
          const user = await checkAccountLockedAndGetUser(normalizedEmail);
          
          // If user is null, account is either locked or doesn't exist
          if (!user) {
            return null;
          }

          if (!user.hashed_password) {
            return null;
          }

          const isCorrectPassword = await compare(
            credentials.password,
            user.hashed_password
          );

          if (!isCorrectPassword) {
            // Increment failed attempts only on failed password
            await incrementFailedLoginAttempts(normalizedEmail);
            return null;
          }

          // Check if email is verified (optional - you can make this required)
          // For now, we'll allow unverified users but could add a check here
          // if (!user.email_verified) {
          //   throw new Error("Please verify your email address before signing in. Check your inbox for the verification link.");
          // }

          // Reset failed login attempts on successful login
          await resetFailedLoginAttempts(normalizedEmail);

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image
          };
        } catch (error) {
          console.error("Error during authentication:", error);
          // Re-throw specific errors so NextAuth can handle them
          if (error instanceof Error && (error as any).code === "ACCOUNT_LOCKED") {
            throw error;
          }
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.image = user.image;
      }
      
      // Validate user still exists in database (check every time JWT is refreshed)
      if (token.id) {
        try {
          const [existingUser] = await db
            .select({ id: users.id })
            .from(users)
            .where(eq(users.id, token.id as string))
            .limit(1);
          
          // If user doesn't exist, mark token as invalid by removing id
          if (!existingUser) {
            // Remove user data from token to invalidate it
            delete token.id;
            delete token.email;
            delete token.name;
            delete token.image;
            token.error = "USER_DELETED";
            return token;
          }
        } catch (error) {
          console.error("Error validating user in JWT callback:", error);
          // Remove user data from token on error
          delete token.id;
          delete token.email;
          delete token.name;
          delete token.image;
          token.error = "VALIDATION_ERROR";
          return token;
        }
      }
      
      return token;
    },
    async session({ token, session }) {
      // If token has error flag (user was deleted), return null to invalidate session
      if (!token || !token.id || (token as any).error) {
        return null as any;
      }
      
      // Double-check user exists in database
      try {
        const [existingUser] = await db
          .select({ id: users.id, email: users.email, name: users.name, image: users.image })
          .from(users)
          .where(eq(users.id, token.id as string))
          .limit(1);
        
        // If user doesn't exist, return null to invalidate session
        if (!existingUser) {
          return null as any;
        }
        
        // Update session with current user data from database
        session.user.id = existingUser.id;
        session.user.email = existingUser.email || null;
        session.user.name = existingUser.name || null;
        session.user.image = existingUser.image || null;
      } catch (error) {
        console.error("Error validating user in session callback:", error);
        return null as any; // Invalidate session on error
      }
      
      return session;
    },
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        try {
          if (!user.email) {
            return false;
          }

          const normalizedEmail = normalizeEmail(user.email);
          const [existingUser] = await db
            .select()
            .from(users)
            .where(eq(users.email, normalizedEmail))
            .limit(1);
          
          if (!existingUser) {
            // Create new user if doesn't exist
            await db.insert(users).values({
              email: normalizedEmail,
              name: user.name || null,
              image: user.image || null,
              email_verified: new Date() // Google emails are pre-verified
            });
          }
          return true;
        } catch (error) {
          console.error("Error in signIn callback:", error);
          return false;
        }
      }
      return true;
    }
  },
  debug: env.NODE_ENV === 'development',
  secret: env.NEXTAUTH_SECRET
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
export const { auth } = NextAuth(authOptions);