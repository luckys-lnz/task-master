import type { Config } from 'drizzle-kit'
import * as dotenv from 'dotenv'

dotenv.config()

export default {
  schema: './lib/db/schema.ts',
  out: './drizzle',
  dbCredentials: {
    host: 'localhost',
    port: 5432,
    user: 'tm',
    password: 'admin',
    database: 'taskmaster',
    ssl: false
  },
  dialect: 'postgresql',
  verbose: true,
  strict: true,
} satisfies Config 