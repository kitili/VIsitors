import { mkdirSync } from "fs";
import path from "path";

export function isVercel(): boolean {
  return Boolean(process.env.VERCEL);
}

export function isTursoEnabled(): boolean {
  return Boolean(process.env.TURSO_DATABASE_URL);
}

/** Writable data directory — /tmp on Vercel, ./data locally. */
export function getDataDir(): string {
  const dir = isVercel()
    ? path.join("/tmp", "silverleaf-visitor-log", "data")
    : path.join(process.cwd(), "data");
  mkdirSync(dir, { recursive: true });
  return dir;
}

export function getPhotosDir(): string {
  const dir = path.join(getDataDir(), "photos");
  mkdirSync(dir, { recursive: true });
  return dir;
}

export function getDatabasePath(): string {
  return path.join(getDataDir(), "visits.db");
}
