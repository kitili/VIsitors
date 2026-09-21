import { createClient, type Client } from "@libsql/client";
import { createClient as createWebClient } from "@libsql/client/web";
import { existsSync, readFileSync } from "fs";
import path from "path";
import { VisitRecord } from "@/domain/types";
import { getDatabasePath, getDataDir } from "@/lib/runtime-env";
import { SCHEMA } from "./schema";

const globalForSql = globalThis as typeof globalThis & {
  sql?: Client;
  sqlReady?: Promise<void>;
};

function tursoConfig() {
  const url = process.env.TURSO_DATABASE_URL?.trim();
  const authToken = process.env.TURSO_AUTH_TOKEN?.trim();
  if (!url) return null;
  return { url, authToken };
}

/** SQLite file locally, Turso libsql URL on Vercel when configured. */
export function getSqlDatabaseUrl(): string {
  const turso = tursoConfig();
  if (turso) return turso.url;
  return `file:${getDatabasePath()}`;
}

export function isRemoteDatabase(): boolean {
  return Boolean(tursoConfig());
}

/** True when visitor data survives redeploys and cold starts. */
export function isPersistentDatabase(): boolean {
  return isRemoteDatabase();
}

function createSqlClient(): Client {
  const turso = tursoConfig();
  if (turso) {
    // HTTP driver — required for Vercel serverless + Turso.
    return createWebClient({
      url: turso.url,
      authToken: turso.authToken,
    });
  }
  return createClient({ url: getSqlDatabaseUrl() });
}

async function ensureSchema(client: Client): Promise<void> {
  const statements = SCHEMA.split(";")
    .map((statement) => statement.trim())
    .filter(Boolean);
  for (const sql of statements) {
    await client.execute(sql);
  }
  await migrateJsonIfNeeded(client);
}

async function migrateJsonIfNeeded(client: Client): Promise<void> {
  const count = await client.execute("SELECT COUNT(*) AS total FROM visits");
  const total = Number(count.rows[0]?.total ?? 0);
  if (total > 0) return;

  const jsonPath = path.join(getDataDir(), "visits.json");
  if (!existsSync(jsonPath)) return;

  const records = JSON.parse(readFileSync(jsonPath, "utf8")) as VisitRecord[];
  for (const row of records) {
    await client.execute({
      sql: `
        INSERT INTO visits (
          id, name, phone, purpose, host, campus, date, photo, source, signed_in_at, signed_out_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        row.id,
        row.name,
        row.phone,
        row.purpose,
        row.host,
        row.campus === "Arusha Town" ? "Arusha Modern" : row.campus,
        row.date,
        row.photo?.startsWith("data:image/") ? null : row.photo,
        row.source,
        row.signedInAt,
        row.signedOutAt,
      ],
    });
  }
}

export async function getSqlClient(): Promise<Client> {
  if (!globalForSql.sql) {
    globalForSql.sql = createSqlClient();
    globalForSql.sqlReady = ensureSchema(globalForSql.sql);
  }
  await globalForSql.sqlReady;
  return globalForSql.sql;
}
