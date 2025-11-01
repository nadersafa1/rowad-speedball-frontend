import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

let pool: Pool | null = null;
let dbInstance: ReturnType<typeof drizzle> | null = null;

function getDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is not set. Please set it in your environment variables."
    );
  }

  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    dbInstance = drizzle(pool);
  }

  return dbInstance!;
}

export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get: (_, prop) => {
    return getDb()[prop as keyof ReturnType<typeof drizzle>];
  },
});
