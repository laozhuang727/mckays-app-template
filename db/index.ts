import { config } from "dotenv"
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import { customers } from "./schema/customers"

config({ path: ".env.local" })

const databaseUrl = process.env.DATABASE_URL

const dbSchema = {
  // tables
  customers
  // relations
}

function initializeDb(url: string) {
  const client = postgres(url, { prepare: false })
  return drizzlePostgres(client, { schema: dbSchema })
}

// Only initialize database if we have a valid URL
export const db = (databaseUrl && !databaseUrl.includes('your_database_url_here')) 
  ? initializeDb(databaseUrl)
  : null

// Helper function to check if database is available
export const isDatabaseAvailable = () => {
  return db !== null
}
