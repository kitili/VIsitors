import { createClient, type Client } from "@libsql/client";
import { existsSync, readFileSync } from "fs";
import path from "path";
import { VisitRecord } from "@/domain/types";
import { getDatabasePath, getDataDir } from "@/lib/runtime-env";
import { SCHEMA } from "./schema";

const globalForSql = globalThis as typeof globalThis & {
  sql?: Client;
  sqlReady?: Promise<void>;
};

/** SQLite file locally, Turso libsql URL on Vercel when configured. */
export function getSqlDatabaseUrl(): string {
  if (process.env.TURSO_DATABASE_URL) {
    return process.env.TURSO_DATABASE_URL;
  }
  return `file:${getDatabasePath()}`;
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
    globalForSql.sql = createClient({
      url: getSqlDatabaseUrl(),
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
    globalForSql.sqlReady = ensureSchema(globalForSql.sql);
  }
  await globalForSql.sqlReady;
  return globalForSql.sql;
}

export function isRemoteDatabase(): boolean {
  return Boolean(process.env.TURSO_DATABASE_URL);
}
