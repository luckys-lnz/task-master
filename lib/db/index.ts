import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'
import 'dotenv/config'
import { env, validateEnv } from '../env'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'

// Validate environment variables
if (typeof window === 'undefined') {
  try {
    validateEnv();
  } catch (error) {
    // Only throw in production
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }
  }
}

// Singleton pattern for Next.js to prevent multiple DB connections
// This ensures we reuse the same pool across hot reloads and serverless functions
const globalForDb = global as unknown as {
  pool?: Pool;
  db?: NodePgDatabase<typeof schema>;
};

export const pool =
  globalForDb.pool ??
  new Pool({
    connectionString: env.DATABASE_URL,
    // Supabase requires SSL connections
    ssl: env.DATABASE_URL?.includes('supabase.co') 
      ? { rejectUnauthorized: false } 
      : (env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false),
    // Connection pool configuration - reduced to avoid Supabase connection limits
    max: 5, // Maximum number of clients in the pool (reduced from 20)
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
    connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection cannot be established
  });

export const db: NodePgDatabase<typeof schema> = globalForDb.db ?? drizzle(pool, { schema: schema });

// Store in global to prevent multiple instances during hot reloads
if (!globalForDb.pool) globalForDb.pool = pool;
if (!globalForDb.db) globalForDb.db = db;

// Test the connection
pool.on('error', (err: Error) => {
  console.error('Unexpected error on idle client', err);
  
  // Provide helpful error messages for common issues
  if (err.message.includes('password authentication failed') || (err as any).code === '28P01') {
    console.error('\n❌ Database Authentication Failed');
    console.error('The database credentials in DATABASE_URL are incorrect.');
    console.error('Expected format: postgresql://username:password@host:port/database');
    if (env.DATABASE_URL) {
    console.error('Current DATABASE_URL format:', env.DATABASE_URL.replace(/:[^:@]+@/, ':****@'));
    }
  } else if (err.message.includes('does not exist') || (err as any).code === '3D000') {
    console.error('\n❌ Database Not Found');
    console.error('The database specified in DATABASE_URL does not exist.');
  } else if (err.message.includes('connection refused') || (err as any).code === 'ECONNREFUSED') {
    console.error('\n❌ Connection Refused');
    console.error('Cannot connect to the database server. Check if PostgreSQL is running.');
  } else if ((err as any).code === 'ENOTFOUND' && err.message.includes('supabase.co')) {
    console.error('\n❌ Supabase Hostname Not Found');
    console.error('The Supabase hostname in DATABASE_URL is incorrect.');
    if (env.DATABASE_URL) {
      const url = new URL(env.DATABASE_URL.replace('postgresql://', 'http://'));
      if (url.hostname.startsWith('db.')) {
        console.error('\n💡 Fix: Remove "db." prefix from hostname');
        console.error(`   Current: ${url.hostname}`);
        console.error(`   Should be: ${url.hostname.replace('db.', '')}`);
        console.error(`   Correct format: postgresql://postgres:[PASSWORD]@${url.hostname.replace('db.', '')}:5432/postgres`);
      } else {
        console.error(`   Current hostname: ${url.hostname}`);
        console.error('   For Supabase, hostname should be: [PROJECT-REF].supabase.co');
        console.error('   Get the correct connection string from: Supabase Dashboard > Project Settings > Database');
      }
    }
  }
  
  process.exit(-1);
});

// Test connection on startup (optional, can be removed if too verbose)
if (process.env.NODE_ENV === 'development') {
  pool.connect()
    .then((client) => {
      console.log('✅ Database connection successful');
      client.release();
    })
    .catch((err) => {
      console.error('❌ Database connection failed:', err.message);
      if (err.code === '28P01') {
        console.error('\n💡 Fix: Update your DATABASE_URL with correct credentials:');
        console.error('   Format: postgresql://username:password@host:port/database');
      } else if (err.code === 'ENOTFOUND' && err.message.includes('supabase.co')) {
        const dbUrl = env.DATABASE_URL;
        if (dbUrl && dbUrl.includes('db.')) {
          console.error('\n💡 Fix: Remove "db." prefix from Supabase hostname');
          console.error('   Correct format: postgresql://postgres:[PASSWORD]@[PROJECT-REF].supabase.co:5432/postgres');
          console.error('   Get connection string from: Supabase Dashboard > Project Settings > Database');
        }
      }
    });
} 