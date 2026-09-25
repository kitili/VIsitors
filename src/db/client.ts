import { createClient, type Client, type InArgs, type Row } from "@libsql/client";
import { createClient as createWebClient } from "@libsql/client/web";
import { neon } from "@neondatabase/serverless";
import { existsSync, readFileSync } from "fs";
import path from "path";
import { VisitRecord } from "@/domain/types";
import { getDatabasePath, getDataDir } from "@/lib/runtime-env";
import { type DatabaseKind, getSchemaForKind } from "./schema";

export type SqlExecuteResult = {
  rows: Row[];
  rowsAffected: number;
};

export type SqlClient = {
  execute(input: string | { sql: string; args?: unknown[] }): Promise<SqlExecuteResult>;
};

const globalForSql = globalThis as typeof globalThis & {
  sql?: SqlClient;
  sqlReady?: Promise<void>;
  databaseKind?: DatabaseKind;
};

function postgresConfig(): string | null {
  const url = process.env.DATABASE_URL?.trim();
  if (!url || !url.startsWith("postgres")) return null;
  return url;
}

function tursoConfig() {
  const url = process.env.TURSO_DATABASE_URL?.trim();
  const authToken = process.env.TURSO_AUTH_TOKEN?.trim();
  if (!url) return null;
  return { url, authToken };
}

export function getDatabaseKind(): DatabaseKind {
  if (postgresConfig()) return "postgres";
  if (tursoConfig()) return "turso";
  return "sqlite";
}

/** SQLite file locally, Turso or Neon on Vercel when configured. */
export function getSqlDatabaseUrl(): string {
  const postgres = postgresConfig();
  if (postgres) return "postgres://remote";
  const turso = tursoConfig();
  if (turso) return turso.url;
  return `file:${getDatabasePath()}`;
}

export function isRemoteDatabase(): boolean {
  return getDatabaseKind() !== "sqlite";
}

/** True when visitor data survives redeploys and cold starts. */
export function isPersistentDatabase(): boolean {
  return getDatabaseKind() !== "sqlite";
}

function toPostgresParams(sql: string, args: unknown[]): { sql: string; args: unknown[] } {
  let index = 0;
  const converted = sql.replace(/\?/g, () => `$${++index}`);
  return { sql: converted, args };
}

function parseExecuteInput(input: string | { sql: string; args?: unknown[] }) {
  if (typeof input === "string") {
    return { sql: input, args: [] as unknown[] };
  }
  return { sql: input.sql, args: input.args ?? [] };
}

function wrapLibsqlClient(client: Client): SqlClient {
  return {
    async execute(input) {
      const result =
        typeof input === "string"
          ? await client.execute(input)
          : await client.execute({ sql: input.sql, args: input.args as InArgs | undefined });
      return {
        rows: result.rows,
        rowsAffected: result.rowsAffected ?? 0,
      };
    },
  };
}

function wrapNeonClient(sql: ReturnType<typeof neon>): SqlClient {
  return {
    async execute(input) {
      const { sql: query, args } = parseExecuteInput(input);
      const { sql: pgQuery, args: pgArgs } = toPostgresParams(query, args);
      const rows = await sql.query(pgQuery, pgArgs);
      const rowArray = Array.isArray(rows) ? rows : [];
      return {
        rows: rowArray as Row[],
        rowsAffected: rowArray.length,
      };
    },
  };
}

function createSqlClient(kind: DatabaseKind): SqlClient {
  if (kind === "postgres") {
    const connectionString = postgresConfig();
    if (!connectionString) {
      throw new Error("DATABASE_URL is not configured.");
    }
    return wrapNeonClient(neon(connectionString));
  }

  if (kind === "turso") {
    const turso = tursoConfig();
    if (!turso) {
      throw new Error("TURSO_DATABASE_URL is not configured.");
    }
    return wrapLibsqlClient(
      createWebClient({
        url: turso.url,
        authToken: turso.authToken,
      }),
    );
  }

  return wrapLibsqlClient(createClient({ url: `file:${getDatabasePath()}` }));
}

async function ensureSchema(client: SqlClient, kind: DatabaseKind): Promise<void> {
  const statements = getSchemaForKind(kind)
    .split(";")
    .map((statement) => statement.trim())
    .filter(Boolean);
  for (const sql of statements) {
    await client.execute(sql);
  }
  await migrateVehicleRegColumn(client);
  if (kind === "sqlite") {
    await migrateJsonIfNeeded(client);
  }
}

async function migrateVehicleRegColumn(client: SqlClient): Promise<void> {
  try {
    await client.execute("ALTER TABLE visits ADD COLUMN vehicle_reg TEXT");
  } catch {
    // Column already exists on databases created before vehicle_reg was added.
  }
}

async function migrateJsonIfNeeded(client: SqlClient): Promise<void> {
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
          id, name, phone, purpose, host, campus, vehicle_reg, date, photo, source, signed_in_at, signed_out_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        row.id,
        row.name,
        row.phone,
        row.purpose,
        row.host,
        row.campus === "Arusha Town" ? "Arusha Modern" : row.campus,
        row.vehicleReg ?? null,
        row.date,
        row.photo?.startsWith("data:image/") ? null : row.photo,
        row.source,
        row.signedInAt,
        row.signedOutAt,
      ],
    });
  }
}

export async function getSqlClient(): Promise<SqlClient> {
  const kind = getDatabaseKind();
  if (!globalForSql.sql || globalForSql.databaseKind !== kind) {
    globalForSql.databaseKind = kind;
    globalForSql.sql = createSqlClient(kind);
    globalForSql.sqlReady = ensureSchema(globalForSql.sql, kind);
  }
  await globalForSql.sqlReady;
  return globalForSql.sql;
}
