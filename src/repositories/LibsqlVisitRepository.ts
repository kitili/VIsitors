import { PhoneNumber } from "@/domain/PhoneNumber";
import { Visit } from "@/domain/Visit";
import { VisitRecord } from "@/domain/types";
import { getSqlClient } from "@/db/client";
import { VisitQuery, VisitRepository } from "./VisitRepository";

type VisitRow = {
  id: string;
  name: string;
  phone: string;
  purpose: string;
  host: string;
  campus: string;
  vehicle_reg?: string | null;
  date: string;
  photo: string | null;
  source: "desk" | "self";
  signed_in_at: string;
  signed_out_at: string | null;
};

export class LibsqlVisitRepository implements VisitRepository {
  private client() {
    return getSqlClient();
  }

  async all(): Promise<Visit[]> {
    const result = await (await this.client()).execute("SELECT * FROM visits ORDER BY signed_in_at DESC");
    return result.rows.map((row) => Visit.fromRecord(this.toRecord(row as unknown as VisitRow)));
  }

  async findById(id: string): Promise<Visit | null> {
    const result = await (await this.client()).execute({
      sql: "SELECT * FROM visits WHERE id = ?",
      args: [id],
    });
    const row = result.rows[0] as unknown as VisitRow | undefined;
    return row ? Visit.fromRecord(this.toRecord(row)) : null;
  }

  async findLatestByPhone(phone: string): Promise<Visit | null> {
    const digits = PhoneNumber.digitsOnly(phone);
    if (!digits) return null;
    const result = await (await this.client()).execute({
      sql: "SELECT * FROM visits WHERE phone = ? ORDER BY signed_in_at DESC LIMIT 1",
      args: [digits],
    });
    const row = result.rows[0] as unknown as VisitRow | undefined;
    return row ? Visit.fromRecord(this.toRecord(row)) : null;
  }

  async findActiveByPhone(phone: string, campus?: string): Promise<Visit | null> {
    const digits = PhoneNumber.digitsOnly(phone);
    if (!digits) return null;
    const result = campus
      ? await (await this.client()).execute({
          sql: "SELECT * FROM visits WHERE phone = ? AND campus = ? AND signed_out_at IS NULL ORDER BY signed_in_at DESC LIMIT 1",
          args: [digits, campus],
        })
      : await (await this.client()).execute({
          sql: "SELECT * FROM visits WHERE phone = ? AND signed_out_at IS NULL ORDER BY signed_in_at DESC LIMIT 1",
          args: [digits],
        });
    const row = result.rows[0] as unknown as VisitRow | undefined;
    return row ? Visit.fromRecord(this.toRecord(row)) : null;
  }

  async query(filters: VisitQuery): Promise<Visit[]> {
    const clauses: string[] = [];
    const args: (string | number)[] = [];

    if (filters.campus) {
      clauses.push("campus = ?");
      args.push(filters.campus);
    }
    if (filters.date) {
      clauses.push("date = ?");
      args.push(filters.date);
    }
    if (filters.dateFrom) {
      clauses.push("date >= ?");
      args.push(filters.dateFrom);
    }
    if (filters.dateTo) {
      clauses.push("date <= ?");
      args.push(filters.dateTo);
    }
    if (filters.onSiteOnly) {
      clauses.push("signed_out_at IS NULL");
    }
    if (filters.signedOutOnly) {
      clauses.push("signed_out_at IS NOT NULL");
    }
    if (filters.source) {
      clauses.push("source = ?");
      args.push(filters.source);
    }
    if (filters.phone) {
      clauses.push("phone = ?");
      args.push(PhoneNumber.digitsOnly(filters.phone));
    }
    if (filters.search) {
      clauses.push("(name LIKE ? OR phone LIKE ? OR host LIKE ? OR vehicle_reg LIKE ?)");
      const term = `%${filters.search.trim()}%`;
      args.push(term, term, term, term);
    }

    const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
    const limit = filters.limit ? ` LIMIT ${Math.min(filters.limit, 500)}` : "";
    const result = await (await this.client()).execute({
      sql: `SELECT * FROM visits ${where} ORDER BY signed_in_at DESC${limit}`,
      args,
    });
    return result.rows.map((row) => Visit.fromRecord(this.toRecord(row as unknown as VisitRow)));
  }

  async signOutAll(campus: string, date: string): Promise<number> {
    const now = new Date().toISOString();
    const result = await (await this.client()).execute({
      sql: "UPDATE visits SET signed_out_at = ? WHERE campus = ? AND date = ? AND signed_out_at IS NULL RETURNING id",
      args: [now, campus, date],
    });
    return result.rows.length;
  }

  async save(visit: Visit): Promise<void> {
    const record = visit.toRecord();
    await (await this.client()).execute({
      sql: `
        INSERT INTO visits (
          id, name, phone, purpose, host, campus, vehicle_reg, date, photo, source, signed_in_at, signed_out_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          phone = excluded.phone,
          purpose = excluded.purpose,
          host = excluded.host,
          campus = excluded.campus,
          vehicle_reg = excluded.vehicle_reg,
          date = excluded.date,
          photo = excluded.photo,
          source = excluded.source,
          signed_in_at = excluded.signed_in_at,
          signed_out_at = excluded.signed_out_at
      `,
      args: [
        record.id,
        record.name,
        record.phone,
        record.purpose,
        record.host,
        record.campus,
        record.vehicleReg,
        record.date,
        record.photo,
        record.source,
        record.signedInAt,
        record.signedOutAt,
      ],
    });
  }

  private toRecord(row: VisitRow): VisitRecord {
    return {
      id: row.id,
      name: row.name,
      phone: row.phone,
      purpose: row.purpose,
      host: row.host,
      campus: row.campus,
      vehicleReg: row.vehicle_reg ?? null,
      date: row.date,
      photo: row.photo,
      source: row.source,
      signedInAt: row.signed_in_at,
      signedOutAt: row.signed_out_at,
    };
  }
}
