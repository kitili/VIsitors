import Database from "better-sqlite3";
import { existsSync, readFileSync } from "fs";
import path from "path";
import { VisitRecord } from "@/domain/types";
import { getDatabasePath } from "@/lib/runtime-env";
import { SCHEMA } from "./schema";

const globalForDb = globalThis as typeof globalThis & {
  sqlite?: Database.Database;
};

export function getDatabase(): Database.Database {
  if (!globalForDb.sqlite) {
    const db = new Database(getDatabasePath());
    db.pragma("journal_mode = WAL");
    globalForDb.sqlite = db;
  }
  globalForDb.sqlite.exec(SCHEMA);
  migrateJsonIfNeeded(globalForDb.sqlite);
  return globalForDb.sqlite;
}

function migrateJsonIfNeeded(db: Database.Database) {
  const count = db.prepare("SELECT COUNT(*) AS total FROM visits").get() as { total: number };
  if (count.total > 0) return;

  const jsonPath = path.join(path.dirname(getDatabasePath()), "visits.json");
  if (!existsSync(jsonPath)) return;

  const records = JSON.parse(readFileSync(jsonPath, "utf8")) as VisitRecord[];
  const insert = db.prepare(`
    INSERT INTO visits (
      id, name, phone, purpose, host, campus, date, photo, source, signed_in_at, signed_out_at
    ) VALUES (
      @id, @name, @phone, @purpose, @host, @campus, @date, @photo, @source, @signedInAt, @signedOutAt
    )
  `);

  const tx = db.transaction((rows: VisitRecord[]) => {
    for (const row of rows) {
      insert.run({
        ...row,
        campus: row.campus === "Arusha Town" ? "Arusha Modern" : row.campus,
        photo: row.photo?.startsWith("data:image/") ? null : row.photo,
      });
    }
  });
  tx(records);
}
