import { createClient, type Client } from "@libsql/client";
import { SCHEMA } from "./schema";

const globalForTurso = globalThis as typeof globalThis & {
  turso?: Client;
  tursoReady?: Promise<void>;
};

async function ensureSchema(client: Client): Promise<void> {
  const statements = SCHEMA.split(";")
    .map((statement) => statement.trim())
    .filter(Boolean);
  for (const sql of statements) {
    await client.execute(sql);
  }
}

export async function getTursoClient(): Promise<Client> {
  if (!globalForTurso.turso) {
    const url = process.env.TURSO_DATABASE_URL;
    if (!url) {
      throw new Error("TURSO_DATABASE_URL is not configured.");
    }
    globalForTurso.turso = createClient({
      url,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
    globalForTurso.tursoReady = ensureSchema(globalForTurso.turso);
  }
  await globalForTurso.tursoReady;
  return globalForTurso.turso;
}
