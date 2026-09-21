export type WatchlistEntry = {
  id: number;
  name: string | null;
  phone: string | null;
  reason: string;
  createdAt: string;
};

export type WatchlistInput = {
  name?: string | null;
  phone?: string | null;
  reason: string;
};

export interface WatchlistRepository {
  all(): Promise<WatchlistEntry[]>;
  add(input: WatchlistInput): Promise<WatchlistEntry>;
  remove(id: number): Promise<void>;
  match(name: string, phone: string): Promise<WatchlistEntry | null>;
}
