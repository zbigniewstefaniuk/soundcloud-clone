import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import { env } from './env'
import * as schema from '../db/schema'

// Create PostgreSQL connection
const sql = postgres(env.DATABASE_URL, {
  max: 10, // Maximum number of connections in the pool
  idle_timeout: 20, // Close idle connections after 20 seconds
  connect_timeout: 10, // Connection timeout in seconds
})

// Create Drizzle instance
export const db = drizzle(sql, { schema })

// Test database connection
export async function testConnection() {
  try {
    await sql`SELECT 1`
    console.log('✅ Database connected successfully')
    return true
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    return false
  }
}
