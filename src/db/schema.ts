export const SCHEMA = `
CREATE TABLE IF NOT EXISTS visits (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  purpose TEXT NOT NULL,
  host TEXT NOT NULL,
  campus TEXT NOT NULL,
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
`;
