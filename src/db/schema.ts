export type DatabaseKind = "sqlite" | "turso" | "postgres";

export const SQLITE_SCHEMA = `
CREATE TABLE IF NOT EXISTS visits (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  purpose TEXT NOT NULL,
  host TEXT NOT NULL,
  campus TEXT NOT NULL,
  vehicle_reg TEXT,
  date TEXT NOT NULL,
  photo TEXT,
  source TEXT NOT NULL CHECK(source IN ('desk', 'self')),
  signed_in_at TEXT NOT NULL,
  signed_out_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_visits_campus_date ON visits(campus, date);
CREATE INDEX IF NOT EXISTS idx_visits_signed_out ON visits(signed_out_at);
CREATE INDEX IF NOT EXISTS idx_visits_phone ON visits(phone);

CREATE TABLE IF NOT EXISTS watchlist (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  phone TEXT,
  reason TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_watchlist_phone ON watchlist(phone);

CREATE TABLE IF NOT EXISTS photos (
  id TEXT PRIMARY KEY,
  data BLOB NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'image/jpeg'
);
`;

export const POSTGRES_SCHEMA = `
CREATE TABLE IF NOT EXISTS visits (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  purpose TEXT NOT NULL,
  host TEXT NOT NULL,
  campus TEXT NOT NULL,
  vehicle_reg TEXT,
  date TEXT NOT NULL,
  photo TEXT,
  source TEXT NOT NULL CHECK(source IN ('desk', 'self')),
  signed_in_at TEXT NOT NULL,
  signed_out_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_visits_campus_date ON visits(campus, date);
CREATE INDEX IF NOT EXISTS idx_visits_signed_out ON visits(signed_out_at);
CREATE INDEX IF NOT EXISTS idx_visits_phone ON visits(phone);

CREATE TABLE IF NOT EXISTS watchlist (
  id SERIAL PRIMARY KEY,
  name TEXT,
  phone TEXT,
  reason TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_watchlist_phone ON watchlist(phone);

CREATE TABLE IF NOT EXISTS photos (
  id TEXT PRIMARY KEY,
  data BYTEA NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'image/jpeg'
);
`;

/** @deprecated use getSchemaForKind */
export const SCHEMA = SQLITE_SCHEMA;

export function getSchemaForKind(kind: DatabaseKind): string {
  return kind === "postgres" ? POSTGRES_SCHEMA : SQLITE_SCHEMA;
}
