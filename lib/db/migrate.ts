import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import * as schema from './schema'
import path from 'path'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined')
}

const connectionString = process.env.DATABASE_URL

// Disable prefetch as it is not supported for "Transaction" pool mode
const client = postgres(connectionString, { 
  prepare: false,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
})

const db = drizzle(client, { schema })

async function main() {
  console.log('Running migrations...')
  
  try {
    await migrate(db, { migrationsFolder: path.join(process.cwd(), 'lib/db/migrations') })
    console.log('✅ Migrations completed successfully')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

main() 