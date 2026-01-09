/**
 * Environment variable validation and configuration
 * Ensures all required environment variables are set at startup
 */

/**
 * Check if we're running in production (Vercel)
 */
function isProduction(): boolean {
  return process.env.NODE_ENV === 'production' || !!process.env.VERCEL;
}

/**
 * Check if we're running in development (local)
 */
function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development' && !process.env.VERCEL;
}

/**
 * Get the base URL for the application dynamically at runtime
 * Intelligently detects production vs development:
 * - Production (Vercel): Uses VERCEL_URL or NEXTAUTH_URL (never localhost)
 * - Development (local): Uses localhost:3000
 * 
 * Priority in Production:
 * 1. NEXTAUTH_URL (if set and NOT localhost)
 * 2. VERCEL_URL (auto-provided by Vercel)
 * 
 * Priority in Development:
 * 1. NEXTAUTH_URL (if explicitly set)
 * 2. localhost:3000 (default)
 */
export function getBaseUrl(): string {
  const isProd = isProduction();
  const isDev = isDevelopment();

  // In production, NEVER use localhost
  if (isProd) {
    // Check if NEXTAUTH_URL is set and valid (not localhost)
    if (process.env.NEXTAUTH_URL) {
      const url = process.env.NEXTAUTH_URL;
      // Reject localhost in production
      if (url.includes('localhost') || url.includes('127.0.0.1')) {
        console.warn(
          '⚠️  WARNING: NEXTAUTH_URL is set to localhost in production. ' +
          'Ignoring it and using VERCEL_URL instead. ' +
          'Please remove NEXTAUTH_URL from Vercel environment variables or set it to your production domain.'
        );
        // Fall through to use VERCEL_URL
      } else {
        // Valid production URL
        if (process.env.NODE_ENV === 'development') {
          console.log(`✅ Using NEXTAUTH_URL for production: ${url}`);
        }
        return url;
      }
    }

    // On Vercel, use VERCEL_URL (automatically provided by Vercel at runtime)
    // VERCEL_URL is the deployment URL (e.g., "your-app.vercel.app")
    if (process.env.VERCEL_URL) {
      const vercelUrl = process.env.VERCEL_URL;
      const productionUrl = `https://${vercelUrl}`;
      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ Using VERCEL_URL for production: ${productionUrl}`);
      }
      // Always use https:// for Vercel URLs
      return productionUrl;
    }

    // During build time, VERCEL_URL might not be available yet
    // Allow fallback to NEXTAUTH_URL or a placeholder that will be resolved at runtime
    if (process.env.NEXTAUTH_URL) {
      // Even if it's localhost, use it during build (will be overridden at runtime)
      return process.env.NEXTAUTH_URL;
    }

    // During build time, VERCEL_URL might not be available
    // Check if we're in build phase
    const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build' || 
                         process.env.NEXT_PHASE === 'phase-development-build';
    
    if (isBuildPhase) {
      // During build, allow NEXTAUTH_URL even if it's localhost (will be overridden at runtime)
      // Or use a placeholder
      return process.env.NEXTAUTH_URL || 'http://localhost:3000';
    }

    // Production runtime fallback - only throw at runtime, not during build
    throw new Error(
      'Unable to determine production URL. ' +
      'On Vercel, VERCEL_URL is automatically provided. ' +
      'Alternatively, set NEXTAUTH_URL in your Vercel environment variables to your production domain (e.g., https://your-app.vercel.app).'
    );
  }

  // In development, prefer localhost
  if (isDev) {
    // If NEXTAUTH_URL is explicitly set in development, use it
    if (process.env.NEXTAUTH_URL && !process.env.NEXTAUTH_URL.includes('localhost')) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ Using custom NEXTAUTH_URL for development: ${process.env.NEXTAUTH_URL}`);
      }
      return process.env.NEXTAUTH_URL;
    }
    // Default to localhost for local development
    const localhostUrl = 'http://localhost:3000';
    return localhostUrl;
  }

  // Fallback (should not reach here)
  const fallbackUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  return fallbackUrl;
}

// For backward compatibility and initial validation, compute baseUrl at module load
// But email functions should use getBaseUrl() at runtime
const baseUrl = getBaseUrl();

const requiredEnvVars = {
  DATABASE_URL: process.env.DATABASE_URL,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  NEXTAUTH_URL: baseUrl,
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
    } catch {
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
