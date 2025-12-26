/**
 * Environment variable validation and configuration
 * Ensures all required environment variables are set at startup
 */

const requiredEnvVars = {
  DATABASE_URL: process.env.DATABASE_URL,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
} as const;

const optionalEnvVars = {
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  EMAIL_FROM: process.env.EMAIL_FROM,
  RESEND_FROM: process.env.RESEND_FROM,
} as const;

/**
 * Validates that all required environment variables are set
 * Throws an error if any are missing
 */
export function validateEnv() {
  const missing: string[] = [];

  for (const [key, value] of Object.entries(requiredEnvVars)) {
    if (!value) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}\n` +
      "Please check your .env file and ensure all required variables are set."
    );
  }

  // Validate DATABASE_URL format
  const dbUrl = requiredEnvVars.DATABASE_URL!;
  if (!dbUrl.startsWith('postgresql://') && !dbUrl.startsWith('postgres://')) {
    throw new Error(
      'DATABASE_URL must start with postgresql:// or postgres://\n' +
      'For Supabase, get your connection string from: Project Settings > Database > Connection string'
    );
  }

  // Check for common Supabase hostname mistakes
  if (dbUrl.includes('supabase.co')) {
    try {
      const url = new URL(dbUrl.replace('postgresql://', 'http://').replace('postgres://', 'http://'));
      if (url.hostname.startsWith('db.')) {
        console.warn(
          '⚠️  WARNING: DATABASE_URL hostname starts with "db." which is incorrect.\n' +
          `   Current: ${url.hostname}\n` +
          `   Should be: ${url.hostname.replace('db.', '')}\n` +
          '   Get the correct connection string from: Supabase Dashboard > Project Settings > Database'
        );
      }
    } catch (e) {
      // URL parsing failed, skip this check
    }
  }

  // Validate NEXTAUTH_SECRET length (should be at least 32 characters)
  const secret = requiredEnvVars.NEXTAUTH_SECRET!;
  if (secret.length < 32) {
    console.warn(
      '⚠️  WARNING: NEXTAUTH_SECRET should be at least 32 characters long for security.'
    );
  }
}

/**
 * Get validated environment variables
 * Use this instead of accessing process.env directly
 */
export const env = {
  DATABASE_URL: requiredEnvVars.DATABASE_URL!,
  NEXTAUTH_SECRET: requiredEnvVars.NEXTAUTH_SECRET!,
  NEXTAUTH_URL: requiredEnvVars.NEXTAUTH_URL!,
  GOOGLE_CLIENT_ID: optionalEnvVars.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: optionalEnvVars.GOOGLE_CLIENT_SECRET,
  RESEND_API_KEY: optionalEnvVars.RESEND_API_KEY,
  EMAIL_FROM: optionalEnvVars.EMAIL_FROM,
  RESEND_FROM: optionalEnvVars.RESEND_FROM,
  NODE_ENV: process.env.NODE_ENV || 'development',
} as const;

// Validate on module load (only in server-side code)
if (typeof window === 'undefined') {
  try {
    validateEnv();
  } catch (error) {
    // Only throw in production to prevent silent failures
    if (process.env.NODE_ENV === 'production') {
      throw error;
    } else {
      console.error('Environment validation error:', error);
    }
  }
}
