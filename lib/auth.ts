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
          const { normalizeEmail, checkAccountLocked, incrementFailedLoginAttempts, resetFailedLoginAttempts } = await import("./auth-utils");
          const normalizedEmail = normalizeEmail(credentials.email);

          const [user] = await db
            .select()
            .from(users)
            .where(eq(users.email, normalizedEmail))
            .limit(1);

          if (!user?.hashed_password) {
            return null;
          }

          // Check for account lockout
          const isLocked = await checkAccountLocked(normalizedEmail);
          if (isLocked) {
            // Create error with specific code for NextAuth to handle
            const error = new Error("Account is temporarily locked due to too many failed login attempts. Please try again later.");
            (error as any).code = "ACCOUNT_LOCKED";
            throw error;
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
      return token;
    },
    async session({ token, session }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.image = token.image as string;
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