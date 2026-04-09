import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { getServerEnv } from "@/lib/env/server";
import * as schema from "./schema";

declare global {
  var __kochatPool: Pool | undefined;
  var __kochatPoolListenersAttached: boolean | undefined;
}

const createPool = () =>
  new Pool({
    connectionString: getServerEnv().DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
    keepAlive: true,
  });

export const pool = globalThis.__kochatPool ?? createPool();

if (process.env.NODE_ENV !== "production") {
  globalThis.__kochatPool = pool;
}

if (!globalThis.__kochatPoolListenersAttached) {
  pool.on("error", (error) => {
    console.error("[db] Unexpected pool error", error)
  })

  globalThis.__kochatPoolListenersAttached = true
}

export const db = drizzle(pool, { schema });
