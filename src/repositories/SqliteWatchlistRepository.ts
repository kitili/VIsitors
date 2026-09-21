import { PhoneNumber } from "@/domain/PhoneNumber";
import { getDatabase } from "@/db/index";
import {
  WatchlistEntry,
  WatchlistInput,
  WatchlistRepository,
} from "./WatchlistRepository";

type WatchlistRow = {
  id: number;
  name: string | null;
  phone: string | null;
  reason: string;
  created_at: string;
};

export class SqliteWatchlistRepository implements WatchlistRepository {
  async all(): Promise<WatchlistEntry[]> {
    const rows = getDatabase()
      .prepare("SELECT * FROM watchlist ORDER BY created_at DESC")
      .all() as WatchlistRow[];
    return rows.map((row) => this.toEntry(row));
  }

  async add(input: WatchlistInput): Promise<WatchlistEntry> {
    const name = input.name?.trim() || null;
    const phone = input.phone ? PhoneNumber.digitsOnly(input.phone) : null;
    if (!name && !phone) {
      throw new Error("Add a name or phone number for the watchlist entry.");
    }
    const createdAt = new Date().toISOString();
    const result = getDatabase()
      .prepare(
        "INSERT INTO watchlist (name, phone, reason, created_at) VALUES (@name, @phone, @reason, @createdAt)",
      )
      .run({ name, phone, reason: input.reason.trim(), createdAt });
    return {
      id: Number(result.lastInsertRowid),
      name,
      phone,
      reason: input.reason.trim(),
      createdAt,
    };
  }

  async remove(id: number): Promise<void> {
    getDatabase().prepare("DELETE FROM watchlist WHERE id = ?").run(id);
  }

  async match(name: string, phone: string): Promise<WatchlistEntry | null> {
    const digits = PhoneNumber.digitsOnly(phone);
    const normalizedName = name.trim().toLowerCase();
    const rows = getDatabase().prepare("SELECT * FROM watchlist").all() as WatchlistRow[];

    for (const row of rows) {
      if (row.phone && digits && row.phone === digits) {
        return this.toEntry(row);
      }
      if (row.name && normalizedName && row.name.trim().toLowerCase() === normalizedName) {
        return this.toEntry(row);
      }
    }
    return null;
  }

  private toEntry(row: WatchlistRow): WatchlistEntry {
    return {
      id: row.id,
      name: row.name,
      phone: row.phone,
      reason: row.reason,
      createdAt: row.created_at,
    };
  }
}
