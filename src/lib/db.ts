import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

// Allow build to proceed without DATABASE_URL (it will be provided at runtime)
const isBuildTime = process.env.NEXT_PHASE === "phase-production-build";

if (!process.env.DATABASE_URL && !isBuildTime) {
  throw new Error(
    "DATABASE_URL is not set. Please add it to your .env.local file."
  );
}

// Use a placeholder connection string during build time
const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://placeholder@localhost:5432/placeholder";

const pool = new Pool({
  connectionString,
  // Don't actually connect during build time
  ...(isBuildTime && { max: 0 }),
});

export const db = drizzle(pool);
