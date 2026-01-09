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
 * Check if a Vercel URL is a preview URL (not production)
 * Preview URLs typically contain branch names, commit hashes, or have patterns like:
 * - project-name-{hash}-{user}.vercel.app
 * - project-name-git-{branch}-{user}.vercel.app
 */
function isVercelPreviewUrl(url: string): boolean {
  if (!url.includes('vercel.app')) return false;
  
  // Production URLs are typically: project-name.vercel.app or custom domain
  // Preview URLs contain: project-name-{hash}-{user}.vercel.app or project-name-git-{branch}-{user}.vercel.app
  const previewPatterns = [
    /-[a-z0-9]{7,}-[a-z0-9-]+\.vercel\.app/i, // Hash pattern: project-abc123-user.vercel.app
    /-git-[a-z0-9-]+-[a-z0-9-]+\.vercel\.app/i, // Branch pattern: project-git-branch-user.vercel.app
  ];
  
  return previewPatterns.some(pattern => pattern.test(url));
}

/**
 * Get the base URL for the application dynamically at runtime
 * Production-ready implementation that rejects preview URLs
 * 
 * Priority in Production:
 * 1. NEXTAUTH_URL (if set and valid) - MUST be production domain
 * 2. VERCEL_URL (only if VERCEL_ENV === 'production' and not a preview URL)
 * 3. Throw error if no valid production URL found
 * 
 * Priority in Development:
 * 1. NEXTAUTH_URL (if explicitly set)
 * 2. localhost:3000 (default)
 */
export function getBaseUrl(): string {
  const isProd = isProduction();
  const isDev = isDevelopment();

  // In production, NEVER use preview URLs
  if (isProd) {
    // Priority 1: NEXTAUTH_URL (should be set to production domain)
    if (process.env.NEXTAUTH_URL) {
      const url = process.env.NEXTAUTH_URL.trim();
      
      // Reject localhost in production
      if (url.includes('localhost') || url.includes('127.0.0.1')) {
        console.error(
          '❌ ERROR: NEXTAUTH_URL is set to localhost in production. ' +
          'This is invalid. Please set NEXTAUTH_URL to your production domain in Vercel environment variables.'
        );
        // Don't fall through - throw error instead
      } 
      // Reject preview URLs
      else if (isVercelPreviewUrl(url)) {
        console.error(
          '❌ ERROR: NEXTAUTH_URL is set to a Vercel preview URL. ' +
          'Preview URLs cannot be used for email verification links. ' +
          'Please set NEXTAUTH_URL to your production domain (e.g., https://your-app.vercel.app or your custom domain).'
        );
        // Don't fall through - throw error instead
      }
      // Valid production URL
      else {
        return url;
      }
    }

    // Priority 2: VERCEL_URL (only if it's a production deployment, not preview)
    if (process.env.VERCEL_URL) {
      const vercelUrl = process.env.VERCEL_URL.trim();
      const fullUrl = vercelUrl.startsWith('http') ? vercelUrl : `https://${vercelUrl}`;
      
      // Check if this is actually a production deployment (not preview)
      const isProductionDeployment = process.env.VERCEL_ENV === 'production';
      
      // Reject preview URLs even if VERCEL_ENV is production (safety check)
      if (isVercelPreviewUrl(fullUrl)) {
        console.error(
          '❌ ERROR: VERCEL_URL is a preview URL. ' +
          'Email verification links cannot use preview URLs as they require Vercel authentication. ' +
          'Please set NEXTAUTH_URL to your production domain in Vercel environment variables.'
        );
        throw new Error(
          'Cannot use preview URL for email verification. ' +
          'Set NEXTAUTH_URL environment variable to your production domain (e.g., https://your-app.vercel.app).'
        );
      }
      
      // Only use VERCEL_URL if it's a production deployment
      if (isProductionDeployment) {
        return fullUrl;
      } else {
        console.error(
          '❌ ERROR: VERCEL_ENV is not "production". ' +
          'Email verification links must use production URLs. ' +
          'Please set NEXTAUTH_URL to your production domain in Vercel environment variables.'
        );
      }
    }

    // During build time, VERCEL_URL might not be available yet
    const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build' || 
                         process.env.NEXT_PHASE === 'phase-development-build';
    
    if (isBuildPhase) {
      // During build, use NEXTAUTH_URL if available, otherwise fallback
      // This is acceptable during build as it will be resolved at runtime
      if (process.env.NEXTAUTH_URL && !isVercelPreviewUrl(process.env.NEXTAUTH_URL)) {
        return process.env.NEXTAUTH_URL;
      }
      return process.env.NEXTAUTH_URL || 'http://localhost:3000';
    }

    // Production runtime - no valid URL found
    throw new Error(
      '❌ CRITICAL: Unable to determine production URL for email verification links.\n\n' +
      'SOLUTION: Set NEXTAUTH_URL in your Vercel environment variables:\n' +
      '1. Go to Vercel Dashboard > Your Project > Settings > Environment Variables\n' +
      '2. Add NEXTAUTH_URL with value: https://your-app.vercel.app (or your custom domain)\n' +
      '3. Make sure it\'s set for "Production" environment\n' +
      '4. Redeploy your application\n\n' +
      'NOTE: Preview URLs (like task-master-xxx-user.vercel.app) cannot be used for email verification ' +
      'as they require Vercel authentication. Only production domains work.'
    );
  }

  // In development, prefer localhost
  if (isDev) {
    if (process.env.NEXTAUTH_URL && !process.env.NEXTAUTH_URL.includes('localhost')) {
      return process.env.NEXTAUTH_URL;
    }
    return 'http://localhost:3000';
  }

  // Fallback
  return process.env.NEXTAUTH_URL || 'http://localhost:3000';
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
