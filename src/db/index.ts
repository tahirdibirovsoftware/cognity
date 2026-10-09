import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

export type Database = NodePgDatabase<typeof schema>;

const globalForDb = globalThis as unknown as {
  __cognityPool?: Pool;
  __cognityDb?: Database;
};

function createPool(connectionString: string) {
  const isLocal = /localhost|127\.0\.0\.1/.test(connectionString);
  return new Pool({
    connectionString,
    max: 5,
    ssl: isLocal ? undefined : { rejectUnauthorized: false },
  });
}

export function getDb(): Database {
  if (globalForDb.__cognityDb) return globalForDb.__cognityDb;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  const pool = createPool(connectionString);
  const db = drizzle(pool, { schema });

  globalForDb.__cognityPool = pool;
  globalForDb.__cognityDb = db;
  return db;
}
