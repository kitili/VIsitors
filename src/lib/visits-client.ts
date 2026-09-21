import { VisitRecord } from "@/domain/Visit";
import type { VisitSource } from "@/domain/types";
import type { WatchlistEntry } from "@/repositories/WatchlistRepository";
import type { NetworkOverview } from "@/services/VisitService";

export async function fetchVisits(params: {
  campus?: string;
  date?: string;
  dateFrom?: string;
  dateTo?: string;
  onSite?: boolean;
  signedOut?: boolean;
  source?: VisitSource;
  search?: string;
}): Promise<VisitRecord[]> {
  const query = new URLSearchParams();
  if (params.campus) query.set("campus", params.campus);
  if (params.date) query.set("date", params.date);
  if (params.dateFrom) query.set("dateFrom", params.dateFrom);
  if (params.dateTo) query.set("dateTo", params.dateTo);
  if (params.onSite) query.set("onSite", "1");
  if (params.signedOut) query.set("signedOut", "1");
  if (params.source) query.set("source", params.source);
  if (params.search) query.set("search", params.search);
  const response = await fetch(`/api/visits?${query.toString()}`, {
    cache: "no-store",
  });
  const payload = (await response.json()) as { visits?: VisitRecord[]; error?: string };
  if (!response.ok) {
    throw new Error(payload.error || "Could not load visits.");
  }
  return payload.visits ?? [];
}

export async function createVisit(input: {
  name: string;
  phone: string;
  purpose: string;
  host: string;
  campus: string;
  photo?: string | null;
  source: "desk" | "self";
}): Promise<VisitRecord> {
  const response = await fetch("/api/visits", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const payload = (await response.json()) as { visit?: VisitRecord; error?: string };
  if (!response.ok || !payload.visit) {
    throw new Error(payload.error || "Could not sign in.");
  }
  return payload.visit;
}

export async function signOutVisit(id: string): Promise<VisitRecord> {
  const response = await fetch(`/api/visits/${id}`, { method: "PATCH" });
  const payload = (await response.json()) as { visit?: VisitRecord; error?: string };
  if (!response.ok || !payload.visit) {
    throw new Error(payload.error || "Could not sign out.");
  }
  return payload.visit;
}

export async function signOutAll(campus: string): Promise<number> {
  const response = await fetch("/api/visits/sign-out-all", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ campus }),
  });
  const payload = (await response.json()) as { count?: number; error?: string };
  if (!response.ok) {
    throw new Error(payload.error || "Could not sign out all visitors.");
  }
  return payload.count ?? 0;
}

export async function checkOutByPhone(phone: string, campus?: string): Promise<VisitRecord> {
  const response = await fetch("/api/visits/check-out", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, campus }),
  });
  const payload = (await response.json()) as { visit?: VisitRecord; error?: string };
  if (!response.ok || !payload.visit) {
    throw new Error(payload.error || "Could not check out.");
  }
  return payload.visit;
}

export async function lookupVisitor(
  phone: string,
  name?: string,
): Promise<{ visit: VisitRecord | null; watchlist: WatchlistEntry | null }> {
  const query = new URLSearchParams({ phone });
  if (name) query.set("name", name);
  const response = await fetch(`/api/visits/lookup?${query.toString()}`, { cache: "no-store" });
  const payload = (await response.json()) as {
    visit?: VisitRecord | null;
    watchlist?: WatchlistEntry | null;
    error?: string;
  };
  if (!response.ok) {
    throw new Error(payload.error || "Lookup failed.");
  }
  return { visit: payload.visit ?? null, watchlist: payload.watchlist ?? null };
}

export async function fetchOverview(): Promise<NetworkOverview> {
  const response = await fetch("/api/overview", { cache: "no-store" });
  const payload = (await response.json()) as NetworkOverview & { error?: string };
  if (!response.ok) {
    throw new Error(payload.error || "Could not load overview.");
  }
  return payload;
}

export async function fetchWatchlist(): Promise<WatchlistEntry[]> {
  const response = await fetch("/api/watchlist", { cache: "no-store" });
  const payload = (await response.json()) as { entries?: WatchlistEntry[]; error?: string };
  if (!response.ok) {
    throw new Error(payload.error || "Could not load watchlist.");
  }
  return payload.entries ?? [];
}

export async function addWatchlistEntry(input: {
  name?: string;
  phone?: string;
  reason: string;
}): Promise<WatchlistEntry> {
  const response = await fetch("/api/watchlist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const payload = (await response.json()) as { entry?: WatchlistEntry; error?: string };
  if (!response.ok || !payload.entry) {
    throw new Error(payload.error || "Could not add watchlist entry.");
  }
  return payload.entry;
}

export async function removeWatchlistEntry(id: number): Promise<void> {
  const response = await fetch(`/api/watchlist/${id}`, { method: "DELETE" });
  const payload = (await response.json()) as { error?: string };
  if (!response.ok) {
    throw new Error(payload.error || "Could not remove watchlist entry.");
  }
}
