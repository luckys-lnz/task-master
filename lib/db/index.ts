import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'
import 'dotenv/config'
import { env, validateEnv } from '../env'

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

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  // Connection pool configuration for better performance
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection cannot be established
})

export const db = drizzle(pool, { schema: schema });

// Test the connection
pool.on('error', (err: Error) => {
  console.error('Unexpected error on idle client', err);
  
  // Provide helpful error messages for common issues
  if (err.message.includes('password authentication failed') || (err as any).code === '28P01') {
    console.error('\n❌ Database Authentication Failed');
    console.error('The database credentials in DATABASE_URL are incorrect.');
    console.error('Expected format: postgresql://username:password@host:port/database');
    console.error('Current DATABASE_URL format:', env.DATABASE_URL.replace(/:[^:@]+@/, ':****@'));
  } else if (err.message.includes('does not exist') || (err as any).code === '3D000') {
    console.error('\n❌ Database Not Found');
    console.error('The database specified in DATABASE_URL does not exist.');
  } else if (err.message.includes('connection refused') || (err as any).code === 'ECONNREFUSED') {
    console.error('\n❌ Connection Refused');
    console.error('Cannot connect to the database server. Check if PostgreSQL is running.');
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
      }
    });
} 