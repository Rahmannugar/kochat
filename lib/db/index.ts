import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { getServerEnv } from "@/lib/env/server";
import * as schema from "./schema";

declare global {
  var __kochatPool: Pool | undefined;
}

const createPool = () =>
  new Pool({
    connectionString: getServerEnv().DATABASE_URL,
  });

export const pool = globalThis.__kochatPool ?? createPool();

if (process.env.NODE_ENV !== "production") {
  globalThis.__kochatPool = pool;
}

export const db = drizzle(pool, { schema });
