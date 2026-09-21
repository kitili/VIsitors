import { PhoneNumber } from "@/domain/PhoneNumber";
import { getTursoClient } from "@/db/turso";
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

export class LibsqlWatchlistRepository implements WatchlistRepository {
  private client() {
    return getTursoClient();
  }

  async all(): Promise<WatchlistEntry[]> {
    const result = await (await this.client()).execute(
      "SELECT * FROM watchlist ORDER BY created_at DESC",
    );
    return result.rows.map((row) => this.toEntry(row as unknown as WatchlistRow));
  }

  async add(input: WatchlistInput): Promise<WatchlistEntry> {
    const name = input.name?.trim() || null;
    const phone = input.phone ? PhoneNumber.digitsOnly(input.phone) : null;
    if (!name && !phone) {
      throw new Error("Add a name or phone number for the watchlist entry.");
    }
    const createdAt = new Date().toISOString();
    const result = await (await this.client()).execute({
      sql: "INSERT INTO watchlist (name, phone, reason, created_at) VALUES (?, ?, ?, ?)",
      args: [name, phone, input.reason.trim(), createdAt],
    });
    return {
      id: Number(result.lastInsertRowid),
      name,
      phone,
      reason: input.reason.trim(),
      createdAt,
    };
  }

  async remove(id: number): Promise<void> {
    await (await this.client()).execute({
      sql: "DELETE FROM watchlist WHERE id = ?",
      args: [id],
    });
  }

  async match(name: string, phone: string): Promise<WatchlistEntry | null> {
    const digits = PhoneNumber.digitsOnly(phone);
    const normalizedName = name.trim().toLowerCase();
    const result = await (await this.client()).execute("SELECT * FROM watchlist");
    for (const row of result.rows) {
      const entry = row as unknown as WatchlistRow;
      if (entry.phone && digits && entry.phone === digits) {
        return this.toEntry(entry);
      }
      if (entry.name && normalizedName && entry.name.trim().toLowerCase() === normalizedName) {
        return this.toEntry(entry);
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
