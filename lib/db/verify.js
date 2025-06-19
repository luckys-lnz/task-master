const { drizzle } = require('drizzle-orm/node-postgres');
const { Pool } = require('pg');
require('dotenv/config');

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

const db = drizzle(pool);

async function verifySchema() {
  console.log('Verifying database schema...\n');
  
  try {
    // Check users table
    const usersQuery = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position;
    `);
    
    console.log('Users Table Structure:');
    console.table(usersQuery.rows);
    console.log('\n');

    // Check accounts table
    const accountsQuery = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'accounts'
      ORDER BY ordinal_position;
    `);
    
    console.log('Accounts Table Structure:');
    console.table(accountsQuery.rows);
    console.log('\n');

    // Check sessions table
    const sessionsQuery = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'sessions'
      ORDER BY ordinal_position;
    `);
    
    console.log('Sessions Table Structure:');
    console.table(sessionsQuery.rows);
    console.log('\n');

    // Check verification_tokens table
    const tokensQuery = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'verification_tokens'
      ORDER BY ordinal_position;
    `);
    
    console.log('Verification Tokens Table Structure:');
    console.table(tokensQuery.rows);

  } catch (error) {
    console.error('Error verifying schema:', error);
  } finally {
    await pool.end();
  }
}

verifySchema(); 