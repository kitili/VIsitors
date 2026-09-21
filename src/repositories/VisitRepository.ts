import { Visit } from "@/domain/Visit";
import type { VisitSource } from "@/domain/types";

export type VisitQuery = {
  campus?: string;
  date?: string;
  dateFrom?: string;
  dateTo?: string;
  onSiteOnly?: boolean;
  signedOutOnly?: boolean;
  source?: VisitSource;
  search?: string;
  phone?: string;
  limit?: number;
};

export interface VisitRepository {
  all(): Promise<Visit[]>;
  findById(id: string): Promise<Visit | null>;
  findLatestByPhone(phone: string): Promise<Visit | null>;
  findActiveByPhone(phone: string, campus?: string): Promise<Visit | null>;
  query(filters: VisitQuery): Promise<Visit[]>;
  save(visit: Visit): Promise<void>;
  signOutAll(campus: string, date: string): Promise<number>;
}
