import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

import * as schema from "@/lib/schema";

const rawDatabaseUrl = process.env.DATABASE_URL ?? "file:local.db";

let url = rawDatabaseUrl;
let authToken: string | undefined;

try {
  const parsed = new URL(rawDatabaseUrl);
  const tokenFromQuery = parsed.searchParams.get("authToken");
  if (tokenFromQuery) {
    parsed.searchParams.delete("authToken");
    url = parsed.toString();
    authToken = tokenFromQuery;
  }
} catch {
  // Non-standard URL (e.g. file:local.db)
}

if (!authToken && process.env.TURSO_AUTH_TOKEN) {
  authToken = process.env.TURSO_AUTH_TOKEN;
}

const client = createClient({
  url,
  authToken,
});

export const db = drizzle(client, { schema });

export type DbClient = typeof db;
